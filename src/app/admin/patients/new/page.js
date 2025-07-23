'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {authService, patientService} from '@/services/apiService';
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
  Card,
  CardContent,
  Alert,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import SettingsIcon from '@mui/icons-material/Settings';
import MedicalInformationIcon from '@mui/icons-material/MedicalInformation';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function NewPatientPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState([]);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    doctorId: '',
    medicalHistory: '',
  });

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
        
        // Fetch doctors from API
        const response = await fetch('/api/users?role=PHYSIOTHERAPIST');
        if (!response.ok) {
          throw new Error('Failed to fetch doctors');
        }
        
        const doctorsData = await response.json();
        setDoctors(doctorsData);
      } catch (error) {
        console.error('Error fetching data:', error);
        router.push('/login');
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
      active: true,
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
    
    try {
      // Call API to create patient
      const response = await patientService.createPatient(formData);
      
      // Show success message
      setSubmitSuccess(true);
      
      // Reset form after 2 seconds and redirect
      setTimeout(() => {
        router.push('/admin/patients');
      }, 2000);
    } catch (error) {
      console.error('Error creating patient:', error);
      alert('Failed to create patient: ' + error.message);
    }
  };

  if (loading || !user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <DashboardLayout title="Add New Patient" menuItems={menuItems} user={user}>
      <Box sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Button 
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push('/admin/patients')}
          >
            Back to Patients
          </Button>
          <Button 
            variant="contained" 
            startIcon={<SaveIcon />}
            onClick={handleSubmit}
          >
            Save Patient
          </Button>
        </Box>

        {submitSuccess && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Patient created successfully! Redirecting...
          </Alert>
        )}

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Patient Information
            </Typography>
            
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="First Name"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  margin="normal"
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Last Name"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  margin="normal"
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  margin="normal"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  margin="normal"
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Date of Birth"
                  name="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  margin="normal"
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth margin="normal" required>
                  <InputLabel>Gender</InputLabel>
                  <Select
                    name="gender"
                    value={formData.gender}
                    label="Gender"
                    onChange={handleChange}
                  >
                    <MenuItem value="Male">Male</MenuItem>
                    <MenuItem value="Female">Female</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  margin="normal"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth margin="normal" required>
                  <InputLabel>Assign Doctor</InputLabel>
                  <Select
                    name="doctorId"
                    value={formData.doctorId}
                    label="Assign Doctor"
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
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Medical History"
                  name="medicalHistory"
                  value={formData.medicalHistory}
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
  );
}