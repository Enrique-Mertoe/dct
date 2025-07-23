import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/middleware/auth';

async function getPatients(request) {
  // Get all patients with their assigned doctor
  const patients = await prisma.patient.findMany({
    include: {
      assignedDoctor: {
        select: {
          id: true,
          name: true,
        }
      },
      appointments: {
        orderBy: {
          date: 'desc'
        },
        take: 1,
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
  
  // Format the data for the frontend
  const formattedPatients = patients.map(patient => {
    const lastVisit = patient.appointments[0]?.date || null;
    
    return {
      id: patient.id,
      name: `${patient.firstName} ${patient.lastName}`,
      email: patient.email || '',
      phone: patient.phone,
      doctor: patient.assignedDoctor ? patient.assignedDoctor.name : 'Unassigned',
      lastVisit: lastVisit ? lastVisit.toISOString().split('T')[0] : null,
    };
  });
  
  return NextResponse.json(formattedPatients);
}

async function createPatient(request) {
  // Get request body
  const body = await request.json();
  const { 
    firstName, 
    lastName, 
    dateOfBirth, 
    gender, 
    address, 
    phone, 
    email, 
    doctorId, 
    medicalHistory 
  } = body;
  
  // Validate required fields
  if (!firstName || !lastName || !dateOfBirth || !gender || !phone) {
    return NextResponse.json(
      { error: 'Required fields are missing' },
      { status: 400 }
    );
  }
  
  // Create patient
  const patient = await prisma.patient.create({
    data: {
      firstName,
      lastName,
      dateOfBirth: new Date(dateOfBirth),
      gender,
      address: address || '',
      phone,
      email,
      medicalHistory,
      createdBy: {
        connect: { id: request.user.id }
      },
      ...(doctorId && {
        assignedDoctor: {
          connect: { id: doctorId }
        }
      })
    }
  });
  
  // Create audit log
  await prisma.auditLog.create({
    data: {
      action: 'CREATE',
      entityType: 'PATIENT',
      entityId: patient.id,
      details: `Patient created: ${patient.firstName} ${patient.lastName}`,
      userId: request.user.id,
    },
  });
  
  return NextResponse.json(patient, { status: 201 });
}

// Export route handlers with authentication middleware
export const GET = withAuth(getPatients);
export const POST = withAuth(createPatient, { allowedRoles: ['ADMIN', 'RECEPTIONIST'] });