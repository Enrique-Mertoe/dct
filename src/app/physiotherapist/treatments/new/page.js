'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '@/services/apiService';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  CardHeader,
  Alert,
  Divider,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import MedicalInformationIcon from '@mui/icons-material/MedicalInformation';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function NewTreatmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const appointmentId = searchParams.get('appointmentId');
  const patientId = searchParams.get('patientId');
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  
  const [formData, setFormData] = useState({
    appointmentId: appointmentId || '',
    patientId: patientId || '',
    notes: '',
    homeProgram: '',
    progress: '',
  });

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
        
        // Get patients list
        const patientsResponse = await fetch('/api/patients?assignedToMe=true', {
          credentials: 'include'
        });
        if (!patientsResponse.ok) {
          throw new Error('Failed to fetch patients');
        }
        const patientsData = await patientsResponse.json();
        setPatients(patientsData);
        
        // If appointment ID is provided, fetch appointment details
        if (appointmentId) {
          const appointmentResponse = await fetch(`/api/appointments/${appointmentId}`, {
            credentials: 'include'
          });
          if (!appointmentResponse.ok) {
            throw new Error('Failed to fetch appointment details');
          }
          const appointmentData = await appointmentResponse.json();
          
          // Pre-fill form with appointment data
          setFormData(prev => ({
            ...prev,
            appointmentId,
            patientId: appointmentData.patientId,
            notes: appointmentData.notes || '',
          }));
          
          // Check if treatment already exists
          if (appointmentData.treatment) {
            router.push(`/physiotherapist/treatments/${appointmentData.treatment.id}`);
            return;
          }
        }
        // If patient ID is provided, fetch available appointments
        else if (patientId) {
          const appointmentsResponse = await fetch(`/api/appointments?patientId=${patientId}&status=CONFIRMED`, {
            credentials: 'include'
          });
          if (!appointmentsResponse.ok) {
            throw new Error('Failed to fetch appointments');
          }
          const appointmentsData = await appointmentsResponse.json();
          
          // Filter to only show today's or past appointments
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const validAppointments = appointmentsData.filter(apt => 
            new Date(apt.date) <= today
          );
          
          setAppointments(validAppointments);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load required data. Please try refreshing the page.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router, appointmentId, patientId]);

  // Fetch appointments when patient changes
  useEffect(() => {
    const fetchAppointments = async () => {
      if (!formData.patientId) {
        setAppointments([]);
        return;
      }
      
      try {
        const appointmentsResponse = await fetch(`/api/appointments?patientId=${formData.patientId}&status=CONFIRMED`, {
          credentials: 'include'
        });
        if (!appointmentsResponse.ok) {
          throw new Error('Failed to fetch appointments');
        }
        const appointmentsData = await appointmentsResponse.json();
        
        // Filter to only show today's or past appointments
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const validAppointments = appointmentsData.filter(apt => 
          new Date(apt.date) <= today
        );
        
        setAppointments(validAppointments);
      } catch (error) {
        console.error('Error fetching appointments:', error);
        setError('Failed to load appointments. Please try refreshing the page.');
      }
    };

    if (formData.patientId && !appointmentId) {
      fetchAppointments();
    }
  }, [formData.patientId, appointmentId]);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    
    try {
      // Validate form
      if (!formData.appointmentId) {
        throw new Error('Please select an appointment');
      }
      
      if (!formData.notes) {
        throw new Error('Treatment notes are required');
      }
      
      // Submit treatment
      const response = await fetch('/api/treatments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create treatment');
      }
      
      const treatmentData = await response.json();
      
      setSuccess(true);
      
      // Redirect after 2 seconds
      setTimeout(() => {
        router.push(`/physiotherapist/treatments/${treatmentData.id}`);
      }, 2000);
    } catch (error) {
      console.error('Error creating treatment:', error);
      setError(error.message || 'Failed to create treatment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <DashboardLayout title="Record Treatment" menuItems={menuItems} user={user}>
      <Box sx={{ flexGrow: 1 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Treatment recorded successfully! Redirecting...
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
            startIcon={<SaveIcon />}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={24} /> : 'Save Treatment'}
          </Button>
        </Box>

        <Card>
          <CardHeader 
            title="Record Treatment" 
            sx={{ 
              bgcolor: 'primary.main', 
              color: 'white',
              '& .MuiCardHeader-title': { fontWeight: 'bold' }
            }}
          />
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal" required>
                  <InputLabel>Patient</InputLabel>
                  <Select
                    name="patientId"
                    value={formData.patientId}
                    label="Patient"
                    onChange={handleChange}
                    disabled={!!appointmentId}
                  >
                    <MenuItem value="">
                      <em>Select a patient</em>
                    </MenuItem>
                    {patients.map((patient) => (
                      <MenuItem key={patient.id} value={patient.id}>
                        {patient.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal" required>
                  <InputLabel>Appointment</InputLabel>
                  <Select
                    name="appointmentId"
                    value={formData.appointmentId}
                    label="Appointment"
                    onChange={handleChange}
                    disabled={!!appointmentId}
                  >
                    <MenuItem value="">
                      <em>Select an appointment</em>
                    </MenuItem>
                    {appointments.map((appointment) => (
                      <MenuItem key={appointment.id} value={appointment.id}>
                        {new Date(appointment.date).toLocaleDateString()} - {appointment.time}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Treatment Details
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Treatment Notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  margin="normal"
                  multiline
                  rows={4}
                  required
                  placeholder="Describe the treatment provided, techniques used, and observations"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Home Program"
                  name="homeProgram"
                  value={formData.homeProgram}
                  onChange={handleChange}
                  margin="normal"
                  multiline
                  rows={3}
                  placeholder="Exercises and activities for the patient to do at home"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Progress Notes"
                  name="progress"
                  value={formData.progress}
                  onChange={handleChange}
                  margin="normal"
                  multiline
                  rows={3}
                  placeholder="Notes on patient's progress, improvements, or areas of concern"
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
    </DashboardLayout>
  );
}