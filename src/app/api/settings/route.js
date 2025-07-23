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
    
    // Parse query parameters to see if we're requesting specific settings
    const { searchParams } = new URL(request.url);
    const keys = searchParams.get('keys');
    
    // If specific keys are requested and user is not admin, only allow certain settings
    if (keys && user.role !== 'ADMIN') {
      const allowedKeys = ['workingDays', 'workingHoursStart', 'workingHoursEnd'];
      const requestedKeys = keys.split(',');
      
      // Check if all requested keys are allowed
      const hasDisallowedKeys = requestedKeys.some(key => !allowedKeys.includes(key));
      if (hasDisallowedKeys) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      
      // Get only the requested settings
      const settings = await prisma.configuration.findMany({
        where: {
          key: {
            in: requestedKeys
          }
        }
      });
      
      // Convert to key-value object
      const settingsObject = settings.reduce((acc, setting) => {
        try {
          // Try to parse as JSON if possible
          acc[setting.key] = JSON.parse(setting.value);
        } catch (e) {
          // Otherwise use as string
          acc[setting.key] = setting.value;
        }
        return acc;
      }, {});
      
      return NextResponse.json(settingsObject);
    }
    
    // For admin users, get all settings
    if (user.role === 'ADMIN') {
      const settings = await prisma.configuration.findMany();
      
      // Convert to key-value object
      const settingsObject = settings.reduce((acc, setting) => {
        try {
          // Try to parse as JSON if possible
          acc[setting.key] = JSON.parse(setting.value);
        } catch (e) {
          // Otherwise use as string
          acc[setting.key] = setting.value;
        }
        return acc;
      }, {});
      
      return NextResponse.json(settingsObject);
    }
    
    // Non-admin users without specific keys requested are forbidden
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    // Check authentication and authorization
    const user = await getSession('user');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Get request body
    const settings = await request.json();
    
    // Update or create each setting
    const results = [];
    
    for (const [key, value] of Object.entries(settings)) {
      const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
      
      const result = await prisma.configuration.upsert({
        where: { key },
        update: { value: stringValue },
        create: {
          key,
          value: stringValue,
          description: `Setting for ${key}`
        }
      });
      
      results.push(result);
    }
    
    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entityType: 'SETTINGS',
        entityId: 'MULTIPLE',
        details: `System settings updated by ${user.name}`,
        userId: user.id,
      },
    });
    
    return NextResponse.json({ success: true, count: results.length });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}