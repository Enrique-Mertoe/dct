'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/apiService';
import RoleBasedLayout from '@/components/layout/RoleBasedLayout';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Grid,
  Chip,
  Divider,
  Avatar,
  Card,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tab,
  Tabs,
  IconButton,
  Alert,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import EventIcon from '@mui/icons-material/Event';
import MedicalInformationIcon from '@mui/icons-material/MedicalInformation';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import HomeIcon from '@mui/icons-material/Home';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import WcIcon from '@mui/icons-material/Wc';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function PatientDetailsPage({ params }) {
  const router = useRouter();
  const patientId = params.id;
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
        
        // Get patient details
        const patientResponse = await fetch(`/api/patients/${patientId}`);
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
      path: '/receptionist',
      active: false,
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
      active: true,
    },
    {
      text: 'Schedule',
      icon: <EventAvailableIcon />,
      path: '/receptionist/schedule',
      active: false,
    },
  ];

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
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
      <RoleBasedLayout allowedRoles={['RECEPTIONIST', 'ADMIN']}>
        <DashboardLayout title="Patient Not Found" menuItems={menuItems} user={user}>
          <Alert severity="error">
            Patient not found or you don't have permission to view this patient.
          </Alert>
          <Button 
            startIcon={<ArrowBackIcon />} 
            onClick={() => router.push('/receptionist/patients')}
            sx={{ mt: 2 }}
          >
            Back to Patients List
          </Button>
        </DashboardLayout>
      </RoleBasedLayout>
    );
  }

  // Format patient name
  const patientName = `${patient.firstName} ${patient.lastName}`;
  
  // Get patient age
  const calculateAge = (dateOfBirth) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };
  
  const patientAge = calculateAge(patient.dateOfBirth);

  const patientContent = (
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
            onClick={() => router.push('/receptionist/patients')}
          >
            Back to Patients
          </Button>
          <Box>
            <Button 
              variant="outlined" 
              sx={{ mr: 2 }}
              onClick={() => router.push(`/receptionist/appointments/new?patientId=${patientId}`)}
            >
              Schedule Appointment
            </Button>
            <Button 
              variant="contained" 
              startIcon={<EditIcon />}
              onClick={() => router.push(`/receptionist/patients/${patientId}/edit`)}
            >
              Edit Patient
            </Button>
          </Box>
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
            <Grid size={{ xs: 12, md: 1 }}>
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
            <Grid size={{ xs: 12, md: 8 }}>
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
                {patient.assignedDoctor && (
                  <Chip 
                    icon={<LocalHospitalIcon sx={{ color: 'white !important' }} />} 
                    label={`Dr. ${patient.assignedDoctor.name}`} 
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                  />
                )}
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
              <Button 
                variant="contained" 
                color="secondary"
                onClick={() => router.push(`/receptionist/appointments/new?patientId=${patientId}`)}
                sx={{ 
                  bgcolor: 'white', 
                  color: 'primary.main',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' }
                }}
              >
                Schedule Appointment
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
            <Tab icon={<EventIcon />} label="Appointments" />
            <Tab icon={<MedicalInformationIcon />} label="Medical History" />
          </Tabs>
        </Box>

        {/* Tab Content */}
        <Box sx={{ mt: 2 }}>
          {/* Personal Info Tab */}
          {tabValue === 0 && (
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
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
                        <ListItemIcon>
                          <EmailIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Email" 
                          secondary={patient.email || 'Not provided'} 
                        />
                      </ListItem>
                      <Divider />
                      <ListItem>
                        <ListItemIcon>
                          <PhoneIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Phone" 
                          secondary={patient.phone} 
                        />
                      </ListItem>
                      <Divider />
                      <ListItem>
                        <ListItemIcon>
                          <HomeIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Address" 
                          secondary={patient.address || 'Not provided'} 
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
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
                        <ListItemIcon>
                          <CalendarMonthIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Date of Birth" 
                          secondary={new Date(patient.dateOfBirth).toLocaleDateString()} 
                        />
                      </ListItem>
                      <Divider />
                      <ListItem>
                        <ListItemIcon>
                          <WcIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Gender" 
                          secondary={patient.gender} 
                        />
                      </ListItem>
                      <Divider />
                      <ListItem>
                        <ListItemIcon>
                          <LocalHospitalIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Assigned Doctor" 
                          secondary={patient.assignedDoctor ? patient.assignedDoctor.name : 'Not assigned'} 
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Appointments Tab */}
          {tabValue === 1 && (
            <Card elevation={2}>
              <CardHeader 
                title="Appointment History" 
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
                    onClick={() => router.push(`/receptionist/appointments/new?patientId=${patientId}`)}
                  >
                    New Appointment
                  </Button>
                }
              />
              <CardContent>
                {patient.appointments && patient.appointments.length > 0 ? (
                  <List>
                    {patient.appointments.map((appointment, index) => (
                      <Box key={appointment.id}>
                        <ListItem
                          secondaryAction={
                            <Button 
                              size="small" 
                              variant="outlined"
                              onClick={() => router.push(`/receptionist/appointments/${appointment.id}`)}
                            >
                              Details
                            </Button>
                          }
                        >
                          <ListItemIcon>
                            <EventIcon color="primary" />
                          </ListItemIcon>
                          <ListItemText 
                            primary={new Date(appointment.date).toLocaleDateString()}
                            secondary={
                              <Box>
                                <Typography variant="body2">
                                  {appointment.timeSlot.startTime} - {appointment.timeSlot.endTime}
                                </Typography>
                                <Chip 
                                  size="small" 
                                  label={appointment.status} 
                                  color={
                                    appointment.status === 'CONFIRMED' ? 'success' : 
                                    appointment.status === 'SCHEDULED' ? 'primary' : 
                                    appointment.status === 'COMPLETED' ? 'info' : 
                                    'default'
                                  }
                                  sx={{ mt: 1 }}
                                />
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < patient.appointments.length - 1 && <Divider />}
                      </Box>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 4 }}>
                    No appointment history found for this patient.
                  </Typography>
                )}
              </CardContent>
            </Card>
          )}

          {/* Medical History Tab */}
          {tabValue === 2 && (
            <Card elevation={2}>
              <CardHeader 
                title="Medical History" 
                sx={{ 
                  bgcolor: 'primary.main', 
                  color: 'white',
                  '& .MuiCardHeader-title': { fontWeight: 'bold' }
                }}
                action={
                  <IconButton 
                    sx={{ color: 'white' }}
                    onClick={() => router.push(`/receptionist/patients/${patientId}/edit?tab=medical`)}
                  >
                    <EditIcon />
                  </IconButton>
                }
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
        </Box>

        {/* Treatment History */}
        {patient.treatments && patient.treatments.length > 0 && (
          <Card elevation={2} sx={{ mt: 3 }}>
            <CardHeader 
              title="Treatment History" 
              sx={{ 
                bgcolor: 'primary.main', 
                color: 'white',
                '& .MuiCardHeader-title': { fontWeight: 'bold' }
              }}
            />
            <CardContent>
              <List>
                {patient.treatments.map((treatment, index) => (
                  <Box key={treatment.id}>
                    <ListItem
                      secondaryAction={
                        <Button 
                          size="small" 
                          variant="outlined"
                          onClick={() => router.push(`/receptionist/treatments/${treatment.id}`)}
                        >
                          View Details
                        </Button>
                      }
                    >
                      <ListItemIcon>
                        <MedicalInformationIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={new Date(treatment.date).toLocaleDateString()}
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
            </CardContent>
          </Card>
        )}
      </Box>
    </DashboardLayout>
  );

  return (
    <RoleBasedLayout allowedRoles={['RECEPTIONIST', 'ADMIN']}>
      {patientContent}
    </RoleBasedLayout>
  );
}