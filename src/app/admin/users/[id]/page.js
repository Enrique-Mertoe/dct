'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/apiService';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  IconButton,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import EmailIcon from '@mui/icons-material/Email';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import SettingsIcon from '@mui/icons-material/Settings';
import MedicalInformationIcon from '@mui/icons-material/MedicalInformation';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function UserDetailsPage({ params }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const userId = resolvedParams.id;
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

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
        
        // Get user details - using direct fetch with credentials
        const userDetailsResponse = await fetch(`/api/users/${userId}`, {
          credentials: 'include', // Important: include cookies in the request
        });
        
        if (!userDetailsResponse.ok) {
          const errorData = await userDetailsResponse.json();
          throw new Error(errorData.error || 'Failed to fetch user details');
        }
        
        const userDetailsData = await userDetailsResponse.json();
        setUserData(userDetailsData);
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

  const handleDeleteUser = async () => {
    try {
      setDeleteLoading(true);
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include', // Include cookies in the request
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete user');
      }
      
      // Redirect after successful deletion
      router.push('/admin/users');
    } catch (error) {
      console.error('Error deleting user:', error);
      setError('Failed to delete user. Please try again.');
      setDeleteDialogOpen(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'error';
      case 'PHYSIOTHERAPIST':
        return 'primary';
      case 'RECEPTIONIST':
        return 'secondary';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!userData) {
    return (
      <DashboardLayout title="User Not Found" menuItems={menuItems} user={user}>
        <Alert severity="error">
          User not found or you don't have permission to view this user.
        </Alert>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => router.push('/admin/users')}
          sx={{ mt: 2 }}
        >
          Back to Users List
        </Button>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="User Details" menuItems={menuItems} user={user}>
      <Box sx={{ flexGrow: 1 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
          <Button 
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push('/admin/users')}
          >
            Back to Users
          </Button>
          <Box>
            <Button 
              variant="contained" 
              startIcon={<EditIcon />}
              onClick={() => router.push(`/admin/users/${userId}/edit`)}
              sx={{ mr: 2 }}
            >
              Edit User
            </Button>
            <Button 
              variant="outlined" 
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => setDeleteDialogOpen(true)}
            >
              Delete User
            </Button>
          </Box>
        </Box>

        {/* User Header Card */}
        <Paper 
          elevation={3} 
          sx={{ 
            p: 3, 
            mb: 3, 
            borderRadius: 2,
            background: 'linear-gradient(to right, #1976d2, #64b5f6)',
            color: 'white'
          }}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 1 }} offset={{ xs: 0, md: 0 }}>
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  bgcolor: 'primary.light',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '3px solid white',
                }}
              >
                <PersonIcon sx={{ fontSize: 40 }} />
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 8 }} offset={{ xs: 0, md: 0 }}>
              <Typography variant="h4" fontWeight="bold">
                {userData.name}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                <Chip 
                  icon={<AdminPanelSettingsIcon sx={{ color: 'white !important' }} />} 
                  label={userData.role} 
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                />
                <Chip 
                  icon={<EmailIcon sx={{ color: 'white !important' }} />} 
                  label={userData.email} 
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                />
              </Box>
            </Grid>
          </Grid>
        </Paper>

        <Grid container spacing={3}>
          {/* User Information */}
          <Grid size={{ xs: 12, md: 6 }} offset={{ xs: 0, md: 0 }}>
            <Card elevation={2}>
              <CardHeader 
                title="User Information" 
                sx={{ 
                  bgcolor: 'primary.main', 
                  color: 'white',
                  '& .MuiCardHeader-title': { fontWeight: 'bold' }
                }}
              />
              <CardContent>
                <List>
                  <ListItem>
                    <ListItemText 
                      primary="Name" 
                      secondary={userData.name} 
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText 
                      primary="Email" 
                      secondary={userData.email} 
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText 
                      primary="Role" 
                      secondary={userData.role}
                    />
                    <Chip 
                      label={userData.role} 
                      color={getRoleColor(userData.role)}
                      size="small"
                      sx={{ ml: 2 }}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Account Information */}
          <Grid size={{ xs: 12, md: 6 }} offset={{ xs: 0, md: 0 }}>
            <Card elevation={2}>
              <CardHeader 
                title="Account Information" 
                sx={{ 
                  bgcolor: 'primary.main', 
                  color: 'white',
                  '& .MuiCardHeader-title': { fontWeight: 'bold' }
                }}
              />
              <CardContent>
                <List>
                  <ListItem>
                    <ListItemText 
                      primary="Account Created" 
                      secondary={new Date(userData.createdAt).toLocaleString()} 
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText 
                      primary="Last Updated" 
                      secondary={new Date(userData.updatedAt).toLocaleString()} 
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText 
                      primary="Status" 
                      secondary="Active"
                    />
                    <Chip 
                      label="Active" 
                      color="success"
                      size="small"
                      sx={{ ml: 2 }}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Delete User Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this user? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleDeleteUser} 
            variant="contained" 
            color="error" 
            disabled={deleteLoading}
          >
            {deleteLoading ? <CircularProgress size={24} /> : 'Delete User'}
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}