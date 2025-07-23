'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/apiService';
import { Box, CircularProgress } from '@mui/material';

export default function RoleBasedLayout({ 
  children, 
  allowedRoles = [], // Array of roles allowed to access this layout
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const response = await authService.getCurrentUser();
        const userData = response.data;
        
        // Check if user's role is in the allowed roles
        if (userData && allowedRoles.includes(userData.role)) {
          setAuthorized(true);
        } else {
          // Redirect to 404 if role is not allowed
          router.push('/not-found');
        }
      } catch (error) {
        console.error('Error checking user role:', error);
        // Redirect to login if not authenticated
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();
  }, [router, allowedRoles]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Only render children if authorized
  return authorized ? children : null;
}