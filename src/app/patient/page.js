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
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import MedicalInformationIcon from '@mui/icons-material/MedicalInformation';
import PersonIcon from '@mui/icons-material/Person';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function PatientDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [patientInfo, setPatientInfo] = useState(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [recentTreatments, setRecentTreatments] = useState([]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await authService.getCurrentUser();
        const userData = response.data;
        setUser(userData);
        
        // Redirect if not patient
        if (userData.role !== 'PATIENT') {
          router.push(`/${userData.role.toLowerCase()}`);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        router.push('/login');
      }
    };

    const fetchPatientData = async () => {
      try {
        // In a real app, you would fetch patient data from your API
        // For now, we'll use mock data
        setPatientInfo({
          id: '123',
          firstName: 'John',
          lastName: 'Doe',
          dateOfBirth: '1985-05-15',
          gender: 'Male',
          doctor: 'Dr. Sarah Johnson',
        });
        
        // Mock upcoming appointments
        setUpcomingAppointments([
          { id: '1', date: '2023-07-25', time: '09:00 - 10:30', doctorName: 'Dr. Sarah Johnson', status: 'CONFIRMED' },
          { id: '2', date: '2023-08-10', time: '14:00 - 15:30', doctorName: 'Dr. Sarah Johnson', status: 'SCHEDULED' },
        ]);
        
        // Mock recent treatments
        setRecentTreatments([
          { id: '1', date: '2023-07-10', doctorName: 'Dr. Sarah Johnson', notes: 'Lower back pain treatment - Prescribed exercises and stretching routine' },
          { id: '2', date: '2023-06-25', doctorName: 'Dr. Sarah Johnson', notes: 'Initial assessment - Diagnosed with lumbar strain' },
        ]);
      } catch (error) {
        console.error('Error fetching patient data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
    fetchPatientData();
  }, [router]);

  const menuItems = [
    {
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/patient',
      active: true,
    },
    {
      text: 'My Appointments',
      icon: <CalendarMonthIcon />,
      path: '/patient/appointments',
      active: false,
    },
    {
      text: 'My Treatments',
      icon: <MedicalInformationIcon />,
      path: '/patient/treatments',
      active: false,
    },
    {
      text: 'My Profile',
      icon: <PersonIcon />,
      path: '/patient/profile',
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

  return (
    <DashboardLayout title="Patient Dashboard" menuItems={menuItems} user={user}>
      <Box sx={{ flexGrow: 1 }}>
        <Grid container spacing={3}>
          {/* Welcome Card */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, display: 'flex', alignItems: 'center' }}>
              <PersonIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
              <Box>
                <Typography variant="h5" component="h1" gutterBottom>
                  Welcome, {patientInfo?.firstName || 'Patient'}
                </Typography>
                <Typography variant="body1">
                  View your appointments, treatment history, and personal information.
                </Typography>
              </Box>
            </Paper>
          </Grid>

          {/* Patient Info Card */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="My Information" />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Full Name
                    </Typography>
                    <Typography variant="body1">
                      {patientInfo?.firstName} {patientInfo?.lastName}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Date of Birth
                    </Typography>
                    <Typography variant="body1">
                      {new Date(patientInfo?.dateOfBirth).toLocaleDateString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Gender
                    </Typography>
                    <Typography variant="body1">
                      {patientInfo?.gender}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Assigned Doctor
                    </Typography>
                    <Typography variant="body1">
                      {patientInfo?.doctor}
                    </Typography>
                  </Grid>
                </Grid>
                <Button 
                  variant="outlined" 
                  size="small" 
                  sx={{ mt: 2 }}
                  onClick={() => router.push('/patient/profile')}
                >
                  View Full Profile
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Upcoming Appointments */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader 
                title="Upcoming Appointments" 
                action={
                  <Button 
                    size="small" 
                    onClick={() => router.push('/patient/appointments')}
                  >
                    View All
                  </Button>
                }
              />
              <CardContent>
                <List>
                  {upcomingAppointments.length > 0 ? (
                    upcomingAppointments.map((appointment, index) => (
                      <Box key={appointment.id}>
                        <ListItem>
                          <ListItemText
                            primary={
                              <Typography variant="subtitle1">
                                {new Date(appointment.date).toLocaleDateString()} | {appointment.time}
                              </Typography>
                            }
                            secondary={
                              <>
                                <Typography component="span" variant="body2" color="text.primary">
                                  {appointment.doctorName}
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
                        </ListItem>
                        {index < upcomingAppointments.length - 1 && <Divider />}
                      </Box>
                    ))
                  ) : (
                    <Typography variant="body1">No upcoming appointments.</Typography>
                  )}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Recent Treatments */}
          <Grid item xs={12}>
            <Card>
              <CardHeader 
                title="Recent Treatments" 
                action={
                  <Button 
                    size="small" 
                    onClick={() => router.push('/patient/treatments')}
                  >
                    View All
                  </Button>
                }
              />
              <CardContent>
                <List>
                  {recentTreatments.length > 0 ? (
                    recentTreatments.map((treatment, index) => (
                      <Box key={treatment.id}>
                        <ListItem>
                          <ListItemText
                            primary={
                              <Typography variant="subtitle1">
                                {new Date(treatment.date).toLocaleDateString()} - {treatment.doctorName}
                              </Typography>
                            }
                            secondary={
                              <Typography variant="body2" color="text.secondary">
                                {treatment.notes}
                              </Typography>
                            }
                          />
                        </ListItem>
                        {index < recentTreatments.length - 1 && <Divider />}
                      </Box>
                    ))
                  ) : (
                    <Typography variant="body1">No treatment history available.</Typography>
                  )}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Quick Actions */}
          <Grid item xs={12}>
            <Card>
              <CardHeader title="Quick Actions" />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={4}>
                    <Button 
                      variant="contained" 
                      fullWidth 
                      onClick={() => router.push('/patient/appointments')}
                    >
                      View Appointments
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Button 
                      variant="outlined" 
                      fullWidth 
                      onClick={() => router.push('/patient/treatments')}
                    >
                      Treatment History
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Button 
                      variant="outlined" 
                      fullWidth 
                      onClick={() => router.push('/patient/profile')}
                    >
                      Update Profile
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