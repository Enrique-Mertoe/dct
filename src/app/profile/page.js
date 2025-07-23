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
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import EmailIcon from '@mui/icons-material/Email';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DashboardIcon from '@mui/icons-material/Dashboard';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await authService.getCurrentUser();
        const userData = response.data;
        setUser(userData);
      } catch (error) {
        console.error('Error fetching user data:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

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
    <DashboardLayout title="My Profile" menuItems={getMenuItems()} user={user}>
      <Box sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
          <Typography variant="h5" component="h1">
            Profile Information
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<EditIcon />}
            onClick={() => router.push('/profile/edit')}
          >
            Edit Profile
          </Button>
        </Box>
        
        <Paper sx={{ p: 3, mb: 4, display: 'flex', alignItems: 'center' }}>
          <Avatar 
            sx={{ 
              width: 80, 
              height: 80, 
              bgcolor: 'primary.main',
              mr: 3
            }}
          >
            {user.name ? user.name[0].toUpperCase() : 'U'}
          </Avatar>
          <Box>
            <Typography variant="h4" fontWeight="bold">
              {user.name}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {user.role}
            </Typography>
          </Box>
        </Paper>

        <Card>
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
                  primary="Name" 
                  secondary={user.name} 
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText 
                  primary="Email" 
                  secondary={user.email} 
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText 
                  primary="Role" 
                  secondary={user.role} 
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText 
                  primary="Account Created" 
                  secondary={new Date(user.createdAt).toLocaleString()} 
                />
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </Box>
    </DashboardLayout>
  );
}