'use client';

import RoleBasedLayout from '@/components/layout/RoleBasedLayout';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
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
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  Alert,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import ReceptionistIcon from '@mui/icons-material/RecordVoiceOver';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function ReceptionistDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    todayAppointments: 0,
    pendingAppointments: 0,
    totalPatients: 0,
  });
  const [user, setUser] = useState(null);
  const [todayAppointments, setTodayAppointments] = useState([]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await authService.getCurrentUser();
        const userData = response.data;
        setUser(userData);
      } catch (error) {
        console.error('Error fetching user data:', error);
        return;
      }
    };

    const fetchDashboardData = async () => {
      try {
        // Get today's date in ISO format (YYYY-MM-DD)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split('T')[0];
        
        // Fetch today's appointments
        const appointmentsResponse = await fetch(`/api/appointments?date=${todayStr}`);
        if (!appointmentsResponse.ok) throw new Error('Failed to fetch appointments');
        const appointmentsData = await appointmentsResponse.json();
        
        // Fetch pending appointments that need confirmation
        const pendingResponse = await fetch('/api/appointments?status=SCHEDULED');
        if (!pendingResponse.ok) throw new Error('Failed to fetch pending appointments');
        const pendingData = await pendingResponse.json();
        
        // Fetch total patients count
        const patientsResponse = await fetch('/api/patients/count');
        if (!patientsResponse.ok) throw new Error('Failed to fetch patient count');
        const patientsData = await patientsResponse.json();
        
        // Set stats with real data
        setStats({
          todayAppointments: appointmentsData.length,
          pendingAppointments: pendingData.length,
          totalPatients: patientsData.count,
        });
        
        // Set today's appointments
        setTodayAppointments(appointmentsData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data. Please try refreshing the page.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
    fetchDashboardData();
  }, [router]);


  // Handle appointment confirmation
  const handleConfirmAppointment = async (appointmentId) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'CONFIRMED' }),
      });
      
      if (!response.ok) throw new Error('Failed to confirm appointment');
      
      // Update the appointment in the list
      setTodayAppointments(prevAppointments => 
        prevAppointments.map(appointment => 
          appointment.id === appointmentId 
            ? { ...appointment, status: 'CONFIRMED' } 
            : appointment
        )
      );
      
      // Update pending appointments count
      setStats(prev => ({
        ...prev,
        pendingAppointments: prev.pendingAppointments - 1
      }));
    } catch (error) {
      console.error('Error confirming appointment:', error);
      setError('Failed to confirm appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    {
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/receptionist',
      active: true,
    },
    {
      text: 'Appointments',
      icon: <CalendarMonthIcon />,
      path: '/receptionist/appointments',
      active: false,
    },
    {
      text: 'Patients',
      icon: <PeopleIcon />,
      path: '/receptionist/patients',
      active: false,
    },
    {
      text: 'Schedule',
      icon: <EventAvailableIcon />,
      path: '/receptionist/schedule',
      active: false,
    },
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const dashboardContent = (
    <DashboardLayout title="Receptionist Dashboard" menuItems={menuItems} user={user}>
      <Box sx={{ flexGrow: 1 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        
        <Grid container spacing={3}>
          {/* Welcome Card */}
          <Grid size={{ xs: 12 }}>
            <Paper sx={{ p: 3, display: 'flex', alignItems: 'center' }}>
              <ReceptionistIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
              <Box>
                <Typography variant="h5" component="h1" gutterBottom>
                  Welcome, {user?.name || 'Receptionist'}
                </Typography>
                <Typography variant="body1">
                  Manage appointments and patient registrations from this dashboard.
                </Typography>
              </Box>
            </Paper>
          </Grid>

          {/* Stats Cards */}
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Today's Appointments
                </Typography>
                <Typography variant="h3" component="div">
                  {stats.todayAppointments}
                </Typography>
                <Button size="small" sx={{ mt: 2 }} onClick={() => router.push('/receptionist/appointments')}>
                  View today's schedule
                </Button>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Pending Confirmations
                </Typography>
                <Typography variant="h3" component="div">
                  {stats.pendingAppointments}
                </Typography>
                <Button size="small" sx={{ mt: 2 }} onClick={() => router.push('/receptionist/appointments?status=SCHEDULED')}>
                  Confirm appointments
                </Button>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Registered Patients
                </Typography>
                <Typography variant="h3" component="div">
                  {stats.totalPatients}
                </Typography>
                <Button size="small" sx={{ mt: 2 }} onClick={() => router.push('/receptionist/patients')}>
                  View patient records
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Quick Actions */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardHeader title="Quick Actions" />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Button 
                      variant="contained" 
                      fullWidth 
                      onClick={() => router.push('/receptionist/patients/new')}
                    >
                      Register New Patient
                    </Button>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Button 
                      variant="contained" 
                      fullWidth 
                      onClick={() => router.push('/receptionist/appointments/new')}
                    >
                      Schedule Appointment
                    </Button>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Button 
                      variant="outlined" 
                      fullWidth 
                      onClick={() => router.push('/receptionist/patients')}
                    >
                      Find Patient
                    </Button>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Button 
                      variant="outlined" 
                      fullWidth 
                      onClick={() => router.push('/receptionist/schedule')}
                    >
                      View Schedule
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Today's Appointments */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardHeader title="Today's Appointments" />
              <CardContent>
                <List>
                  {todayAppointments.length > 0 ? (
                    todayAppointments.map((appointment, index) => (
                      <Box key={appointment.id}>
                        <ListItem>
                          <ListItemText
                            primary={
                              <Typography variant="subtitle1">
                                {appointment.time} - {appointment.patientName}
                              </Typography>
                            }
                            secondary={
                              <>
                                <Typography component="span" variant="body2" color="text.primary">
                                  {appointment.doctorName}
                                </Typography>
                                {" — "}
                                <Chip
                                  size="small"
                                  label={appointment.status}
                                  color={appointment.status === 'CONFIRMED' ? 'success' : 'warning'}
                                />
                              </>
                            }
                          />
                          <Box>
                            {appointment.status === 'SCHEDULED' && (
                              <Button 
                                size="small" 
                                color="success"
                                sx={{ mr: 1 }}
                                onClick={() => handleConfirmAppointment(appointment.id)}
                                disabled={loading}
                              >
                                Confirm
                              </Button>
                            )}
                            <Button 
                              size="small" 
                              variant="outlined"
                              onClick={() => router.push(`/receptionist/appointments/${appointment.id}`)}
                            >
                              Details
                            </Button>
                          </Box>
                        </ListItem>
                        {index < todayAppointments.length - 1 && <Divider />}
                      </Box>
                    ))
                  ) : (
                    <Typography variant="body1">No appointments scheduled for today.</Typography>
                  )}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </DashboardLayout>
  );

  return (
    <RoleBasedLayout allowedRoles={['RECEPTIONIST', 'ADMIN']}>
      {dashboardContent}
    </RoleBasedLayout>
  );
}