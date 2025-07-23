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
          return;
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        router.push('/login');
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
        const appointmentsResponse = await fetch(`/api/appointments?date=${todayStr}&doctorId=${user.id}`);
        if (!appointmentsResponse.ok) throw new Error('Failed to fetch appointments');
        const appointmentsData = await appointmentsResponse.json();
        setTodayAppointments(appointmentsData);
        
        // Fetch assigned patients count
        const patientsResponse = await fetch(`/api/patients?assignedToMe=true`);
        if (!patientsResponse.ok) throw new Error('Failed to fetch patients');
        const patientsData = await patientsResponse.json();
        
        // Fetch completed treatments count
        const treatmentsResponse = await fetch(`/api/treatments?physiotherapistId=${user.id}`);
        if (!treatmentsResponse.ok) throw new Error('Failed to fetch treatments');
        const treatmentsData = await treatmentsResponse.json();
        
        // Get recent patients with last visit
        const recentPatientsWithVisits = patientsData
          .filter(patient => patient.lastVisit)
          .sort((a, b) => new Date(b.lastVisit) - new Date(a.lastVisit))
          .slice(0, 3);
        
        setRecentPatients(recentPatientsWithVisits);
        
        // Set stats
        setStats({
          todayAppointments: appointmentsData.length,
          assignedPatients: patientsData.length,
          completedTreatments: treatmentsData.filter(t => t.appointment?.status === 'COMPLETED').length,
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
    if (user) {
      fetchDashboardData();
    }
  }, [router, user]);

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
          <Grid item size={12}>
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
          <Grid item size={{
            xs:12,md:4
          }} >
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
          <Grid item size={{
                    xs:12,md:4,sm:6
                  }}>
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
          <Grid item size={{
                    xs:12,md:4,sm:6
                  }}>
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
          <Grid item  size={{
            xs:12,md:6
          }}>
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
                                  {appointment.notes || 'No notes'}
                                </Typography>
                                {" — "}
                                <Chip
                                  label={appointment.status}
                                  size="small"
                                  color={
                                    appointment.status === 'CONFIRMED' ? 'success' : 
                                    appointment.status === 'SCHEDULED' ? 'primary' : 
                                    appointment.status === 'COMPLETED' ? 'info' : 
                                    'default'
                                  }
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
          <Grid item size={{
            xs:12,md:6
          }}>
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
                                  {patient.condition || 'No condition specified'}
                                </Typography>
                                {" — Last visit: "}
                                <Typography component="span" variant="body2">
                                  {patient.lastVisit ? new Date(patient.lastVisit).toLocaleDateString() : 'Never'}
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
          <Grid item size={12}>
            <Card>
              <CardHeader title="Quick Actions" />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item  size={{
                    xs:12,md:3,sm:6
                  }}>
                    <Button 
                      variant="contained" 
                      fullWidth 
                      onClick={() => router.push('/physiotherapist/patients')}
                    >
                      View My Patients
                    </Button>
                  </Grid>
                  <Grid item size={{
                    xs:12,md:3,sm:6
                  }}>
                    <Button 
                      variant="contained" 
                      fullWidth 
                      onClick={() => router.push('/physiotherapist/appointments')}
                    >
                      View Schedule
                    </Button>
                  </Grid>
                  <Grid item size={{
                    xs:12,md:3,sm:6
                  }}>
                    <Button 
                      variant="outlined" 
                      fullWidth 
                      onClick={() => router.push('/physiotherapist/treatments/new')}
                    >
                      Record Treatment
                    </Button>
                  </Grid>
                  <Grid item size={{
                    xs:12,md:3,sm:6
                  }}>
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