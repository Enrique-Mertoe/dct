import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { withAuth } from '@/lib/middleware/auth';

async function getUsers(request) {
  // Parse query parameters
  const { searchParams } = new URL(request.url);
  const roleFilter = searchParams.get('role');
  
  // Allow receptionists to get physiotherapists for appointment scheduling
  if (request.user.role !== 'ADMIN' && 
      !(request.user.role === 'RECEPTIONIST' && roleFilter === 'PHYSIOTHERAPIST')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  // Build query
  const where = {};
  if (roleFilter) {
    where.role = roleFilter;
  }
  
  // Get users based on filters
  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      // Don't include password
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
  
  // Add status field (in a real app, you might have this in the database)
  const usersWithStatus = users.map(user => ({
    ...user,
    status: 'ACTIVE' // In a real app, this would come from the database
  }));
  
  return NextResponse.json(usersWithStatus);
}

async function createUser(request) {
  // Check if user is admin
  if (request.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  // Get request body
  const body = await request.json();
  const { name, email, password, role } = body;
  
  // Validate input
  if (!name || !email || !password || !role) {
    return NextResponse.json(
      { error: 'Name, email, password, and role are required' },
      { status: 400 }
    );
  }
  
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });
  
  if (existingUser) {
    return NextResponse.json(
      { error: 'User with this email already exists' },
      { status: 400 }
    );
  }
  
  // Hash password using Argon2
  const hashedPassword = await hashPassword(password);
  
  // Create user
  const newUser = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
    }
  });
  
  // Create audit log
  await prisma.auditLog.create({
    data: {
      action: 'CREATE',
      entityType: 'USER',
      entityId: newUser.id,
      details: `User created: ${newUser.email}`,
      userId: request.user.id,
    },
  });
  
  // Return user without password
  const { password: _, ...userWithoutPassword } = newUser;
  return NextResponse.json(userWithoutPassword, { status: 201 });
}

// Export route handlers with authentication middleware
export const GET = withAuth(getUsers);
export const POST = withAuth(createUser, { allowedRoles: ['ADMIN'] });