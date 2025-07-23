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
  TextField,
  Switch,
  FormControlLabel,
  Divider,
  Card,
  CardContent,
  CardHeader,
  Tabs,
  Tab,
  Alert,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import SettingsIcon from '@mui/icons-material/Settings';
import MedicalInformationIcon from '@mui/icons-material/MedicalInformation';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [settings, setSettings] = useState({
    clinicName: 'Professional Physiotherapy Clinic',
    clinicEmail: 'contact@clinic.local',
    clinicPhone: '555-123-4567',
    clinicAddress: '123 Health Street, Medical District, City',
    appointmentDuration: 60,
    workingHoursStart: '09:00',
    workingHoursEnd: '17:00',
    workingDays: [1, 2, 3, 4, 5], // Monday to Friday
    enableSmsNotifications: true,
    enableEmailNotifications: true,
    allowPatientRegistration: true,
    allowPatientAppointmentBooking: true,
  });
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current user
        const userResponse = await authService.getCurrentUser();
        setUser(userResponse.data);
        
        // Redirect if not admin
        if (userResponse.data.role !== 'ADMIN') {
          router.push(`/${userResponse.data.role.toLowerCase()}`);
          return;
        }
        
        // Fetch settings from API
        const response = await fetch('/api/settings');
        if (!response.ok) {
          throw new Error('Failed to fetch settings');
        }
        
        const settingsData = await response.json();
        
        // Merge with default settings
        setSettings({
          ...settings,
          ...settingsData
        });
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const menuItems = [
    {
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/admin',
      active: false,
    },
    {
      text: 'Users',
      icon: <PeopleIcon />,
      path: '/admin/users',
      active: false,
    },
    {
      text: 'Patients',
      icon: <MedicalInformationIcon />,
      path: '/admin/patients',
      active: false,
    },
    {
      text: 'Appointments',
      icon: <CalendarMonthIcon />,
      path: '/admin/appointments',
      active: false,
    },
    {
      text: 'System Settings',
      icon: <SettingsIcon />,
      path: '/admin/settings',
      active: true,
    },
  ];

  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    setSettings({
      ...settings,
      [name]: e.target.type === 'checkbox' ? checked : value,
    });
  };

  const handleSave = async () => {
    try {
      // Save settings to API
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save settings');
      }
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings: ' + error.message);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  if (loading || !user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <DashboardLayout title="System Settings" menuItems={menuItems} user={user}>
      <Box sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h5" component="h1">
            System Settings
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<SaveIcon />}
            onClick={handleSave}
          >
            Save Changes
          </Button>
        </Box>

        {saveSuccess && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Settings saved successfully!
          </Alert>
        )}

        <Paper sx={{ mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange} centered>
            <Tab label="General" />
            <Tab label="Appointments" />
            <Tab label="Notifications" />
            <Tab label="System" />
          </Tabs>
        </Paper>

        {/* General Settings */}
        {tabValue === 0 && (
          <Card>
            <CardHeader title="Clinic Information" />
            <CardContent>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Clinic Name"
                    name="clinicName"
                    value={settings.clinicName}
                    onChange={handleChange}
                    margin="normal"
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Clinic Email"
                    name="clinicEmail"
                    value={settings.clinicEmail}
                    onChange={handleChange}
                    margin="normal"
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Clinic Phone"
                    name="clinicPhone"
                    value={settings.clinicPhone}
                    onChange={handleChange}
                    margin="normal"
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Clinic Address"
                    name="clinicAddress"
                    value={settings.clinicAddress}
                    onChange={handleChange}
                    margin="normal"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Appointment Settings */}
        {tabValue === 1 && (
          <Card>
            <CardHeader title="Appointment Settings" />
            <CardContent>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Default Appointment Duration (minutes)"
                    name="appointmentDuration"
                    type="number"
                    value={settings.appointmentDuration}
                    onChange={handleChange}
                    margin="normal"
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField
                    fullWidth
                    label="Working Hours Start"
                    name="workingHoursStart"
                    type="time"
                    value={settings.workingHoursStart}
                    onChange={handleChange}
                    margin="normal"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField
                    fullWidth
                    label="Working Hours End"
                    name="workingHoursEnd"
                    type="time"
                    value={settings.workingHoursEnd}
                    onChange={handleChange}
                    margin="normal"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Working Days
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.workingDays.includes(1)}
                        onChange={(e) => {
                          const newDays = e.target.checked
                            ? [...settings.workingDays, 1]
                            : settings.workingDays.filter(day => day !== 1);
                          setSettings({ ...settings, workingDays: newDays });
                        }}
                      />
                    }
                    label="Monday"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.workingDays.includes(2)}
                        onChange={(e) => {
                          const newDays = e.target.checked
                            ? [...settings.workingDays, 2]
                            : settings.workingDays.filter(day => day !== 2);
                          setSettings({ ...settings, workingDays: newDays });
                        }}
                      />
                    }
                    label="Tuesday"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.workingDays.includes(3)}
                        onChange={(e) => {
                          const newDays = e.target.checked
                            ? [...settings.workingDays, 3]
                            : settings.workingDays.filter(day => day !== 3);
                          setSettings({ ...settings, workingDays: newDays });
                        }}
                      />
                    }
                    label="Wednesday"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.workingDays.includes(4)}
                        onChange={(e) => {
                          const newDays = e.target.checked
                            ? [...settings.workingDays, 4]
                            : settings.workingDays.filter(day => day !== 4);
                          setSettings({ ...settings, workingDays: newDays });
                        }}
                      />
                    }
                    label="Thursday"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.workingDays.includes(5)}
                        onChange={(e) => {
                          const newDays = e.target.checked
                            ? [...settings.workingDays, 5]
                            : settings.workingDays.filter(day => day !== 5);
                          setSettings({ ...settings, workingDays: newDays });
                        }}
                      />
                    }
                    label="Friday"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.workingDays.includes(6)}
                        onChange={(e) => {
                          const newDays = e.target.checked
                            ? [...settings.workingDays, 6]
                            : settings.workingDays.filter(day => day !== 6);
                          setSettings({ ...settings, workingDays: newDays });
                        }}
                      />
                    }
                    label="Saturday"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.workingDays.includes(0)}
                        onChange={(e) => {
                          const newDays = e.target.checked
                            ? [...settings.workingDays, 0]
                            : settings.workingDays.filter(day => day !== 0);
                          setSettings({ ...settings, workingDays: newDays });
                        }}
                      />
                    }
                    label="Sunday"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Notification Settings */}
        {tabValue === 2 && (
          <Card>
            <CardHeader title="Notification Settings" />
            <CardContent>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.enableSmsNotifications}
                        onChange={handleChange}
                        name="enableSmsNotifications"
                      />
                    }
                    label="Enable SMS Notifications"
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.enableEmailNotifications}
                        onChange={handleChange}
                        name="enableEmailNotifications"
                      />
                    }
                    label="Enable Email Notifications"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* System Settings */}
        {tabValue === 3 && (
          <Card>
            <CardHeader title="System Settings" />
            <CardContent>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.allowPatientRegistration}
                        onChange={handleChange}
                        name="allowPatientRegistration"
                      />
                    }
                    label="Allow Patient Self-Registration"
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.allowPatientAppointmentBooking}
                        onChange={handleChange}
                        name="allowPatientAppointmentBooking"
                      />
                    }
                    label="Allow Patients to Book Appointments"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}
      </Box>
    </DashboardLayout>
  );
}