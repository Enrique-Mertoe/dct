import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/middleware/auth';

async function getAppointments(request) {
  // Parse query parameters
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const date = searchParams.get('date');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const doctorId = searchParams.get('doctorId');
  
  // Build filter conditions
  const where = {};
  
  if (status) {
    where.status = status;
  }
  
  if (doctorId) {
    where.userId = doctorId;
  }
  
  // Handle date filtering
  if (date) {
    // Single date filter
    const dateStart = new Date(date);
    dateStart.setHours(0, 0, 0, 0);
    
    const dateEnd = new Date(date);
    dateEnd.setHours(23, 59, 59, 999);
    
    where.date = {
      gte: dateStart,
      lte: dateEnd
    };
  } else if (startDate && endDate) {
    // Date range filter
    const rangeStart = new Date(startDate);
    rangeStart.setHours(0, 0, 0, 0);
    
    const rangeEnd = new Date(endDate);
    rangeEnd.setHours(23, 59, 59, 999);
    
    where.date = {
      gte: rangeStart,
      lte: rangeEnd
    };
  }
  
  // Get appointments with patient and doctor info
  const appointments = await prisma.appointment.findMany({
    where,
    include: {
      patient: true,
      user: true,
      timeSlot: true
    },
    orderBy: {
      date: 'asc'
    }
  });
  
  // Format the data for the frontend
  const formattedAppointments = appointments.map(appointment => {
    const appointmentDate = appointment.date.toISOString().split('T')[0];
    
    return {
      id: appointment.id,
      patientId: appointment.patientId,
      doctorId: appointment.userId,
      timeSlotId: appointment.timeSlotId,
      patientName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
      doctorName: appointment.user.name,
      date: appointmentDate,
      time: `${appointment.timeSlot.startTime} - ${appointment.timeSlot.endTime}`,
      status: appointment.status,
      type: appointment.notes || 'Regular Appointment',
      notes: appointment.notes
    };
  });
  
  return NextResponse.json(formattedAppointments);
}

async function createAppointment(request) {
  // Get request body
  const body = await request.json();
  const { patientId, doctorId, date, timeSlotId, notes } = body;
  
  // Validate required fields
  if (!patientId || !doctorId || !date || !timeSlotId) {
    return NextResponse.json(
      { error: 'Required fields are missing' },
      { status: 400 }
    );
  }
  
  // Create appointment
  const appointment = await prisma.appointment.create({
    data: {
      date: new Date(date),
      notes,
      patient: {
        connect: { id: patientId }
      },
      user: {
        connect: { id: doctorId }
      },
      status: 'SCHEDULED',
      timeSlot: {
        connect: { id: timeSlotId }
      }
    },
    include: {
      patient: true,
      user: true,
      timeSlot: true
    }
  });
  
  // Create audit log
  await prisma.auditLog.create({
    data: {
      action: 'CREATE',
      entityType: 'APPOINTMENT',
      entityId: appointment.id,
      details: `Appointment created for ${appointment.patient.firstName} ${appointment.patient.lastName} with ${appointment.user.name}`,
      userId: request.user.id,
    },
  });
  
  return NextResponse.json(appointment, { status: 201 });
}

// Export route handlers with authentication middleware
export const GET = withAuth(getAppointments);
export const POST = withAuth(createAppointment, { allowedRoles: ['ADMIN', 'RECEPTIONIST'] });