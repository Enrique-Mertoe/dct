import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/middleware/auth';

// Get a specific appointment
async function getAppointment(request, { params }) {
  const { id } = await params;
  
  // Get appointment
  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: {
      patient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          dateOfBirth: true,
          gender: true,
          phone: true,
          email: true,
          assignedDoctorId: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      timeSlot: true,
      treatment: request.user.role === 'PHYSIOTHERAPIST' || request.user.role === 'ADMIN',
    },
  });
  
  if (!appointment) {
    return NextResponse.json(
      { error: 'Appointment not found' },
      { status: 404 }
    );
  }
  
  // Check access permissions
  if (request.user.role === 'PHYSIOTHERAPIST' && appointment.userId !== request.user.id) {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    );
  }
  
  if (request.user.role === 'PATIENT') {
    // Check if the appointment belongs to the patient
    const patient = await prisma.patient.findFirst({
      where: {
        createdBy: {
          email: request.user.email,
        },
      },
    });
    
    if (!patient || appointment.patientId !== patient.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
  }
  
  return NextResponse.json(appointment);
}

// Update an appointment
async function updateAppointment(request, { params }) {
  const { id } = await params;
  
  // Get appointment
  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: {
      patient: true,
      user: true,
    },
  });
  
  if (!appointment) {
    return NextResponse.json(
      { error: 'Appointment not found' },
      { status: 404 }
    );
  }
  
  // Check access permissions for physiotherapists
  if (request.user.role === 'PHYSIOTHERAPIST' && appointment.userId !== request.user.id) {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    );
  }
  
  // Patients cannot update appointments
  if (request.user.role === 'PATIENT') {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    );
  }
  
  // Get request body
  const {
    date,
    timeSlotId,
    patientId,
    userId,
    notes,
    status,
  } = await request.json();
  
  // Prepare update data
  const updateData = {};
  
  // Only receptionists and admins can change date, time slot, patient, or doctor
  if ((request.user.role === 'RECEPTIONIST' || request.user.role === 'ADMIN')) {
    if (date) updateData.date = new Date(date);
    if (timeSlotId) updateData.timeSlotId = timeSlotId;
    if (patientId) updateData.patientId = patientId;
    if (userId) updateData.userId = userId;
  }
  
  // All roles except patients can update notes and status
  if (notes) updateData.notes = notes;
  if (status) updateData.status = status;
  
  // Update appointment
  const updatedAppointment = await prisma.appointment.update({
    where: { id },
    data: updateData,
    include: {
      patient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
        },
      },
      timeSlot: true,
    },
  });
  
  // Create audit log
  await prisma.auditLog.create({
    data: {
      action: 'UPDATE',
      entityType: 'APPOINTMENT',
      entityId: updatedAppointment.id,
      details: `Appointment updated for patient: ${updatedAppointment.patient.firstName} ${updatedAppointment.patient.lastName}`,
      userId: request.user.id,
    },
  });
  
  return NextResponse.json(updatedAppointment);
}

// Delete an appointment (receptionist or admin only)
async function deleteAppointment(request, { params }) {
  const { id } = await params;
  
  // Only receptionists and admins can delete appointments
  if (request.user.role !== 'RECEPTIONIST' && request.user.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    );
  }
  
  // Check if appointment exists
  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: {
      patient: true,
      user: true,
    },
  });
  
  if (!appointment) {
    return NextResponse.json(
      { error: 'Appointment not found' },
      { status: 404 }
    );
  }
  
  // Delete appointment
  await prisma.appointment.delete({
    where: { id },
  });
  
  // Create audit log
  await prisma.auditLog.create({
    data: {
      action: 'DELETE',
      entityType: 'APPOINTMENT',
      entityId: id,
      details: `Appointment deleted for patient: ${appointment.patient.firstName} ${appointment.patient.lastName} with doctor: ${appointment.user.name}`,
      userId: request.user.id,
    },
  });
  
  return NextResponse.json({ success: true });
}

// Export route handlers with authentication middleware
export const GET = withAuth(getAppointment);
export const PUT = withAuth(updateAppointment);
export const DELETE = withAuth(deleteAppointment, { allowedRoles: ['RECEPTIONIST', 'ADMIN'] });