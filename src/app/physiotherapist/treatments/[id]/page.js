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
  Divider,
  Alert,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import MedicalInformationIcon from '@mui/icons-material/MedicalInformation';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function TreatmentDetailPage({ params }) {
  const router = useRouter();
  const treatmentId = use(params).id;
  const [user, setUser] = useState(null);
  const [treatment, setTreatment] = useState(null);
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
        
        // Get treatment details
        const treatmentResponse = await fetch(`/api/treatments/${treatmentId}`, {
          credentials: 'include'
        });
        if (!treatmentResponse.ok) {
          throw new Error('Failed to fetch treatment details');
        }
        const treatmentData = await treatmentResponse.json();
        setTreatment(treatmentData);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load treatment details. Please try refreshing the page.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router, treatmentId]);

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
      active: false,
    },
    {
      text: 'Treatments',
      icon: <MedicalInformationIcon />,
      path: '/physiotherapist/treatments',
      active: true,
    },
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!treatment) {
    return (
      <DashboardLayout title="Treatment Not Found" menuItems={menuItems} user={user}>
        <Alert severity="error">
          Treatment not found or you don't have permission to view this treatment.
        </Alert>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => router.push('/physiotherapist/treatments')}
          sx={{ mt: 2 }}
        >
          Back to Treatments
        </Button>
      </DashboardLayout>
    );
  }

  const patientName = `${treatment.patient.firstName} ${treatment.patient.lastName}`;
  const treatmentDate = new Date(treatment.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <DashboardLayout title="Treatment Details" menuItems={menuItems} user={user}>
      <Box sx={{ flexGrow: 1 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
          <Button 
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push('/physiotherapist/treatments')}
          >
            Back to Treatments
          </Button>
          <Button 
            variant="contained" 
            startIcon={<EditIcon />}
            onClick={() => router.push(`/physiotherapist/treatments/${treatmentId}/edit`)}
          >
            Edit Treatment
          </Button>
        </Box>

        {/* Treatment Header Card */}
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
            <Grid size={{ xs: 12, md: 8 }}>
              <Typography variant="h4" fontWeight="bold">
                Treatment for {patientName}
              </Typography>
              <Typography variant="h6" sx={{ mt: 1, opacity: 0.9 }}>
                {treatmentDate}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
              <Button 
                variant="contained" 
                color="secondary"
                onClick={() => router.push(`/physiotherapist/patients/${treatment.patientId}`)}
                sx={{ 
                  bgcolor: 'white', 
                  color: 'primary.main',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' }
                }}
              >
                View Patient Profile
              </Button>
            </Grid>
          </Grid>
        </Paper>

        <Grid container spacing={3}>
          {/* Treatment Notes */}
          <Grid size={{ xs: 12 }}>
            <Card elevation={2}>
              <CardHeader 
                title="Treatment Notes" 
                sx={{ 
                  bgcolor: 'primary.main', 
                  color: 'white',
                  '& .MuiCardHeader-title': { fontWeight: 'bold' }
                }}
              />
              <CardContent>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                  {treatment.notes}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Home Program */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card elevation={2} sx={{ height: '100%' }}>
              <CardHeader 
                title="Home Program" 
                sx={{ 
                  bgcolor: 'primary.main', 
                  color: 'white',
                  '& .MuiCardHeader-title': { fontWeight: 'bold' }
                }}
              />
              <CardContent>
                {treatment.homeProgram ? (
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                    {treatment.homeProgram}
                  </Typography>
                ) : (
                  <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 4 }}>
                    No home program was provided for this treatment.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Progress Notes */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card elevation={2} sx={{ height: '100%' }}>
              <CardHeader 
                title="Progress Notes" 
                sx={{ 
                  bgcolor: 'primary.main', 
                  color: 'white',
                  '& .MuiCardHeader-title': { fontWeight: 'bold' }
                }}
              />
              <CardContent>
                {treatment.progress ? (
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                    {treatment.progress}
                  </Typography>
                ) : (
                  <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 4 }}>
                    No progress notes were recorded for this treatment.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Appointment Information */}
          {treatment.appointment && (
            <Grid size={{ xs: 12 }}>
              <Card elevation={2}>
                <CardHeader 
                  title="Appointment Information" 
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
                      onClick={() => router.push(`/physiotherapist/appointments/${treatment.appointment.id}`)}
                    >
                      View Appointment
                    </Button>
                  }
                />
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Date
                      </Typography>
                      <Typography variant="body1">
                        {new Date(treatment.appointment.date).toLocaleDateString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Time
                      </Typography>
                      <Typography variant="body1">
                        {treatment.appointment.timeSlot?.startTime} - {treatment.appointment.timeSlot?.endTime}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Status
                      </Typography>
                      <Typography variant="body1">
                        {treatment.appointment.status}
                      </Typography>
                    </Grid>
                    {treatment.appointment.notes && (
                      <Grid item xs={12}>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="subtitle2" color="text.secondary">
                          Appointment Notes
                        </Typography>
                        <Typography variant="body1">
                          {treatment.appointment.notes}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </Box>
    </DashboardLayout>
  );
}