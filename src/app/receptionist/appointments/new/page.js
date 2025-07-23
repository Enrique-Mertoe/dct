'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/apiService';
import RoleBasedLayout from '@/components/layout/RoleBasedLayout';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Paper,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function NewAppointmentPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    date: '',
    timeSlotId: '',
    notes: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current user
        const userResponse = await authService.getCurrentUser();
        const userData = userResponse.data;
        setUser(userData);
        
        // Fetch doctors from API
        const doctorsResponse = await fetch('/api/users?role=PHYSIOTHERAPIST');
        if (!doctorsResponse.ok) {
          throw new Error('Failed to fetch doctors');
        }
        const doctorsData = await doctorsResponse.json();
        setDoctors(doctorsData);
        
        // Fetch patients from API
        const patientsResponse = await fetch('/api/patients');
        if (!patientsResponse.ok) {
          throw new Error('Failed to fetch patients');
        }
        const patientsData = await patientsResponse.json();
        setPatients(patientsData);
        
        // Fetch time slots
        const timeSlotsResponse = await fetch('/api/timeslots?isActive=true');
        if (!timeSlotsResponse.ok) {
          throw new Error('Failed to fetch time slots');
        }
        const timeSlotsData = await timeSlotsResponse.json();
        setTimeSlots(timeSlotsData);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load required data. Please try refreshing the page.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  // Update available time slots when date or doctor changes
  useEffect(() => {
    const updateAvailableTimeSlots = async () => {
      if (!formData.date || !formData.doctorId) {
        setAvailableTimeSlots([]);
        return;
      }

      try {
        // Get day of week (0 = Sunday, 1 = Monday, etc.)
        const date = new Date(formData.date);
        const dayOfWeek = date.getDay();
        
        // Filter time slots for the selected day
        const dayTimeSlots = timeSlots.filter(slot => slot.dayOfWeek === dayOfWeek);
        
        // Check availability for each time slot
        const availabilityPromises = dayTimeSlots.map(async (slot) => {
          const response = await fetch(`/api/appointments/availability?date=${formData.date}&timeSlotId=${slot.id}&doctorId=${formData.doctorId}`);
          if (!response.ok) {
            throw new Error('Failed to check availability');
          }
          const data = await response.json();
          return {
            ...slot,
            available: data.available,
            remainingCapacity: data.remainingCapacity
          };
        });
        
        const availabilityResults = await Promise.all(availabilityPromises);
        setAvailableTimeSlots(availabilityResults.filter(slot => slot.available));
      } catch (error) {
        console.error('Error checking availability:', error);
        setError('Failed to check time slot availability.');
      }
    };

    updateAvailableTimeSlots();
  }, [formData.date, formData.doctorId, timeSlots]);

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
    
    // Reset time slot when date or doctor changes
    if (name === 'date' || name === 'doctorId') {
      setFormData(prev => ({
        ...prev,
        timeSlotId: '',
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.patientId || !formData.doctorId || !formData.date || !formData.timeSlotId) {
      setError('Please fill in all required fields.');
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Call API to create appointment
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create appointment');
      }
      
      // Show success message
      setSubmitSuccess(true);
      
      // Reset form after 2 seconds and redirect
      setTimeout(() => {
        router.push('/receptionist/appointments');
      }, 2000);
    } catch (error) {
      console.error('Error creating appointment:', error);
      setError(error.message || 'Failed to create appointment. Please try again.');
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

  const newAppointmentContent = (
    <DashboardLayout title="Schedule Appointment" menuItems={menuItems} user={user}>
      <Box sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Button 
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push('/receptionist/appointments')}
          >
            Back to Appointments
          </Button>
          <Button 
            variant="contained" 
            startIcon={<SaveIcon />}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={24} /> : 'Save Appointment'}
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {submitSuccess && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Appointment scheduled successfully! Redirecting...
          </Alert>
        )}

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Appointment Details
          </Typography>
          
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
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
            <Grid size={{ xs: 12, md: 6 }}>
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
            <Grid size={{ xs: 12, md: 6 }}>
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
                inputProps={{
                  min: new Date().toISOString().split('T')[0] // Prevent selecting past dates
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth margin="normal" required>
                <InputLabel>Time Slot</InputLabel>
                <Select
                  name="timeSlotId"
                  value={formData.timeSlotId}
                  label="Time Slot"
                  onChange={handleChange}
                  disabled={!formData.date || !formData.doctorId || availableTimeSlots.length === 0}
                >
                  {availableTimeSlots.map((slot) => (
                    <MenuItem key={slot.id} value={slot.id}>
                      {slot.startTime} - {slot.endTime} ({slot.remainingCapacity} slots available)
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12 }}>
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
        </Paper>
      </Box>
    </DashboardLayout>
  );

  return (
    <RoleBasedLayout allowedRoles={['RECEPTIONIST', 'ADMIN']}>
      {newAppointmentContent}
    </RoleBasedLayout>
  );
}