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
    
    // Only allow receptionists and admins to access patient count
    if (user.role !== 'RECEPTIONIST' && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Get total patients count
    const count = await prisma.patient.count();
    
    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error fetching patient count:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}