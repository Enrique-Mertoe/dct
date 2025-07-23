import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/middleware/auth';

// Get a specific patient
async function getPatient(request, { params }) {
  const { id } = await params;
  
  // Get patient
  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      assignedDoctor: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      appointments: {
        include: {
          timeSlot: true,
          treatment: true,
          user: true,
        },
        orderBy: {
          date: 'desc',
        },
      },
      treatments: {
        include: {
          physiotherapist: true,
        },
        orderBy: {
          date: 'desc',
        },
      },
    },
  });
  
  if (!patient) {
    return NextResponse.json(
      { error: 'Patient not found' },
      { status: 404 }
    );
  }
  
  // Check access permissions
  if (request.user.role === 'PHYSIOTHERAPIST' && patient.assignedDoctorId !== request.user.id) {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    );
  }
  
  // Remove sensitive data for receptionists
  if (request.user.role === 'RECEPTIONIST') {
    // Remove medical notes and treatment details
    const { treatments, ...patientData } = patient;
    const sanitizedAppointments = patientData.appointments.map(appointment => {
      const { treatment, ...appointmentData } = appointment;
      return appointmentData;
    });
    
    return NextResponse.json({
      ...patientData,
      appointments: sanitizedAppointments,
    });
  }
  
  return NextResponse.json(patient);
}

// Update a patient
async function updatePatient(request, { params }) {
  const { id } = await params;
  
  // Only receptionists, physiotherapists, and admins can update patients
  if (request.user.role === 'PATIENT') {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    );
  }
  
  // Get patient
  const patient = await prisma.patient.findUnique({
    where: { id },
  });
  
  if (!patient) {
    return NextResponse.json(
      { error: 'Patient not found' },
      { status: 404 }
    );
  }
  
  // Physiotherapists can only update their assigned patients
  if (request.user.role === 'PHYSIOTHERAPIST' && patient.assignedDoctorId !== request.user.id) {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    );
  }
  
  // Get request body
  const {
    firstName,
    lastName,
    dateOfBirth,
    gender,
    address,
    phone,
    email,
    emergencyContact,
    medicalHistory,
    assignedDoctorId,
  } = await request.json();
  
  // Prepare update data
  const updateData = {};
  if (firstName) updateData.firstName = firstName;
  if (lastName) updateData.lastName = lastName;
  if (dateOfBirth) updateData.dateOfBirth = new Date(dateOfBirth);
  if (gender) updateData.gender = gender;
  if (address !== undefined) updateData.address = address;
  if (phone) updateData.phone = phone;
  if (email !== undefined) updateData.email = email;
  if (emergencyContact) updateData.emergencyContact = emergencyContact;
  
  // Only physiotherapists and admins can update medical history
  if (medicalHistory !== undefined && (request.user.role === 'PHYSIOTHERAPIST' || request.user.role === 'ADMIN')) {
    updateData.medicalHistory = medicalHistory;
  }
  
  // Only admins can reassign doctors
  if (assignedDoctorId && request.user.role === 'ADMIN') {
    updateData.assignedDoctorId = assignedDoctorId;
  }
  
  // Update patient
  const updatedPatient = await prisma.patient.update({
    where: { id },
    data: updateData,
    include: {
      assignedDoctor: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
  
  // Create audit log
  await prisma.auditLog.create({
    data: {
      action: 'UPDATE',
      entityType: 'PATIENT',
      entityId: updatedPatient.id,
      details: `Patient updated: ${updatedPatient.firstName} ${updatedPatient.lastName}`,
      userId: request.user.id,
    },
  });
  
  return NextResponse.json(updatedPatient);
}

// Delete a patient (admin only)
async function deletePatient(request, { params }) {
  const { id } = await params;
  
  // Only admins can delete patients
  if (request.user.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    );
  }
  
  // Check if patient exists
  const patient = await prisma.patient.findUnique({
    where: { id },
  });
  
  if (!patient) {
    return NextResponse.json(
      { error: 'Patient not found' },
      { status: 404 }
    );
  }
  
  // Delete patient
  await prisma.patient.delete({
    where: { id },
  });
  
  // Create audit log
  await prisma.auditLog.create({
    data: {
      action: 'DELETE',
      entityType: 'PATIENT',
      entityId: id,
      details: `Patient deleted: ${patient.firstName} ${patient.lastName}`,
      userId: request.user.id,
    },
  });
  
  return NextResponse.json({ success: true });
}

// Export route handlers with authentication middleware
export const GET = withAuth(getPatient);
export const PUT = withAuth(updatePatient);
export const DELETE = withAuth(deletePatient, { allowedRoles: ['ADMIN'] });