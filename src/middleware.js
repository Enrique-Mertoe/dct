import {NextResponse} from 'next/server';
import {getSession} from './lib/session';

// Define public paths that don't require authentication
const publicPaths = ['/login', '/api/auth/login'];

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  // Allow access to public paths without authentication
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }
  
  // Ensure session exists
  // const cookieStore = cookies();
  // const sessionId = ensureSession(cookieStore);
  
  // Check if user is authenticated
  const user = await getSession('user');

  
  // If no user in session, redirect to login
  if (!user && !pathname.startsWith('/api/auth')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // For API routes that require authentication
  if (!user && pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Add session ID to response headers if it's new
  // if (!cookieStore.get('session_id')) {
  //   response.cookies.set('session_id', sessionId, {
  //     httpOnly: true,
  //     secure: process.env.NODE_ENV === 'production',
  //     sameSite: 'lax',
  //     maxAge: 60 * 60 * 24 * 7, // 1 week
  //   });
  // }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except static files and favicon
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};