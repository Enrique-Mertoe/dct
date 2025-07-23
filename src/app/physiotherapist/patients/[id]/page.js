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
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  Alert,
  Avatar,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MedicalInformationIcon from '@mui/icons-material/MedicalInformation';
import EventIcon from '@mui/icons-material/Event';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import WcIcon from '@mui/icons-material/Wc';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function PatientDetailPage({ params }) {
  const router = useRouter();
  const patientId = use(params).id;
  const [user, setUser] = useState(null);
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);

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
        
        // Get patient details
        const patientResponse = await fetch(`/api/patients/${patientId}`, {
          credentials: 'include'
        });
        if (!patientResponse.ok) {
          throw new Error('Failed to fetch patient details');
        }
        const patientData = await patientResponse.json();
        setPatient(patientData);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load patient details. Please try refreshing the page.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router, patientId]);

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
      active: true,
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

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Calculate patient age
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return '';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!patient) {
    return (
      <DashboardLayout title="Patient Not Found" menuItems={menuItems} user={user}>
        <Alert severity="error">
          Patient not found or you don't have permission to view this patient.
        </Alert>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => router.push('/physiotherapist/patients')}
          sx={{ mt: 2 }}
        >
          Back to Patients List
        </Button>
      </DashboardLayout>
    );
  }

  const patientName = `${patient.firstName} ${patient.lastName}`;
  const patientAge = calculateAge(patient.dateOfBirth);

  return (
    <DashboardLayout title="Patient Details" menuItems={menuItems} user={user}>
      <Box sx={{ flexGrow: 1 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
          <Button 
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push('/physiotherapist/patients')}
          >
            Back to Patients
          </Button>
          <Button 
            variant="contained" 
            onClick={() => router.push(`/physiotherapist/treatments/new?patientId=${patientId}`)}
          >
            Add Treatment
          </Button>
        </Box>

        {/* Patient Header Card */}
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
            <Grid item xs={12} md={1}>
              <Avatar 
                sx={{ 
                  width: 80, 
                  height: 80, 
                  bgcolor: 'primary.light',
                  border: '3px solid white'
                }}
              >
                {patient.firstName.charAt(0)}{patient.lastName.charAt(0)}
              </Avatar>
            </Grid>
            <Grid item xs={12} md={8}>
              <Typography variant="h4" fontWeight="bold">
                {patientName}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mt: 1, flexWrap: 'wrap' }}>
                <Chip 
                  icon={<WcIcon sx={{ color: 'white !important' }} />} 
                  label={patient.gender} 
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                />
                <Chip 
                  icon={<CalendarMonthIcon sx={{ color: 'white !important' }} />} 
                  label={`${patientAge} years old`} 
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={3} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
              <Button 
                variant="contained" 
                color="secondary"
                onClick={() => router.push(`/physiotherapist/treatments/new?patientId=${patientId}`)}
                sx={{ 
                  bgcolor: 'white', 
                  color: 'primary.main',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' }
                }}
              >
                Record Treatment
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Tabs for different sections */}
        <Box sx={{ mb: 3 }}>
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
              bgcolor: 'background.paper',
              borderRadius: 1,
            }}
          >
            <Tab icon={<PersonIcon />} label="Personal Info" />
            <Tab icon={<MedicalInformationIcon />} label="Medical History" />
            <Tab icon={<EventIcon />} label="Treatment History" />
          </Tabs>
        </Box>

        {/* Tab Content */}
        <Box sx={{ mt: 2 }}>
          {/* Personal Info Tab */}
          {tabValue === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card elevation={2} sx={{ height: '100%' }}>
                  <CardHeader 
                    title="Contact Information" 
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
                          primary="Phone" 
                          secondary={patient.phone} 
                        />
                      </ListItem>
                      <Divider />
                      <ListItem>
                        <ListItemText 
                          primary="Email" 
                          secondary={patient.email || 'Not provided'} 
                        />
                      </ListItem>
                      <Divider />
                      <ListItem>
                        <ListItemText 
                          primary="Address" 
                          secondary={patient.address || 'Not provided'} 
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card elevation={2} sx={{ height: '100%' }}>
                  <CardHeader 
                    title="Personal Details" 
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
                          primary="Date of Birth" 
                          secondary={new Date(patient.dateOfBirth).toLocaleDateString()} 
                        />
                      </ListItem>
                      <Divider />
                      <ListItem>
                        <ListItemText 
                          primary="Gender" 
                          secondary={patient.gender} 
                        />
                      </ListItem>
                      <Divider />
                      <ListItem>
                        <ListItemText 
                          primary="Age" 
                          secondary={`${patientAge} years`} 
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Medical History Tab */}
          {tabValue === 1 && (
            <Card elevation={2}>
              <CardHeader 
                title="Medical History" 
                sx={{ 
                  bgcolor: 'primary.main', 
                  color: 'white',
                  '& .MuiCardHeader-title': { fontWeight: 'bold' }
                }}
              />
              <CardContent>
                {patient.medicalHistory ? (
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                    {patient.medicalHistory}
                  </Typography>
                ) : (
                  <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 4 }}>
                    No medical history recorded for this patient.
                  </Typography>
                )}
              </CardContent>
            </Card>
          )}

          {/* Treatment History Tab */}
          {tabValue === 2 && (
            <Card elevation={2}>
              <CardHeader 
                title="Treatment History" 
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
                    onClick={() => router.push(`/physiotherapist/treatments/new?patientId=${patientId}`)}
                  >
                    Add Treatment
                  </Button>
                }
              />
              <CardContent>
                {patient.treatments && patient.treatments.length > 0 ? (
                  <List>
                    {patient.treatments.map((treatment, index) => (
                      <Box key={treatment.id}>
                        <ListItem
                          secondaryAction={
                            <Button 
                              size="small" 
                              variant="outlined"
                              onClick={() => router.push(`/physiotherapist/treatments/${treatment.id}`)}
                            >
                              View Details
                            </Button>
                          }
                        >
                          <ListItemText 
                            primary={
                              <Typography variant="subtitle1">
                                {new Date(treatment.date).toLocaleDateString()}
                              </Typography>
                            }
                            secondary={
                              <Box>
                                <Typography variant="body2" color="text.primary">
                                  {treatment.physiotherapist.name}
                                </Typography>
                                <Typography variant="body2" sx={{ mt: 0.5 }}>
                                  {treatment.notes.substring(0, 100)}
                                  {treatment.notes.length > 100 ? '...' : ''}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < patient.treatments.length - 1 && <Divider />}
                      </Box>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 4 }}>
                    No treatment history recorded for this patient.
                  </Typography>
                )}
              </CardContent>
            </Card>
          )}
        </Box>

        {/* Upcoming Appointments */}
        <Card elevation={2} sx={{ mt: 3 }}>
          <CardHeader 
            title="Upcoming Appointments" 
            sx={{ 
              bgcolor: 'primary.main', 
              color: 'white',
              '& .MuiCardHeader-title': { fontWeight: 'bold' }
            }}
          />
          <CardContent>
            {patient.appointments && patient.appointments.filter(apt => new Date(apt.date) >= new Date()).length > 0 ? (
              <List>
                {patient.appointments
                  .filter(apt => new Date(apt.date) >= new Date())
                  .sort((a, b) => new Date(a.date) - new Date(b.date))
                  .map((appointment, index, filteredAppointments) => (
                    <Box key={appointment.id}>
                      <ListItem
                        secondaryAction={
                          <Button 
                            size="small" 
                            variant="outlined"
                            onClick={() => router.push(`/physiotherapist/appointments/${appointment.id}`)}
                          >
                            Details
                          </Button>
                        }
                      >
                        <ListItemText 
                          primary={
                            <Typography variant="subtitle1">
                              {new Date(appointment.date).toLocaleDateString()} - {appointment.time}
                            </Typography>
                          }
                          secondary={
                            <Box>
                              <Chip 
                                size="small" 
                                label={appointment.status} 
                                color={
                                  appointment.status === 'CONFIRMED' ? 'success' : 
                                  appointment.status === 'SCHEDULED' ? 'primary' : 
                                  'default'
                                }
                                sx={{ mt: 0.5 }}
                              />
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < filteredAppointments.length - 1 && <Divider />}
                    </Box>
                  ))}
              </List>
            ) : (
              <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 4 }}>
                No upcoming appointments for this patient.
              </Typography>
            )}
          </CardContent>
        </Card>
      </Box>
    </DashboardLayout>
  );
}