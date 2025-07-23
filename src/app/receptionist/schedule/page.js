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
  IconButton,
  Tabs,
  Tab,
  Badge,
  Chip,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function SchedulePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [weekDates, setWeekDates] = useState([]);
  const [currentWeekStart, setCurrentWeekStart] = useState(getStartOfWeek(new Date()));
  const [workingDays, setWorkingDays] = useState([1, 2, 3, 4, 5]); // Default Mon-Fri

  // Get start of week (Monday)
  function getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
    return new Date(d.setDate(diff));
  }

  // Generate array of dates for the week
  function generateWeekDates(startDate) {
    const dates = [];
    const start = new Date(startDate);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  }

  // Format date as YYYY-MM-DD
  function formatDate(date) {
    return date.toISOString().split('T')[0];
  }

  // Navigate to previous week
  const goToPreviousWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() - 7);
    setCurrentWeekStart(newStart);
  };

  // Navigate to next week
  const goToNextWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() + 7);
    setCurrentWeekStart(newStart);
  };

  // Check if a date is a working day
  const isWorkingDay = (date) => {
    return workingDays.includes(date.getDay());
  };

  // Get appointments for a specific date and time slot
  const getAppointmentsForTimeSlot = (timeSlotId, date) => {
    return appointments.filter(appointment => 
      appointment.timeSlotId === timeSlotId && 
      appointment.date === formatDate(date)
    );
  };

  // Calculate remaining capacity for a time slot
  const getRemainingCapacity = (timeSlot, date) => {
    const appointmentsInSlot = getAppointmentsForTimeSlot(timeSlot.id, date);
    return timeSlot.capacity - appointmentsInSlot.length;
  };

  // Get appointments count for a date
  const getAppointmentsCountForDate = (date) => {
    return appointments.filter(appointment => appointment.date === formatDate(date)).length;
  };

  useEffect(() => {
    // Update week dates when current week start changes
    setWeekDates(generateWeekDates(currentWeekStart));
  }, [currentWeekStart]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await authService.getCurrentUser();
        const userData = response.data;
        setUser(userData);
      } catch (error) {
        console.error('Error fetching user data:', error);
        return;
      }
    };

    const fetchDoctors = async () => {
      try {
        const response = await fetch('/api/users?role=PHYSIOTHERAPIST', {
          credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to fetch doctors');
        const doctorsData = await response.json();
        setDoctors(doctorsData);
        
        // Set first doctor as default if available
        if (doctorsData.length > 0) {
          setSelectedDoctor(doctorsData[0].id);
        }
      } catch (error) {
        console.error('Error fetching doctors:', error);
        setError('Failed to load doctors. Please try refreshing the page.');
      }
    };

    const fetchWorkingDays = async () => {
      try {
        // Fetch working days from settings API
        const response = await fetch('/api/settings?keys=workingDays', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const settings = await response.json();
          if (settings.workingDays) {
            // Make sure we have an array of numbers
            const days = Array.isArray(settings.workingDays) 
              ? settings.workingDays 
              : JSON.parse(settings.workingDays);
            
            setWorkingDays(days);
          }
        }
      } catch (error) {
        console.error('Error fetching working days:', error);
        // Keep default working days if there's an error
      }
    };

    fetchUserData();
    fetchDoctors();
    fetchWorkingDays();
  }, []);

  useEffect(() => {
    const fetchTimeSlots = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/timeslots?isActive=true', {
          credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to fetch time slots');
        const timeSlotsData = await response.json();
        setTimeSlots(timeSlotsData);
      } catch (error) {
        console.error('Error fetching time slots:', error);
        setError('Failed to load schedule. Please try refreshing the page.');
      } finally {
        setLoading(false);
      }
    };

    fetchTimeSlots();
  }, []);

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!selectedDoctor) return;
      
      try {
        setLoading(true);
        
        // Get start and end dates for the week
        const startDate = formatDate(weekDates[0]);
        const endDate = formatDate(weekDates[6]);
        
        // Fetch appointments for the entire week
        const response = await fetch(`/api/appointments?startDate=${startDate}&endDate=${endDate}&doctorId=${selectedDoctor}`, {
          credentials: 'include'
        });
        
        if (!response.ok) throw new Error('Failed to fetch appointments');
        const appointmentsData = await response.json();
        setAppointments(appointmentsData);
      } catch (error) {
        console.error('Error fetching appointments:', error);
        setError('Failed to load appointments. Please try refreshing the page.');
      } finally {
        setLoading(false);
      }
    };

    if (weekDates.length > 0) {
      fetchAppointments();
    }
  }, [selectedDoctor, weekDates]);

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
      active: false,
    },
    {
      text: 'Schedule',
      icon: <EventAvailableIcon />,
      path: '/receptionist/schedule',
      active: true,
    },
  ];

  if (loading && !user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const scheduleContent = (
    <DashboardLayout title="Schedule Management" menuItems={menuItems} user={user}>
      <Box sx={{ flexGrow: 1 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h5" component="h1">
            Schedule
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => router.push('/receptionist/appointments/new')}
          >
            Schedule Appointment
          </Button>
        </Box>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Doctor</InputLabel>
              <Select
                value={selectedDoctor}
                label="Doctor"
                onChange={(e) => setSelectedDoctor(e.target.value)}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
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
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>

        {/* Week Navigation */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <IconButton onClick={goToPreviousWeek}>
            <ArrowBackIcon />
          </IconButton>
          
          <Typography variant="h6">
            {weekDates.length > 0 && `${weekDates[0].toLocaleDateString()} - ${weekDates[6].toLocaleDateString()}`}
          </Typography>
          
          <IconButton onClick={goToNextWeek}>
            <ArrowForwardIcon />
          </IconButton>
        </Box>

        {/* Week Day Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs 
            value={weekDates.findIndex(date => formatDate(date) === selectedDate) !== -1 ? 
              weekDates.findIndex(date => formatDate(date) === selectedDate) : 0}
            onChange={(e, newValue) => setSelectedDate(formatDate(weekDates[newValue]))}
            variant="scrollable"
            scrollButtons="auto"
          >
            {weekDates.map((date, index) => (
              <Tab 
                key={index} 
                label={
                  <Badge 
                    badgeContent={getAppointmentsCountForDate(date)} 
                    color="primary"
                    invisible={getAppointmentsCountForDate(date) === 0}
                  >
                    <Box>
                      <Typography variant="body2">{date.toLocaleDateString('en-US', { weekday: 'short' })}</Typography>
                      <Typography variant="caption">{date.getDate()}</Typography>
                    </Box>
                  </Badge>
                }
                disabled={!isWorkingDay(date)}
                sx={{
                  opacity: isWorkingDay(date) ? 1 : 0.5,
                  color: formatDate(date) === selectedDate ? 'primary.main' : 'text.primary'
                }}
              />
            ))}
          </Tabs>
        </Box>

        {/* Time Slots Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Time Slot</TableCell>
                <TableCell>Capacity</TableCell>
                <TableCell>Booked</TableCell>
                <TableCell>Available</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <CircularProgress size={24} sx={{ my: 2 }} />
                  </TableCell>
                </TableRow>
              ) : !selectedDoctor ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    Please select a doctor to view available time slots
                  </TableCell>
                </TableRow>
              ) : !isWorkingDay(new Date(selectedDate)) ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    This is not a working day. Please select a different date.
                  </TableCell>
                </TableRow>
              ) : timeSlots.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No time slots available for this day
                  </TableCell>
                </TableRow>
              ) : (
                timeSlots
                  .filter(slot => slot.dayOfWeek === new Date(selectedDate).getDay())
                  .map((timeSlot) => {
                    const selectedDateObj = new Date(selectedDate);
                    const appointmentsInSlot = getAppointmentsForTimeSlot(timeSlot.id, selectedDateObj);
                    const remainingCapacity = timeSlot.capacity - appointmentsInSlot.length;
                    
                    return (
                      <TableRow key={timeSlot.id}>
                        <TableCell>{timeSlot.startTime} - {timeSlot.endTime}</TableCell>
                        <TableCell>{timeSlot.capacity}</TableCell>
                        <TableCell>
                          <Chip 
                            label={appointmentsInSlot.length} 
                            color={appointmentsInSlot.length > 0 ? "primary" : "default"}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={remainingCapacity}
                            color={remainingCapacity > 0 ? 'success' : 'error'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Button 
                            size="small" 
                            variant="contained"
                            disabled={remainingCapacity <= 0}
                            onClick={() => router.push(`/receptionist/appointments/new?date=${selectedDate}&doctorId=${selectedDoctor}&timeSlotId=${timeSlot.id}`)}
                          >
                            Book
                          </Button>
                          <Button 
                            size="small" 
                            sx={{ ml: 1 }}
                            onClick={() => router.push(`/receptionist/schedule/details?date=${selectedDate}&timeSlotId=${timeSlot.id}&doctorId=${selectedDoctor}`)}
                          >
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </DashboardLayout>
  );

  return (
    <RoleBasedLayout allowedRoles={['RECEPTIONIST', 'ADMIN']}>
      {scheduleContent}
    </RoleBasedLayout>
  );
}