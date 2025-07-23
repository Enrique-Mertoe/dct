'use server';

import { getSession } from './session';
import { redirect } from 'next/navigation';

/**
 * Gets the current authenticated user from the session
 * For use in Server Components and Server Actions
 */
export async function getUser() {
  const user = await getSession('user');
  return user;
}

/**
 * Checks if the user is authenticated and has the required role
 * For use in Server Components and Server Actions
 * @param {string|string[]} requiredRole - The role(s) required to access the resource
 * @param {string} redirectTo - Where to redirect if authentication fails
 */
export async function requireAuth(requiredRole = null, redirectTo = '/login') {
  const user = await getUser();
  
  // If no user is found, redirect to login
  if (!user) {
    redirect(redirectTo);
  }
  
  // If a role is required, check if the user has it
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    
    if (!roles.includes(user.role)) {
      // Redirect to appropriate dashboard based on role
      redirect(`/${user.role.toLowerCase()}`);
    }
  }
  
  return user;
}

/**
 * Checks if the current request is authenticated
 * For use in Server Components and Server Actions
 * @returns {Promise<boolean>} - Whether the user is authenticated
 */
export async function isAuthenticated() {
  const user = await getUser();
  return !!user;
}