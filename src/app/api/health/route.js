import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Basic health check response
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'dct-api',
      checks: {
        database: 'pending'
      }
    };

    // Test database connectivity
    try {
      await prisma.$queryRaw`SELECT 1`;
      healthStatus.checks.database = 'healthy';
    } catch (dbError) {
      healthStatus.checks.database = 'unhealthy';
      healthStatus.status = 'degraded';
      console.error('Database health check failed:', dbError);
    }

    // Return appropriate status code
    const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
    
    return NextResponse.json(healthStatus, { status: statusCode });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'dct-api',
      error: 'Internal server error during health check'
    }, { status: 503 });
  }
}