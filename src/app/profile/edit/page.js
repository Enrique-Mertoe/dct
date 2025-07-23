'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/apiService';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Grid,
  TextField,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Tabs,
  Tab,
  Alert,
  Divider,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DashboardIcon from '@mui/icons-material/Dashboard';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function EditProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await authService.getCurrentUser();
        const userData = response.data;
        setUser(userData);
        
        setFormData({
          name: userData.name || '',
          email: userData.email || '',
          password: '',
          confirmPassword: '',
        });
      } catch (error) {
        console.error('Error fetching user data:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    
    try {
      // Validate passwords if on password tab
      if (tabValue === 1) {
        if (!formData.password) {
          throw new Error('Password is required');
        }
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match');
        }
      }
      
      // Prepare data for API
      const dataToSubmit = {
        name: formData.name,
        email: formData.email,
      };
      
      // Only include password if on password tab
      if (tabValue === 1 && formData.password) {
        dataToSubmit.password = formData.password;
      }
      
      // Call API to update profile
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSubmit),
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }
      
      // Show success message
      setSuccess(true);
      
      // Reset password fields
      if (tabValue === 1) {
        setFormData({
          ...formData,
          password: '',
          confirmPassword: '',
        });
      }
      
      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/profile');
      }, 2000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.message || 'Failed to update profile. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Create menu items based on user role
  const getMenuItems = () => {
    if (!user) return [];
    
    const baseItem = {
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: `/${user.role.toLowerCase()}`,
      active: false,
    };
    
    return [baseItem];
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <DashboardLayout title="Edit Profile" menuItems={getMenuItems()} user={user}>
      <Box sx={{ flexGrow: 1 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Profile updated successfully! Redirecting...
          </Alert>
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
          <Button 
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push('/profile')}
          >
            Back to Profile
          </Button>
          <Button 
            variant="contained" 
            startIcon={<SaveIcon />}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={24} /> : 'Save Changes'}
          </Button>
        </Box>

        <Paper sx={{ mb: 3 }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': {
                fontWeight: 'bold',
              },
              '& .Mui-selected': {
                color: 'primary.main',
              },
            }}
          >
            <Tab icon={<PersonIcon />} label="Personal Information" />
            <Tab icon={<LockIcon />} label="Change Password" />
          </Tabs>
        </Paper>

        <Card>
          <CardContent>
            {tabValue === 0 && (
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }} offset={{ xs: 0, md: 0 }}>
                  <TextField
                    fullWidth
                    label="Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    margin="normal"
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }} offset={{ xs: 0, md: 0 }}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    margin="normal"
                    required
                    disabled
                  />
                </Grid>
              </Grid>
            )}
            
            {tabValue === 1 && (
              <Grid container spacing={3}>
                <Grid size={{ xs: 12 }} offset={{ xs: 0, md: 0 }}>
                  <Typography variant="subtitle1" sx={{ mb: 2 }}>
                    Change your password
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }} offset={{ xs: 0, md: 0 }}>
                  <TextField
                    fullWidth
                    label="New Password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    margin="normal"
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }} offset={{ xs: 0, md: 0 }}>
                  <TextField
                    fullWidth
                    label="Confirm New Password"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    margin="normal"
                    required
                    error={formData.password !== formData.confirmPassword && formData.confirmPassword !== ''}
                    helperText={formData.password !== formData.confirmPassword && formData.confirmPassword !== '' ? 'Passwords do not match' : ''}
                  />
                </Grid>
              </Grid>
            )}
          </CardContent>
        </Card>
      </Box>
    </DashboardLayout>
  );
}