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
  Card,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import EventIcon from '@mui/icons-material/Event';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import NoteIcon from '@mui/icons-material/Note';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function AppointmentDetailsPage({ params }) {
  const router = useRouter();
  const appointmentId = params.id;
  const [user, setUser] = useState(null);
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [newNotes, setNewNotes] = useState('');
  const [notesUpdateLoading, setNotesUpdateLoading] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current user
        const userResponse = await authService.getCurrentUser();
        const userData = userResponse.data;
        setUser(userData);
        
        // Get appointment details
        const appointmentResponse = await fetch(`/api/appointments/${appointmentId}`);
        if (!appointmentResponse.ok) {
          throw new Error('Failed to fetch appointment details');
        }
        const appointmentData = await appointmentResponse.json();
        setAppointment(appointmentData);
        setNewStatus(appointmentData.status);
        setNewNotes(appointmentData.notes || '');
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

  const handleStatusUpdate = async () => {
    try {
      setStatusUpdateLoading(true);
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update appointment status');
      }
      
      const updatedAppointment = await response.json();
      setAppointment(updatedAppointment);
      setStatusDialogOpen(false);
    } catch (error) {
      console.error('Error updating status:', error);
      setError('Failed to update appointment status. Please try again.');
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  const handleNotesUpdate = async () => {
    try {
      setNotesUpdateLoading(true);
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes: newNotes }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update appointment notes');
      }
      
      const updatedAppointment = await response.json();
      setAppointment(updatedAppointment);
      setNotesDialogOpen(false);
    } catch (error) {
      console.error('Error updating notes:', error);
      setError('Failed to update appointment notes. Please try again.');
    } finally {
      setNotesUpdateLoading(false);
    }
  };

  const handleCancelAppointment = async () => {
    try {
      setCancelLoading(true);
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'CANCELLED' }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to cancel appointment');
      }
      
      const updatedAppointment = await response.json();
      setAppointment(updatedAppointment);
      setCancelDialogOpen(false);
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      setError('Failed to cancel appointment. Please try again.');
    } finally {
      setCancelLoading(false);
    }
  };

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
      <RoleBasedLayout allowedRoles={['RECEPTIONIST', 'ADMIN']}>
        <DashboardLayout title="Appointment Not Found" menuItems={menuItems} user={user}>
          <Alert severity="error">
            Appointment not found or you don't have permission to view this appointment.
          </Alert>
          <Button 
            startIcon={<ArrowBackIcon />} 
            onClick={() => router.push('/receptionist/appointments')}
            sx={{ mt: 2 }}
          >
            Back to Appointments
          </Button>
        </DashboardLayout>
      </RoleBasedLayout>
    );
  }

  const appointmentDate = new Date(appointment.date);
  const formattedDate = appointmentDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const appointmentContent = (
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
            onClick={() => router.push('/receptionist/appointments')}
          >
            Back to Appointments
          </Button>
          <Button 
            variant="contained" 
            startIcon={<EditIcon />}
            onClick={() => router.push(`/receptionist/appointments/${appointmentId}/edit`)}
          >
            Edit Appointment
          </Button>
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
            <Grid size={{ xs: 12, md: 8 }}>
              <Typography variant="h4" fontWeight="bold">
                Appointment
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mt: 1, flexWrap: 'wrap' }}>
                <Chip 
                  icon={<EventIcon sx={{ color: 'white !important' }} />} 
                  label={formattedDate} 
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                />
                <Chip 
                  icon={<AccessTimeIcon sx={{ color: 'white !important' }} />} 
                  label={`${appointment.timeSlot.startTime} - ${appointment.timeSlot.endTime}`} 
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                />
                <Chip 
                  icon={
                    appointment.status === 'CONFIRMED' ? <CheckCircleIcon sx={{ color: 'white !important' }} /> :
                    appointment.status === 'CANCELLED' ? <CancelIcon sx={{ color: 'white !important' }} /> :
                    <EventIcon sx={{ color: 'white !important' }} />
                  } 
                  label={appointment.status} 
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                />
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
              {appointment.status === 'SCHEDULED' && (
                <Button 
                  variant="contained" 
                  color="success"
                  onClick={() => setStatusDialogOpen(true)}
                  sx={{ 
                    bgcolor: 'white', 
                    color: 'primary.main',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' },
                    mr: 1
                  }}
                >
                  Confirm
                </Button>
              )}
              {(appointment.status === 'SCHEDULED' || appointment.status === 'CONFIRMED') && (
                <Button 
                  variant="contained" 
                  color="error"
                  onClick={() => setCancelDialogOpen(true)}
                  sx={{ 
                    bgcolor: 'white', 
                    color: 'error.main',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' }
                  }}
                >
                  Cancel
                </Button>
              )}
            </Grid>
          </Grid>
        </Paper>

        <Grid container spacing={3}>
          {/* Patient Information */}
          <Grid size={{ xs: 12, md: 6 }}>
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
                    onClick={() => router.push(`/receptionist/patients/${appointment.patient.id}`)}
                  >
                    View Profile
                  </Button>
                }
              />
              <CardContent>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <PersonIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Name" 
                      secondary={`${appointment.patient.firstName} ${appointment.patient.lastName}`} 
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemIcon>
                      <EventIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Date of Birth" 
                      secondary={new Date(appointment.patient.dateOfBirth).toLocaleDateString()} 
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemIcon>
                      <LocalHospitalIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Assigned Doctor" 
                      secondary={appointment.user.name} 
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Appointment Details */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card elevation={2} sx={{ height: '100%' }}>
              <CardHeader 
                title="Appointment Details" 
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
                    onClick={() => setStatusDialogOpen(true)}
                  >
                    Change Status
                  </Button>
                }
              />
              <CardContent>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <EventIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Date" 
                      secondary={formattedDate} 
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemIcon>
                      <AccessTimeIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Time" 
                      secondary={`${appointment.timeSlot.startTime} - ${appointment.timeSlot.endTime}`} 
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemIcon>
                      <LocalHospitalIcon color="primary" />
                    </ListItemIcon>
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
          <Grid size={{ xs: 12 }}>
            <Card elevation={2}>
              <CardHeader 
                title="Notes" 
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
                    onClick={() => setNotesDialogOpen(true)}
                  >
                    Edit Notes
                  </Button>
                }
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
        </Grid>
      </Box>

      {/* Status Update Dialog */}
      <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)}>
        <DialogTitle>Update Appointment Status</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Change the status of this appointment.
          </DialogContentText>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={newStatus}
              label="Status"
              onChange={(e) => setNewStatus(e.target.value)}
            >
              <MenuItem value="SCHEDULED">Scheduled</MenuItem>
              <MenuItem value="CONFIRMED">Confirmed</MenuItem>
              <MenuItem value="COMPLETED">Completed</MenuItem>
              <MenuItem value="CANCELLED">Cancelled</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleStatusUpdate} 
            variant="contained" 
            disabled={statusUpdateLoading}
          >
            {statusUpdateLoading ? <CircularProgress size={24} /> : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notes Update Dialog */}
      <Dialog open={notesDialogOpen} onClose={() => setNotesDialogOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Update Appointment Notes</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Edit the notes for this appointment.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Notes"
            fullWidth
            multiline
            rows={6}
            value={newNotes}
            onChange={(e) => setNewNotes(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNotesDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleNotesUpdate} 
            variant="contained" 
            disabled={notesUpdateLoading}
          >
            {notesUpdateLoading ? <CircularProgress size={24} /> : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Appointment Dialog */}
      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)}>
        <DialogTitle>Cancel Appointment</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel this appointment? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>No, Keep It</Button>
          <Button 
            onClick={handleCancelAppointment} 
            variant="contained" 
            color="error" 
            disabled={cancelLoading}
          >
            {cancelLoading ? <CircularProgress size={24} /> : 'Yes, Cancel Appointment'}
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );

  return (
    <RoleBasedLayout allowedRoles={['RECEPTIONIST', 'ADMIN']}>
      {appointmentContent}
    </RoleBasedLayout>
  );
}