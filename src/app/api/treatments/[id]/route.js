import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserByToken } from '@/lib/auth';

// Get a specific treatment
export async function GET(request, { params }) {
  try {
    const { id } = params;
    
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
    
    // Get treatment
    const treatment = await prisma.treatment.findUnique({
      where: { id },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            dateOfBirth: true,
            gender: true,
            medicalHistory: true,
          },
        },
        physiotherapist: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        appointment: {
          select: {
            id: true,
            date: true,
            status: true,
            notes: true,
          },
        },
      },
    });
    
    if (!treatment) {
      return NextResponse.json(
        { error: 'Treatment not found' },
        { status: 404 }
      );
    }
    
    // Check access permissions for physiotherapists
    if (currentUser.role === 'PHYSIOTHERAPIST' && treatment.physiotherapistId !== currentUser.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(treatment);
  } catch (error) {
    console.error('Get treatment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update a treatment
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    
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
    
    // Only physiotherapists and admins can update treatments
    if (currentUser.role !== 'PHYSIOTHERAPIST' && currentUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    // Get treatment
    const treatment = await prisma.treatment.findUnique({
      where: { id },
      include: {
        patient: true,
      },
    });
    
    if (!treatment) {
      return NextResponse.json(
        { error: 'Treatment not found' },
        { status: 404 }
      );
    }
    
    // Check access permissions for physiotherapists
    if (currentUser.role === 'PHYSIOTHERAPIST' && treatment.physiotherapistId !== currentUser.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    // Get request body
    const {
      notes,
      homeProgram,
      progress,
    } = await request.json();
    
    // Prepare update data
    const updateData = {};
    if (notes) updateData.notes = notes;
    if (homeProgram !== undefined) updateData.homeProgram = homeProgram;
    if (progress !== undefined) updateData.progress = progress;
    
    // Update treatment
    const updatedTreatment = await prisma.treatment.update({
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
        physiotherapist: {
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
        entityType: 'TREATMENT',
        entityId: updatedTreatment.id,
        details: `Treatment updated for patient: ${updatedTreatment.patient.firstName} ${updatedTreatment.patient.lastName}`,
        userId: currentUser.id,
      },
    });
    
    return NextResponse.json(updatedTreatment);
  } catch (error) {
    console.error('Update treatment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete a treatment (admin only)
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    
    // Get token from cookies
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Verify user is admin
    const currentUser = await getUserByToken(token);
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    // Check if treatment exists
    const treatment = await prisma.treatment.findUnique({
      where: { id },
      include: {
        patient: true,
        appointment: true,
      },
    });
    
    if (!treatment) {
      return NextResponse.json(
        { error: 'Treatment not found' },
        { status: 404 }
      );
    }
    
    // Delete treatment
    await prisma.treatment.delete({
      where: { id },
    });
    
    // Update appointment status back to CONFIRMED
    await prisma.appointment.update({
      where: { id: treatment.appointmentId },
      data: { status: 'CONFIRMED' },
    });
    
    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'DELETE',
        entityType: 'TREATMENT',
        entityId: id,
        details: `Treatment deleted for patient: ${treatment.patient.firstName} ${treatment.patient.lastName}`,
        userId: currentUser.id,
      },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete treatment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}