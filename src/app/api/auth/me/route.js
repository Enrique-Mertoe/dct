import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function GET(request) {
  try {
    // Get user from session
    const user = await getSession('user');
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Return user data
    return NextResponse.json(user);
  } catch (error) {
    console.error('Get current user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}