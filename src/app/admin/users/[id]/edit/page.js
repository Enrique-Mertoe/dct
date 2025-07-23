'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/apiService';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Alert,
  Tabs,
  Tab,
  Paper,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import SettingsIcon from '@mui/icons-material/Settings';
import MedicalInformationIcon from '@mui/icons-material/MedicalInformation';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function EditUserPage({ params }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const userId = resolvedParams.id;
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current user
        const userResponse = await authService.getCurrentUser();
        const currentUser = userResponse.data;
        setUser(currentUser);
        
        // Redirect if not admin
        if (currentUser.role !== 'ADMIN') {
          router.push(`/${currentUser.role.toLowerCase()}`);
          return;
        }
        
        // Get user details
        const userDetailsResponse = await fetch(`/api/users/${userId}`, {
          credentials: 'include',
        });
        
        if (!userDetailsResponse.ok) {
          const errorData = await userDetailsResponse.json();
          throw new Error(errorData.error || 'Failed to fetch user details');
        }
        
        const userDetailsData = await userDetailsResponse.json();
        
        // Set form data
        setFormData({
          name: userDetailsData.name || '',
          email: userDetailsData.email || '',
          role: userDetailsData.role || '',
          password: '',
          confirmPassword: '',
        });
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load user details. Please try refreshing the page.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router, userId]);

  const menuItems = [
    {
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/admin',
      active: false,
    },
    {
      text: 'Users',
      icon: <PeopleIcon />,
      path: '/admin/users',
      active: true,
    },
    {
      text: 'Patients',
      icon: <MedicalInformationIcon />,
      path: '/admin/patients',
      active: false,
    },
    {
      text: 'Appointments',
      icon: <CalendarMonthIcon />,
      path: '/admin/appointments',
      active: false,
    },
    {
      text: 'System Settings',
      icon: <SettingsIcon />,
      path: '/admin/settings',
      active: false,
    },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    
    try {
      // Validate passwords if provided
      if (formData.password && formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match');
      }
      
      // Prepare data for API
      const dataToSubmit = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
      };
      
      // Only include password if it's provided
      if (formData.password) {
        dataToSubmit.password = formData.password;
      }
      
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSubmit),
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user');
      }
      
      setSuccess(true);
      
      // Redirect after 2 seconds
      setTimeout(() => {
        router.push(`/admin/users/${userId}`);
      }, 2000);
    } catch (error) {
      console.error('Error updating user:', error);
      setError(error.message || 'Failed to update user. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <DashboardLayout title="Edit User" menuItems={menuItems} user={user}>
      <Box sx={{ flexGrow: 1 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            User updated successfully! Redirecting...
          </Alert>
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
          <Button 
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push(`/admin/users/${userId}`)}
          >
            Back to User Details
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
            <Tab icon={<PersonIcon />} label="General Information" />
            <Tab icon={<LockIcon />} label="Password" />
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
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }} offset={{ xs: 0, md: 0 }}>
                  <FormControl fullWidth margin="normal" required>
                    <InputLabel>Role</InputLabel>
                    <Select
                      name="role"
                      value={formData.role}
                      label="Role"
                      onChange={handleChange}
                    >
                      <MenuItem value="ADMIN">Admin</MenuItem>
                      <MenuItem value="PHYSIOTHERAPIST">Physiotherapist</MenuItem>
                      <MenuItem value="RECEPTIONIST">Receptionist</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            )}
            
            {tabValue === 1 && (
              <Grid container spacing={3}>
                <Grid size={{ xs: 12 }} offset={{ xs: 0, md: 0 }}>
                  <Typography variant="subtitle1" sx={{ mb: 2 }}>
                    Change Password (leave blank to keep current password)
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