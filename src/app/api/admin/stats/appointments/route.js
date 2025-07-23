import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';
import {withAuth} from "@/lib/middleware/auth";

async function _GET(request) {
  try {
    // Check authentication and authorization
    const user = await getSession('user');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Get total appointments count
    const total = await prisma.appointment.count();
    
    // Get upcoming appointments (today and future)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const upcoming = await prisma.appointment.count({
      where: {
        date: {
          gte: today
        },
        status: {
          in: ['SCHEDULED', 'CONFIRMED']
        }
      }
    });
    
    // Get today's appointments
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const today_count = await prisma.appointment.count({
      where: {
        date: {
          gte: today,
          lt: tomorrow
        }
      }
    });
    
    // Get completed appointments
    const completed = await prisma.appointment.count({
      where: {
        status: 'COMPLETED'
      }
    });
    
    return NextResponse.json({
      total,
      upcoming,
      today: today_count,
      completed
    });
  } catch (error) {
    console.error('Error fetching appointment stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(_GET);