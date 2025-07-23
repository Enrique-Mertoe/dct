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
  Tabs,
  Tab,
  Card,
  CardContent,
  Alert,
  Divider,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import PersonIcon from '@mui/icons-material/Person';
import MedicalInformationIcon from '@mui/icons-material/MedicalInformation';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import SettingsIcon from '@mui/icons-material/Settings';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function EditPatientPage({ params }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = params.id;
  const tabParam = searchParams.get('tab');
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tabValue, setTabValue] = useState(tabParam === 'medical' ? 1 : 0);
  const [doctors, setDoctors] = useState([]);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    assignedDoctorId: '',
    medicalHistory: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current user
        const userResponse = await authService.getCurrentUser();
        const userData = userResponse.data;
        setUser(userData);
        
        // Redirect if not admin
        if (userData.role !== 'ADMIN') {
          router.push(`/${userData.role.toLowerCase()}`);
          return;
        }
        
        // Get patient details
        const patientResponse = await fetch(`/api/patients/${patientId}`);
        if (!patientResponse.ok) {
          throw new Error('Failed to fetch patient details');
        }
        const patientData = await patientResponse.json();
        
        // Format date for input field
        const formattedDate = patientData.dateOfBirth ? 
          new Date(patientData.dateOfBirth).toISOString().split('T')[0] : '';
        
        // Set form data
        setFormData({
          firstName: patientData.firstName || '',
          lastName: patientData.lastName || '',
          email: patientData.email || '',
          phone: patientData.phone || '',
          dateOfBirth: formattedDate,
          gender: patientData.gender || '',
          address: patientData.address || '',
          assignedDoctorId: patientData.assignedDoctorId || '',
          medicalHistory: patientData.medicalHistory || '',
        });
        
        // Fetch doctors for dropdown
        const doctorsResponse = await fetch('/api/users?role=PHYSIOTHERAPIST');
        if (!doctorsResponse.ok) {
          throw new Error('Failed to fetch doctors');
        }
        const doctorsData = await doctorsResponse.json();
        setDoctors(doctorsData);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load patient data. Please try refreshing the page.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router, patientId, tabParam]);

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

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

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
      const response = await fetch(`/api/patients/${patientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update patient');
      }
      
      setSuccess(true);
      
      // Redirect after 2 seconds
      setTimeout(() => {
        router.push(`/admin/patients/${patientId}`);
      }, 2000);
    } catch (error) {
      console.error('Error updating patient:', error);
      setError(error.message || 'Failed to update patient. Please try again.');
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
    <DashboardLayout title="Edit Patient" menuItems={menuItems} user={user}>
      <Box sx={{ flexGrow: 1 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Patient updated successfully! Redirecting...
          </Alert>
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
          <Button 
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push(`/admin/patients/${patientId}`)}
          >
            Back to Patient
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
            <Tab icon={<PersonIcon />} label="Personal Information" />
            <Tab icon={<MedicalInformationIcon />} label="Medical History" />
          </Tabs>
        </Paper>

        <Card>
          <CardContent>
            {tabValue === 0 && (
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
                    multiline
                    rows={2}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Medical Assignment
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Assigned Doctor</InputLabel>
                    <Select
                      name="assignedDoctorId"
                      value={formData.assignedDoctorId}
                      label="Assigned Doctor"
                      onChange={handleChange}
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
              </Grid>
            )}
            
            {tabValue === 1 && (
              <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="h6" gutterBottom>
                    Medical History
                  </Typography>
                  <TextField
                    fullWidth
                    label="Medical History"
                    name="medicalHistory"
                    value={formData.medicalHistory}
                    onChange={handleChange}
                    margin="normal"
                    multiline
                    rows={10}
                    placeholder="Enter patient's medical history, conditions, allergies, and other relevant medical information..."
                  />
                </Grid>
              </Grid>
            )}
          </CardContent>
        </Card>
      </Box>
    </DashboardLayout>
  );
}