import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserByToken } from '@/lib/auth';

// Get all treatments (with role-based access)
export async function GET(request) {
  try {
    // Get token from cookies
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Verify user
    const currentUser = await getUserByToken(token);
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Patients and receptionists cannot access treatments
    if (currentUser.role === 'PATIENT' || currentUser.role === 'RECEPTIONIST') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    
    // Build query based on role and filters
    let query = {};
    
    // Filter by patient
    if (patientId) {
      query.where = {
        ...query.where,
        patientId,
      };
    }
    
    // Physiotherapists can only see their own treatments
    if (currentUser.role === 'PHYSIOTHERAPIST') {
      query.where = {
        ...query.where,
        physiotherapistId: currentUser.id,
      };
    }
    
    // Get treatments
    const treatments = await prisma.treatment.findMany({
      ...query,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        physiotherapist: {
          select: {
            id: true,
            name: true,
          },
        },
        appointment: {
          select: {
            id: true,
            date: true,
            status: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });
    
    return NextResponse.json(treatments);
  } catch (error) {
    console.error('Get treatments error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create a new treatment (physiotherapist or admin only)
export async function POST(request) {
  try {
    // Get token from cookies
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Verify user
    const currentUser = await getUserByToken(token);
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Only physiotherapists and admins can create treatments
    if (currentUser.role !== 'PHYSIOTHERAPIST' && currentUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    // Get request body
    const {
      appointmentId,
      notes,
      homeProgram,
      progress,
    } = await request.json();
    
    // Validate required fields
    if (!appointmentId || !notes) {
      return NextResponse.json(
        { error: 'Required fields are missing' },
        { status: 400 }
      );
    }
    
    // Check if appointment exists
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: true,
      },
    });
    
    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }
    
    // Check if physiotherapist is assigned to the appointment
    if (currentUser.role === 'PHYSIOTHERAPIST' && appointment.userId !== currentUser.id) {
      return NextResponse.json(
        { error: 'You are not assigned to this appointment' },
        { status: 403 }
      );
    }
    
    // Check if treatment already exists for this appointment
    const existingTreatment = await prisma.treatment.findUnique({
      where: { appointmentId },
    });
    
    if (existingTreatment) {
      return NextResponse.json(
        { error: 'Treatment already exists for this appointment' },
        { status: 400 }
      );
    }
    
    // Create treatment
    const treatment = await prisma.treatment.create({
      data: {
        date: appointment.date,
        notes,
        homeProgram,
        progress,
        patientId: appointment.patientId,
        physiotherapistId: currentUser.role === 'PHYSIOTHERAPIST' ? currentUser.id : appointment.userId,
        appointmentId,
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        physiotherapist: {
          select: {
            id: true,
            name: true,
          },
        },
        appointment: {
          select: {
            id: true,
            date: true,
          },
        },
      },
    });
    
    // Update appointment status to COMPLETED
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: 'COMPLETED' },
    });
    
    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entityType: 'TREATMENT',
        entityId: treatment.id,
        details: `Treatment created for patient: ${appointment.patient.firstName} ${appointment.patient.lastName}`,
        userId: currentUser.id,
      },
    });
    
    return NextResponse.json(treatment, { status: 201 });
  } catch (error) {
    console.error('Create treatment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}