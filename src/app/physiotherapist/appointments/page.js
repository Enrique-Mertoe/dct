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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  TextField,
  Chip,
  Tabs,
  Tab,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import MedicalInformationIcon from '@mui/icons-material/MedicalInformation';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function AppointmentsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('upcoming');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
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
        
        // Get appointments list from API
        let queryParams = '';
        if (filter === 'today') {
          const today = new Date().toISOString().split('T')[0];
          queryParams = `?date=${today}`;
        } else if (filter === 'upcoming') {
          const today = new Date().toISOString().split('T')[0];
          queryParams = `?startDate=${today}`;
        } else if (filter === 'past') {
          const today = new Date().toISOString().split('T')[0];
          queryParams = `?endDate=${today}`;
        }
        
        const appointmentsResponse = await fetch(`/api/appointments${queryParams}`, {
          credentials: 'include'
        });
        if (!appointmentsResponse.ok) {
          throw new Error('Failed to fetch appointments');
        }
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
  }, [router, filter]);

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

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    if (newValue === 0) {
      setFilter('upcoming');
    } else if (newValue === 1) {
      setFilter('today');
    } else if (newValue === 2) {
      setFilter('past');
    }
  };

  // Filter appointments based on selected date
  const filteredAppointments = appointments.filter(appointment => {
    if (tabValue === 1) { // Today tab
      return appointment.date === new Date().toISOString().split('T')[0];
    } else if (tabValue === 0) { // Upcoming tab
      return new Date(appointment.date) >= new Date(new Date().setHours(0, 0, 0, 0));
    } else if (tabValue === 2) { // Past tab
      return new Date(appointment.date) < new Date(new Date().setHours(0, 0, 0, 0));
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

  return (
    <DashboardLayout title="My Appointments" menuItems={menuItems} user={user}>
      <Box sx={{ flexGrow: 1 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h5" component="h1">
            My Appointments
          </Typography>
        </Box>

        <Paper sx={{ mb: 3 }}>
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
            }}
          >
            <Tab label="Upcoming" />
            <Tab label="Today" />
            <Tab label="Past" />
          </Tabs>
        </Paper>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Patient</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Notes</TableCell>
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
                    <TableCell>{new Date(appointment.date).toLocaleDateString()}</TableCell>
                    <TableCell>{appointment.time}</TableCell>
                    <TableCell>{appointment.patientName}</TableCell>
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
                    <TableCell>
                      {appointment.notes ? (
                        appointment.notes.length > 30 ? 
                          `${appointment.notes.substring(0, 30)}...` : 
                          appointment.notes
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Button 
                        size="small" 
                        variant="outlined"
                        onClick={() => router.push(`/physiotherapist/appointments/${appointment.id}`)}
                      >
                        View
                      </Button>
                      {(appointment.status === 'CONFIRMED' || appointment.status === 'COMPLETED') && 
                       new Date(appointment.date) <= new Date() && (
                        <Button 
                          size="small" 
                          variant="contained"
                          color="primary"
                          sx={{ ml: 1 }}
                          onClick={() => router.push(`/physiotherapist/treatments/new?appointmentId=${appointment.id}`)}
                        >
                          {appointment.status === 'COMPLETED' ? 'View Treatment' : 'Record Treatment'}
                        </Button>
                      )}
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
}