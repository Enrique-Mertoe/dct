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
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import MedicalInformationIcon from '@mui/icons-material/MedicalInformation';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function PhysiotherapistDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayAppointments: 0,
    assignedPatients: 0,
    completedTreatments: 0,
  });
  const [user, setUser] = useState(null);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [recentPatients, setRecentPatients] = useState([]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await authService.getCurrentUser();
        const userData = response.data;
        setUser(userData);
        
        // Redirect if not physiotherapist
        if (userData.role !== 'PHYSIOTHERAPIST') {
          router.push(`/${userData.role.toLowerCase()}`);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        router.push('/login');
      }
    };

    const fetchDashboardData = async () => {
      try {
        // In a real app, you would fetch these stats from your API
        // For now, we'll use mock data
        setStats({
          todayAppointments: 4,
          assignedPatients: 28,
          completedTreatments: 156,
        });
        
        // Mock today's appointments
        setTodayAppointments([
          { id: '1', time: '09:00 - 10:30', patientName: 'John Smith', status: 'CONFIRMED', notes: 'Follow-up session' },
          { id: '2', time: '10:30 - 12:00', patientName: 'Sarah Williams', status: 'CONFIRMED', notes: 'Initial assessment' },
          { id: '3', time: '14:00 - 15:30', patientName: 'Michael Brown', status: 'CONFIRMED', notes: 'Knee rehabilitation' },
          { id: '4', time: '15:30 - 17:00', patientName: 'Emily Davis', status: 'CONFIRMED', notes: 'Back pain treatment' },
        ]);
        
        // Mock recent patients
        setRecentPatients([
          { id: '1', name: 'John Smith', lastVisit: '2023-07-20', condition: 'Shoulder injury' },
          { id: '2', name: 'Sarah Williams', lastVisit: '2023-07-18', condition: 'Lower back pain' },
          { id: '3', name: 'Michael Brown', lastVisit: '2023-07-15', condition: 'Knee rehabilitation' },
        ]);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
    fetchDashboardData();
  }, [router]);

  const menuItems = [
    {
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/physiotherapist',
      active: true,
    },
    {
      text: 'My Patients',
      icon: <PeopleIcon />,
      path: '/physiotherapist/patients',
      active: false,
    },
    {
      text: 'Appointments',
      icon: <CalendarMonthIcon />,
      path: '/physiotherapist/appointments',
      active: false,
    },
    {
      text: 'Treatments',
      icon: <MedicalInformationIcon />,
      path: '/physiotherapist/treatments',
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
    <DashboardLayout title="Physiotherapist Dashboard" menuItems={menuItems} user={user}>
      <Box sx={{ flexGrow: 1 }}>
        <Grid container spacing={3}>
          {/* Welcome Card */}
          <Grid size={{ xs: 12 }}>
            <Paper sx={{ p: 3, display: 'flex', alignItems: 'center' }}>
              <LocalHospitalIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
              <Box>
                <Typography variant="h5" component="h1" gutterBottom>
                  Welcome, {user?.name || 'Doctor'}
                </Typography>
                <Typography variant="body1">
                  Manage your patients, appointments, and treatment records from this dashboard.
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
                <Button size="small" sx={{ mt: 2 }} onClick={() => router.push('/physiotherapist/appointments')}>
                  View schedule
                </Button>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Assigned Patients
                </Typography>
                <Typography variant="h3" component="div">
                  {stats.assignedPatients}
                </Typography>
                <Button size="small" sx={{ mt: 2 }} onClick={() => router.push('/physiotherapist/patients')}>
                  View patients
                </Button>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Completed Treatments
                </Typography>
                <Typography variant="h3" component="div">
                  {stats.completedTreatments}
                </Typography>
                <Button size="small" sx={{ mt: 2 }} onClick={() => router.push('/physiotherapist/treatments')}>
                  View treatments
                </Button>
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
                                  {appointment.notes}
                                </Typography>
                                {" — "}
                                <Chip
                                  label={appointment.status}
                                  size="small"
                                  color={appointment.status === 'CONFIRMED' ? 'success' : 'warning'}
                                />
                              </>
                            }
                          />
                          <Button 
                            size="small" 
                            variant="outlined"
                            onClick={() => router.push(`/physiotherapist/appointments/${appointment.id}`)}
                          >
                            Details
                          </Button>
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

          {/* Recent Patients */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardHeader title="Recent Patients" />
              <CardContent>
                <List>
                  {recentPatients.length > 0 ? (
                    recentPatients.map((patient, index) => (
                      <Box key={patient.id}>
                        <ListItem>
                          <ListItemText
                            primary={
                              <Typography variant="subtitle1">
                                {patient.name}
                              </Typography>
                            }
                            secondary={
                              <>
                                <Typography component="span" variant="body2" color="text.primary">
                                  {patient.condition}
                                </Typography>
                                {" — Last visit: "}
                                <Typography component="span" variant="body2">
                                  {new Date(patient.lastVisit).toLocaleDateString()}
                                </Typography>
                              </>
                            }
                          />
                          <Button 
                            size="small" 
                            variant="outlined"
                            onClick={() => router.push(`/physiotherapist/patients/${patient.id}`)}
                          >
                            View
                          </Button>
                        </ListItem>
                        {index < recentPatients.length - 1 && <Divider />}
                      </Box>
                    ))
                  ) : (
                    <Typography variant="body1">No recent patients.</Typography>
                  )}
                </List>
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
                      onClick={() => router.push('/physiotherapist/patients')}
                    >
                      View My Patients
                    </Button>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Button 
                      variant="contained" 
                      fullWidth 
                      onClick={() => router.push('/physiotherapist/appointments')}
                    >
                      View Schedule
                    </Button>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Button 
                      variant="outlined" 
                      fullWidth 
                      onClick={() => router.push('/physiotherapist/treatments/new')}
                    >
                      Record Treatment
                    </Button>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Button 
                      variant="outlined" 
                      fullWidth 
                      onClick={() => router.push('/physiotherapist/patients/search')}
                    >
                      Search Patient
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