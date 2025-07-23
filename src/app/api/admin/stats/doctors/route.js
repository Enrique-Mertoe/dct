import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET(request) {
  try {
    // Check authentication and authorization
    const user = await getSession('user');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Get total physiotherapists count
    const total = await prisma.user.count({
      where: {
        role: 'PHYSIOTHERAPIST'
      }
    });
    
    // Get active physiotherapists (those with appointments in the last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const activePhysiotherapists = await prisma.user.count({
      where: {
        role: 'PHYSIOTHERAPIST',
        appointments: {
          some: {
            date: {
              gte: thirtyDaysAgo
            }
          }
        }
      }
    });
    
    return NextResponse.json({
      total,
      active: activePhysiotherapists
    });
  } catch (error) {
    console.error('Error fetching doctor stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}