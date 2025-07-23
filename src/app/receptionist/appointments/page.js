'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '@/services/apiService';
import RoleBasedLayout from '@/components/layout/RoleBasedLayout';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  TextField,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import DashboardLayout from '@/components/layout/DashboardLayout';

function AppointmentsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get('status');
  
  const [user, setUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState(statusFilter || 'all');
  const [dateFilter, setDateFilter] = useState('today');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current user
        const userResponse = await authService.getCurrentUser();
        const userData = userResponse.data;
        setUser(userData);
        
        // Build query parameters
        let queryParams = new URLSearchParams();
        
        if (statusFilter) {
          queryParams.append('status', statusFilter);
        }
        
        if (dateFilter === 'today') {
          const today = new Date();
          queryParams.append('date', today.toISOString().split('T')[0]);
        }
        
        // Get appointments list from API
        const appointmentsResponse = await fetch(`/api/appointments?${queryParams.toString()}`);
        if (!appointmentsResponse.ok) throw new Error('Failed to fetch appointments');
        const appointmentsData = await appointmentsResponse.json();
        
        setAppointments(appointmentsData);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load appointments. Please try refreshing the page.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router, statusFilter, dateFilter]);

  const handleConfirmAppointment = async (appointmentId) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'CONFIRMED' }),
      });
      
      if (!response.ok) throw new Error('Failed to confirm appointment');
      
      // Update the appointment in the list
      setAppointments(prevAppointments => 
        prevAppointments.map(appointment => 
          appointment.id === appointmentId 
            ? { ...appointment, status: 'CONFIRMED' } 
            : appointment
        )
      );
    } catch (error) {
      console.error('Error confirming appointment:', error);
      setError('Failed to confirm appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'CANCELLED' }),
      });
      
      if (!response.ok) throw new Error('Failed to cancel appointment');
      
      // Update the appointment in the list
      setAppointments(prevAppointments => 
        prevAppointments.map(appointment => 
          appointment.id === appointmentId 
            ? { ...appointment, status: 'CANCELLED' } 
            : appointment
        )
      );
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      setError('Failed to cancel appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (event) => {
    const newFilter = event.target.value;
    setFilter(newFilter);
    
    // Update URL with new filter
    if (newFilter === 'all') {
      router.push('/receptionist/appointments');
    } else {
      router.push(`/receptionist/appointments?status=${newFilter}`);
    }
  };

  const handleDateFilterChange = (event) => {
    setDateFilter(event.target.value);
  };

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

  const filteredAppointments = appointments.filter(appointment => {
    // Filter by status
    if (filter !== 'all' && appointment.status !== filter) {
      return false;
    }
    
    return true;
  });

  if (loading && !user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const appointmentsContent = (
    <DashboardLayout title="Appointments Management" menuItems={menuItems} user={user}>
      <Box sx={{ flexGrow: 1 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h5" component="h1">
            Appointments
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => router.push('/receptionist/appointments/new')}
          >
            Schedule Appointment
          </Button>
        </Box>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filter}
                label="Status"
                onChange={handleFilterChange}
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="CONFIRMED">Confirmed</MenuItem>
                <MenuItem value="SCHEDULED">Scheduled</MenuItem>
                <MenuItem value="COMPLETED">Completed</MenuItem>
                <MenuItem value="CANCELLED">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth>
              <InputLabel>Date</InputLabel>
              <Select
                value={dateFilter}
                label="Date"
                onChange={handleDateFilterChange}
              >
                <MenuItem value="all">All Dates</MenuItem>
                <MenuItem value="today">Today</MenuItem>
                <MenuItem value="upcoming">Upcoming</MenuItem>
                <MenuItem value="past">Past</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Patient</TableCell>
                <TableCell>Doctor</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <CircularProgress size={24} sx={{ my: 2 }} />
                  </TableCell>
                </TableRow>
              ) : filteredAppointments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No appointments found
                  </TableCell>
                </TableRow>
              ) : (
                filteredAppointments.map((appointment) => (
                  <TableRow key={appointment.id}>
                    <TableCell>{appointment.patientName}</TableCell>
                    <TableCell>{appointment.doctorName}</TableCell>
                    <TableCell>{new Date(appointment.date).toLocaleDateString()}</TableCell>
                    <TableCell>{appointment.time}</TableCell>
                    <TableCell>
                      <Chip 
                        label={appointment.status} 
                        color={
                          appointment.status === 'CONFIRMED' ? 'success' : 
                          appointment.status === 'SCHEDULED' ? 'primary' : 
                          appointment.status === 'COMPLETED' ? 'info' : 
                          'default'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      {appointment.status === 'SCHEDULED' && (
                        <IconButton 
                          size="small" 
                          color="success"
                          onClick={() => handleConfirmAppointment(appointment.id)}
                        >
                          <CheckCircleIcon fontSize="small" />
                        </IconButton>
                      )}
                      {(appointment.status === 'SCHEDULED' || appointment.status === 'CONFIRMED') && (
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleCancelAppointment(appointment.id)}
                        >
                          <CancelIcon fontSize="small" />
                        </IconButton>
                      )}
                      <Button 
                        size="small" 
                        onClick={() => router.push(`/receptionist/appointments/${appointment.id}`)}
                      >
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </DashboardLayout>
  );

  return (
    <RoleBasedLayout allowedRoles={['RECEPTIONIST', 'ADMIN']}>
      {appointmentsContent}
    </RoleBasedLayout>
  );
}

export default function AppointmentsPage() {
  return (
    <Suspense fallback={
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    }>
      <AppointmentsContent />
    </Suspense>
  );
}