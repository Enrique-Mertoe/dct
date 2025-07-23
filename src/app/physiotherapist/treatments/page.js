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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputAdornment,
  Alert,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import MedicalInformationIcon from '@mui/icons-material/MedicalInformation';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function TreatmentsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [treatments, setTreatments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [patientFilter, setPatientFilter] = useState('');
  const [patients, setPatients] = useState([]);

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
        
        // Get treatments list from API
        const treatmentsResponse = await fetch('/api/treatments', {
          credentials: 'include'
        });
        if (!treatmentsResponse.ok) {
          throw new Error('Failed to fetch treatments');
        }
        const treatmentsData = await treatmentsResponse.json();
        setTreatments(treatmentsData);
        
        // Extract unique patients for filter
        const uniquePatients = Array.from(
          new Set(treatmentsData.map(treatment => treatment.patient.id))
        ).map(patientId => {
          const treatment = treatmentsData.find(t => t.patient.id === patientId);
          return {
            id: patientId,
            name: `${treatment.patient.firstName} ${treatment.patient.lastName}`
          };
        });
        setPatients(uniquePatients);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load treatments. Please try refreshing the page.');
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

  const filteredTreatments = treatments.filter(treatment => {
    // Filter by patient if selected
    if (patientFilter && treatment.patient.id !== patientFilter) {
      return false;
    }
    
    // Filter by search term
    const patientName = `${treatment.patient.firstName} ${treatment.patient.lastName}`.toLowerCase();
    const notes = treatment.notes ? treatment.notes.toLowerCase() : '';
    
    return patientName.includes(searchTerm.toLowerCase()) || 
           notes.includes(searchTerm.toLowerCase());
  });

  if (loading && !user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <DashboardLayout title="Treatments" menuItems={menuItems} user={user}>
      <Box sx={{ flexGrow: 1 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h5" component="h1">
            Treatment Records
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => router.push('/physiotherapist/treatments/new')}
          >
            Record New Treatment
          </Button>
        </Box>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, md: 8 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search treatments by patient name or notes"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }} >
            <FormControl fullWidth>
              <InputLabel>Filter by Patient</InputLabel>
              <Select
                value={patientFilter}
                label="Filter by Patient"
                onChange={(e) => setPatientFilter(e.target.value)}
              >
                <MenuItem value="">
                  <em>All Patients</em>
                </MenuItem>
                {patients.map((patient) => (
                  <MenuItem key={patient.id} value={patient.id}>
                    {patient.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Patient</TableCell>
                <TableCell>Treatment Notes</TableCell>
                <TableCell>Home Program</TableCell>
                <TableCell>Progress</TableCell>
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
              ) : filteredTreatments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No treatments found
                  </TableCell>
                </TableRow>
              ) : (
                filteredTreatments.map((treatment) => (
                  <TableRow key={treatment.id}>
                    <TableCell>{new Date(treatment.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {`${treatment.patient.firstName} ${treatment.patient.lastName}`}
                    </TableCell>
                    <TableCell>
                      {treatment.notes ? (
                        treatment.notes.length > 50 ? 
                          `${treatment.notes.substring(0, 50)}...` : 
                          treatment.notes
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {treatment.homeProgram ? (
                        <Chip 
                          size="small" 
                          label="Provided" 
                          color="success" 
                        />
                      ) : (
                        <Chip 
                          size="small" 
                          label="None" 
                          variant="outlined" 
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {treatment.progress ? (
                        <Chip 
                          size="small" 
                          label="Recorded" 
                          color="primary" 
                        />
                      ) : (
                        <Chip 
                          size="small" 
                          label="None" 
                          variant="outlined" 
                        />
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Button 
                        size="small" 
                        variant="outlined"
                        startIcon={<VisibilityIcon fontSize="small" />}
                        onClick={() => router.push(`/physiotherapist/treatments/${treatment.id}`)}
                      >
                        View
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
}