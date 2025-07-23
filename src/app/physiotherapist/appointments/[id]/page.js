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
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  Alert,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EventIcon from '@mui/icons-material/Event';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import NoteIcon from '@mui/icons-material/Note';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import MedicalInformationIcon from '@mui/icons-material/MedicalInformation';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function AppointmentDetailPage({ params }) {
  const router = useRouter();
  const appointmentId = params.id;
  const [user, setUser] = useState(null);
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current user
        const userResponse = await authService.getCurrentUser();
        const userData = userResponse.data;
        setUser(userData);
        
        // Redirect if not physiotherapist
        if (userData.role !== 'PHYSIOTHERAPIST') {
          router.push(`/${userData.role.toLowerCase()}`);
          return;
        }
        
        // Get appointment details
        const appointmentResponse = await fetch(`/api/appointments/${appointmentId}`, {
          credentials: 'include'
        });
        if (!appointmentResponse.ok) {
          throw new Error('Failed to fetch appointment details');
        }
        const appointmentData = await appointmentResponse.json();
        setAppointment(appointmentData);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load appointment details. Please try refreshing the page.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router, appointmentId]);

  const menuItems = [
    {
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/physiotherapist',
      active: false,
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
      active: true,
    },
    {
      text: 'Treatments',
      icon: <MedicalInformationIcon />,
      path: '/physiotherapist/treatments',
      active: false,
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return 'success';
      case 'SCHEDULED':
        return 'primary';
      case 'COMPLETED':
        return 'info';
      case 'CANCELLED':
        return 'error';
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

  if (!appointment) {
    return (
      <DashboardLayout title="Appointment Not Found" menuItems={menuItems} user={user}>
        <Alert severity="error">
          Appointment not found or you don't have permission to view this appointment.
        </Alert>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => router.push('/physiotherapist/appointments')}
          sx={{ mt: 2 }}
        >
          Back to Appointments
        </Button>
      </DashboardLayout>
    );
  }

  const appointmentDate = new Date(appointment.date);
  const formattedDate = appointmentDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const isPastAppointment = appointmentDate < new Date();
  const canRecordTreatment = (appointment.status === 'CONFIRMED' || appointment.status === 'COMPLETED') && 
                             appointmentDate <= new Date();

  return (
    <DashboardLayout title="Appointment Details" menuItems={menuItems} user={user}>
      <Box sx={{ flexGrow: 1 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
          <Button 
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push('/physiotherapist/appointments')}
          >
            Back to Appointments
          </Button>
          {canRecordTreatment && (
            <Button 
              variant="contained" 
              onClick={() => router.push(`/physiotherapist/treatments/new?appointmentId=${appointmentId}`)}
            >
              {appointment.status === 'COMPLETED' ? 'View Treatment' : 'Record Treatment'}
            </Button>
          )}
        </Box>

        {/* Appointment Header Card */}
        <Paper 
          elevation={3} 
          sx={{ 
            p: 3, 
            mb: 3, 
            borderRadius: 2,
            background: appointment.status === 'CANCELLED' 
              ? 'linear-gradient(to right, #d32f2f, #f44336)'
              : appointment.status === 'COMPLETED'
              ? 'linear-gradient(to right, #2196f3, #64b5f6)'
              : appointment.status === 'CONFIRMED'
              ? 'linear-gradient(to right, #388e3c, #4caf50)'
              : 'linear-gradient(to right, #1976d2, #64b5f6)',
            color: 'white'
          }}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <Typography variant="h4" fontWeight="bold">
                Appointment with {appointment.patientName}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mt: 1, flexWrap: 'wrap' }}>
                <Chip 
                  icon={<EventIcon sx={{ color: 'white !important' }} />} 
                  label={formattedDate} 
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                />
                <Chip 
                  icon={<AccessTimeIcon sx={{ color: 'white !important' }} />} 
                  label={appointment.time} 
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                />
                <Chip 
                  label={appointment.status} 
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
              {canRecordTreatment && (
                <Button 
                  variant="contained" 
                  color="secondary"
                  onClick={() => router.push(`/physiotherapist/treatments/new?appointmentId=${appointmentId}`)}
                  sx={{ 
                    bgcolor: 'white', 
                    color: 'primary.main',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' }
                  }}
                >
                  {appointment.status === 'COMPLETED' ? 'View Treatment' : 'Record Treatment'}
                </Button>
              )}
            </Grid>
          </Grid>
        </Paper>

        <Grid container spacing={3}>
          {/* Patient Information */}
          <Grid item xs={12} md={6}>
            <Card elevation={2} sx={{ height: '100%' }}>
              <CardHeader 
                title="Patient Information" 
                sx={{ 
                  bgcolor: 'primary.main', 
                  color: 'white',
                  '& .MuiCardHeader-title': { fontWeight: 'bold' }
                }}
                action={
                  <Button 
                    variant="contained" 
                    size="small" 
                    sx={{ bgcolor: 'white', color: 'primary.main' }}
                    onClick={() => router.push(`/physiotherapist/patients/${appointment.patientId}`)}
                  >
                    View Profile
                  </Button>
                }
              />
              <CardContent>
                <List>
                  <ListItem>
                    <ListItemText 
                      primary="Name" 
                      secondary={appointment.patientName} 
                    />
                  </ListItem>
                  <Divider />
                  {appointment.patient && (
                    <>
                      <ListItem>
                        <ListItemText 
                          primary="Phone" 
                          secondary={appointment.patient.phone || 'Not provided'} 
                        />
                      </ListItem>
                      <Divider />
                      <ListItem>
                        <ListItemText 
                          primary="Email" 
                          secondary={appointment.patient.email || 'Not provided'} 
                        />
                      </ListItem>
                    </>
                  )}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Appointment Details */}
          <Grid item xs={12} md={6}>
            <Card elevation={2} sx={{ height: '100%' }}>
              <CardHeader 
                title="Appointment Details" 
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
                      primary="Date" 
                      secondary={formattedDate} 
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText 
                      primary="Time" 
                      secondary={appointment.time} 
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText 
                      primary="Status" 
                      secondary={
                        <Chip 
                          label={appointment.status} 
                          color={getStatusColor(appointment.status)}
                          size="small"
                        />
                      } 
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Notes */}
          <Grid item xs={12}>
            <Card elevation={2}>
              <CardHeader 
                title="Notes" 
                sx={{ 
                  bgcolor: 'primary.main', 
                  color: 'white',
                  '& .MuiCardHeader-title': { fontWeight: 'bold' }
                }}
              />
              <CardContent>
                {appointment.notes ? (
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                    {appointment.notes}
                  </Typography>
                ) : (
                  <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 4 }}>
                    No notes for this appointment.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Treatment Information (if completed) */}
          {appointment.status === 'COMPLETED' && appointment.treatment && (
            <Grid item xs={12}>
              <Card elevation={2}>
                <CardHeader 
                  title="Treatment Information" 
                  sx={{ 
                    bgcolor: 'primary.main', 
                    color: 'white',
                    '& .MuiCardHeader-title': { fontWeight: 'bold' }
                  }}
                  action={
                    <Button 
                      variant="contained" 
                      size="small" 
                      sx={{ bgcolor: 'white', color: 'primary.main' }}
                      onClick={() => router.push(`/physiotherapist/treatments/${appointment.treatment.id}`)}
                    >
                      View Full Treatment
                    </Button>
                  }
                />
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Treatment Notes
                  </Typography>
                  <Typography variant="body1" paragraph>
                    {appointment.treatment.notes}
                  </Typography>
                  
                  {appointment.treatment.homeProgram && (
                    <>
                      <Typography variant="subtitle1" gutterBottom>
                        Home Program
                      </Typography>
                      <Typography variant="body1" paragraph>
                        {appointment.treatment.homeProgram}
                      </Typography>
                    </>
                  )}
                  
                  {appointment.treatment.progress && (
                    <>
                      <Typography variant="subtitle1" gutterBottom>
                        Progress
                      </Typography>
                      <Typography variant="body1">
                        {appointment.treatment.progress}
                      </Typography>
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </Box>
    </DashboardLayout>
  );
}