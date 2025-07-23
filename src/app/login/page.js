'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState('');

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setStatus('');
    setLoading(true);

    try {
      const user = await login(email, password);

      // Show redirect status
      setStatus(`Login successful! Redirecting to ${user.role.toLowerCase()} dashboard...`);
      
      // Small delay to ensure the user sees the success message
      setTimeout(() => {
        // Redirect based on user role
        switch (user.role) {
          case 'ADMIN':
            router.push('/admin');
            break;
          case 'PHYSIOTHERAPIST':
            router.push('/physiotherapist');
            break;
          case 'RECEPTIONIST':
            router.push('/receptionist');
            break;
          case 'PATIENT':
            router.push('/patient');
            break;
          default:
            router.push('/');
        }
      }, 500);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Paper
        elevation={3}
        sx={{
          marginTop: 8,
          padding: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          borderRadius: 2,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <Box
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
              borderRadius: '50%',
              p: 2,
              mb: 2,
            }}
          >
            <MedicalServicesIcon fontSize="large" />
          </Box>
          <Typography component="h1" variant="h5" fontWeight="bold">
            Clinic Management System
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center">
            Professional Physiotherapy Clinic
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {status && (
          <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
            {status}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={handleTogglePassword}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2, py: 1.5 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Sign In'}
          </Button>
        </Box>

        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary" align="center">
            Demo Accounts:
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" align="center">
            Admin: admin@clinic.local / admin123
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" align="center">
            Receptionist: reception@clinic.local / reception123
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" align="center">
            Physiotherapist: physio1@clinic.local / physio1
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}