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
    const dayOfWeek = searchParams.get('dayOfWeek');
    const isActive = searchParams.has('isActive') 
      ? searchParams.get('isActive') === 'true'
      : undefined;
    
    // Build filter conditions
    const where = {};
    
    if (dayOfWeek !== null && dayOfWeek !== undefined) {
      where.dayOfWeek = parseInt(dayOfWeek, 10);
    }
    
    if (isActive !== undefined) {
      where.isActive = isActive;
    }
    
    // Get time slots
    const timeSlots = await prisma.timeSlot.findMany({
      where,
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' }
      ]
    });
    
    return NextResponse.json(timeSlots);
  } catch (error) {
    console.error('Error fetching time slots:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    // Check authentication and authorization
    const user = await getSession('user');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Get request body
    const body = await request.json();
    const { timeSlots } = body;
    
    if (!Array.isArray(timeSlots) || timeSlots.length === 0) {
      return NextResponse.json(
        { error: 'Time slots array is required' },
        { status: 400 }
      );
    }
    
    // Process each time slot
    const results = [];
    
    for (const slot of timeSlots) {
      const { id, startTime, endTime, capacity, dayOfWeek, isActive } = slot;
      
      if (id) {
        // Update existing time slot
        const updatedSlot = await prisma.timeSlot.update({
          where: { id },
          data: {
            startTime,
            endTime,
            capacity,
            dayOfWeek,
            isActive
          }
        });
        results.push(updatedSlot);
      } else {
        // Create new time slot
        const newSlot = await prisma.timeSlot.create({
          data: {
            startTime,
            endTime,
            capacity,
            dayOfWeek,
            isActive: isActive !== undefined ? isActive : true
          }
        });
        results.push(newSlot);
      }
    }
    
    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entityType: 'TIME_SLOTS',
        entityId: 'MULTIPLE',
        details: `Time slots updated by ${user.name}`,
        userId: user.id,
      },
    });
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error updating time slots:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}