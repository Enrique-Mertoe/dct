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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Alert,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function EditAppointmentPage({ params }) {
  const router = useRouter();
  const appointmentId = params.id;
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  
  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    date: '',
    timeSlotId: '',
    notes: '',
    status: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current user
        const userResponse = await authService.getCurrentUser();
        const userData = userResponse.data;
        setUser(userData);
        
        // Get appointment details
        const appointmentResponse = await fetch(`/api/appointments/${appointmentId}`, {
          credentials: 'include'
        });
        if (!appointmentResponse.ok) {
          throw new Error('Failed to fetch appointment details');
        }
        const appointmentData = await appointmentResponse.json();
        
        // Format date for input field
        const formattedDate = appointmentData.date ? 
          new Date(appointmentData.date).toISOString().split('T')[0] : '';
        
        // Set form data
        setFormData({
          patientId: appointmentData.patientId || '',
          doctorId: appointmentData.userId || '',
          date: formattedDate,
          timeSlotId: appointmentData.timeSlotId || '',
          notes: appointmentData.notes || '',
          status: appointmentData.status || 'SCHEDULED',
        });
        
        // Fetch doctors
        const doctorsResponse = await fetch('/api/users?role=PHYSIOTHERAPIST', {
          credentials: 'include'
        });
        if (!doctorsResponse.ok) {
          throw new Error('Failed to fetch doctors');
        }
        const doctorsData = await doctorsResponse.json();
        setDoctors(doctorsData);
        
        // Fetch patients
        const patientsResponse = await fetch('/api/patients', {
          credentials: 'include'
        });
        if (!patientsResponse.ok) {
          throw new Error('Failed to fetch patients');
        }
        const patientsData = await patientsResponse.json();
        setPatients(patientsData);
        
        // Fetch time slots
        const timeSlotsResponse = await fetch('/api/timeslots?isActive=true', {
          credentials: 'include'
        });
        if (!timeSlotsResponse.ok) {
          throw new Error('Failed to fetch time slots');
        }
        const timeSlotsData = await timeSlotsResponse.json();
        setTimeSlots(timeSlotsData);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load appointment data. Please try refreshing the page.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [appointmentId]);

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
      active: true,
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
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update appointment');
      }
      
      setSuccess(true);
      
      // Redirect after 2 seconds
      setTimeout(() => {
        router.push(`/receptionist/appointments/${appointmentId}`);
      }, 2000);
    } catch (error) {
      console.error('Error updating appointment:', error);
      setError(error.message || 'Failed to update appointment. Please try again.');
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
    <RoleBasedLayout allowedRoles={['RECEPTIONIST', 'ADMIN']}>
      <DashboardLayout title="Edit Appointment" menuItems={menuItems} user={user}>
        <Box sx={{ flexGrow: 1 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              Appointment updated successfully! Redirecting...
            </Alert>
          )}
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
            <Button 
              startIcon={<ArrowBackIcon />}
              onClick={() => router.push(`/receptionist/appointments/${appointmentId}`)}
            >
              Back to Appointment
            </Button>
            <Button 
              variant="contained" 
              startIcon={<SaveIcon />}
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? <CircularProgress size={24} /> : 'Save Changes'}
            </Button>
          </Box>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Appointment Details
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth margin="normal" required>
                    <InputLabel>Patient</InputLabel>
                    <Select
                      name="patientId"
                      value={formData.patientId}
                      label="Patient"
                      onChange={handleChange}
                    >
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
                    <InputLabel>Doctor</InputLabel>
                    <Select
                      name="doctorId"
                      value={formData.doctorId}
                      label="Doctor"
                      onChange={handleChange}
                    >
                      {doctors.map((doctor) => (
                        <MenuItem key={doctor.id} value={doctor.id}>
                          {doctor.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Date"
                    name="date"
                    type="date"
                    value={formData.date}
                    onChange={handleChange}
                    margin="normal"
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth margin="normal" required>
                    <InputLabel>Time Slot</InputLabel>
                    <Select
                      name="timeSlotId"
                      value={formData.timeSlotId}
                      label="Time Slot"
                      onChange={handleChange}
                    >
                      {timeSlots.map((slot) => (
                        <MenuItem key={slot.id} value={slot.id}>
                          {slot.startTime} - {slot.endTime}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth margin="normal" required>
                    <InputLabel>Status</InputLabel>
                    <Select
                      name="status"
                      value={formData.status}
                      label="Status"
                      onChange={handleChange}
                    >
                      <MenuItem value="SCHEDULED">Scheduled</MenuItem>
                      <MenuItem value="CONFIRMED">Confirmed</MenuItem>
                      <MenuItem value="COMPLETED">Completed</MenuItem>
                      <MenuItem value="CANCELLED">Cancelled</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    margin="normal"
                    multiline
                    rows={4}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Box>
      </DashboardLayout>
    </RoleBasedLayout>
  );
}