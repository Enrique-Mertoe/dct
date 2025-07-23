import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

/**
 * Authentication middleware for API routes
 * @param {Function} handler - The route handler function
 * @param {Object} options - Options for the middleware
 * @param {Array} options.allowedRoles - Roles allowed to access the route (optional)
 * @returns {Function} - Middleware wrapped handler
 */
export function withAuth(handler, options = {}) {
  return async (request, params) => {
    try {
      // Check authentication
      const user = await getSession('user');
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Check role authorization if roles are specified
      if (options.allowedRoles && options.allowedRoles.length > 0) {
        if (!options.allowedRoles.includes(user.role)) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      }

      // Add user to request context
      request.user = user;
      
      // Call the original handler
      return handler(request, params);
    } catch (error) {
      console.error('Authentication error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}