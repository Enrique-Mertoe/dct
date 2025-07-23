import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET(request) {
  try {
    // Check authentication
    const user = await getSession('user');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const timeSlotId = searchParams.get('timeSlotId');
    const doctorId = searchParams.get('doctorId');
    
    // Validate required parameters
    if (!date || !timeSlotId) {
      return NextResponse.json(
        { error: 'Date and timeSlotId are required' },
        { status: 400 }
      );
    }
    
    // Get the time slot
    const timeSlot = await prisma.timeSlot.findUnique({
      where: { id: timeSlotId },
    });
    
    if (!timeSlot) {
      return NextResponse.json(
        { error: 'Time slot not found' },
        { status: 404 }
      );
    }
    
    // Count existing appointments for this time slot and date
    const appointmentsCount = await prisma.appointment.count({
      where: {
        date: {
          gte: new Date(`${date}T00:00:00.000Z`),
          lt: new Date(`${date}T23:59:59.999Z`),
        },
        timeSlotId,
        ...(doctorId && { userId: doctorId }),
      },
    });
    
    // Check if the time slot is available
    const remainingCapacity = timeSlot.capacity - appointmentsCount;
    const available = remainingCapacity > 0;
    
    return NextResponse.json({
      available,
      remainingCapacity,
      capacity: timeSlot.capacity,
      booked: appointmentsCount,
    });
  } catch (error) {
    console.error('Error checking appointment availability:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}