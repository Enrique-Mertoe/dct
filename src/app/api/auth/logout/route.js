import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession, clearSession } from '@/lib/session';

export async function POST(request) {
  try {
    // Get user from session
    const user = await getSession('user');
    
    // If user exists in session, create audit log
    if (user) {
      await prisma.auditLog.create({
        data: {
          action: 'LOGOUT',
          entityType: 'USER',
          entityId: user.id,
          details: `User logged out: ${user.email}`,
          userId: user.id,
        },
      });
    }
    
    // Clear the session
    await clearSession();
    
    // Create response
    const response = NextResponse.json({ success: true });
    
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}