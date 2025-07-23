'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/apiService';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Button,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import SettingsIcon from '@mui/icons-material/Settings';
import MedicalInformationIcon from '@mui/icons-material/MedicalInformation';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!user);
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalAppointments: 0,
    totalDoctors: 0,
    upcomingAppointments: 0,
  });


  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await authService.getCurrentUser();
        const userData = response.data;
        setUser(userData);
        
        // Redirect if not admin
        if (userData.role !== 'ADMIN') {
          router.push(`/${userData.role.toLowerCase()}`);
          return;
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        router.push('/login');
        return;
      }
    };

    const fetchDashboardStats = async () => {
      try {
        // Fetch stats from API
        const patientsResponse = await fetch('/api/admin/stats/patients');
        const appointmentsResponse = await fetch('/api/admin/stats/appointments');
        const doctorsResponse = await fetch('/api/admin/stats/doctors');
        
        if (!patientsResponse.ok || !appointmentsResponse.ok || !doctorsResponse.ok) {
          throw new Error('Failed to fetch dashboard stats');
        }
        
        const patientsData = await patientsResponse.json();
        const appointmentsData = await appointmentsResponse.json();
        const doctorsData = await doctorsResponse.json();
        
        setStats({
          totalPatients: patientsData.total,
          totalAppointments: appointmentsData.total,
          totalDoctors: doctorsData.total,
          upcomingAppointments: appointmentsData.upcoming,
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        // Set default values if API fails
        setStats({
          totalPatients: 0,
          totalAppointments: 0,
          totalDoctors: 0,
          upcomingAppointments: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
    fetchDashboardStats();
  }, [router]);

  const menuItems = [
    {
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/admin',
      active: true,
    },
    {
      text: 'Users',
      icon: <PeopleIcon />,
      path: '/admin/users',
      active: false,
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

  if (loading || !user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <DashboardLayout title="Admin Dashboard" menuItems={menuItems} user={user}>
      <Box sx={{ flexGrow: 1 }}>
        <Grid container spacing={3}>
          {/* Welcome Card */}
          <Grid size={{ xs: 12 }}>
            <Paper sx={{ p: 3, display: 'flex', alignItems: 'center' }}>
              <AdminPanelSettingsIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
              <Box>
                <Typography variant="h5" component="h1" gutterBottom>
                  Welcome, {user?.name || 'Admin'}
                </Typography>
                <Typography variant="body1">
                  This is the admin dashboard where you can manage the entire clinic system.
                </Typography>
              </Box>
            </Paper>
          </Grid>

          {/* Stats Cards */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Total Patients
                </Typography>
                <Typography variant="h3" component="div">
                  {stats.totalPatients}
                </Typography>
                <Button size="small" sx={{ mt: 2 }} onClick={() => router.push('/admin/patients')}>
                  View all patients
                </Button>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Physiotherapists
                </Typography>
                <Typography variant="h3" component="div">
                  {stats.totalDoctors}
                </Typography>
                <Button size="small" sx={{ mt: 2 }} onClick={() => router.push('/admin/users')}>
                  Manage staff
                </Button>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Total Appointments
                </Typography>
                <Typography variant="h3" component="div">
                  {stats.totalAppointments}
                </Typography>
                <Button size="small" sx={{ mt: 2 }} onClick={() => router.push('/admin/appointments')}>
                  View all appointments
                </Button>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Upcoming Appointments
                </Typography>
                <Typography variant="h3" component="div">
                  {stats.upcomingAppointments}
                </Typography>
                <Button size="small" sx={{ mt: 2 }} onClick={() => router.push('/admin/appointments')}>
                  View schedule
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Quick Actions */}
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardHeader title="Quick Actions" />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Button 
                      variant="contained" 
                      fullWidth 
                      onClick={() => router.push('/admin/patients/new')}
                    >
                      Add New Patient
                    </Button>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Button 
                      variant="contained" 
                      fullWidth 
                      onClick={() => router.push('/admin/appointments/new')}
                    >
                      Schedule Appointment
                    </Button>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Button 
                      variant="contained" 
                      fullWidth 
                      onClick={() => router.push('/admin/users/new')}
                    >
                      Add New Staff
                    </Button>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Button 
                      variant="contained" 
                      fullWidth 
                      onClick={() => router.push('/admin/settings')}
                    >
                      System Settings
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </DashboardLayout>
  );
}