import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for handling errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || error.message || 'An error occurred';
    return Promise.reject(new Error(message));
  }
);

// Auth services
export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
};

// User services
export const userService = {
  getUsers: () => api.get('/users'),
  getUser: (id) => api.get(`/users/${id}`),
  createUser: (userData) => api.post('/users', userData),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/users/${id}`),
};

// Patient services
export const patientService = {
  getPatients: () => api.get('/patients'),
  getPatient: (id) => api.get(`/patients/${id}`),
  createPatient: (patientData) => api.post('/patients', patientData),
  updatePatient: (id, patientData) => api.put(`/patients/${id}`, patientData),
  deletePatient: (id) => api.delete(`/patients/${id}`),
};

// Appointment services
export const appointmentService = {
  getAppointments: (params) => api.get('/appointments', { params }),
  getAppointment: (id) => api.get(`/appointments/${id}`),
  createAppointment: (appointmentData) => api.post('/appointments', appointmentData),
  updateAppointment: (id, appointmentData) => api.put(`/appointments/${id}`, appointmentData),
  deleteAppointment: (id) => api.delete(`/appointments/${id}`),
};

// Treatment services
export const treatmentService = {
  getTreatments: (params) => api.get('/treatments', { params }),
  getTreatment: (id) => api.get(`/treatments/${id}`),
  createTreatment: (treatmentData) => api.post('/treatments', treatmentData),
  updateTreatment: (id, treatmentData) => api.put(`/treatments/${id}`, treatmentData),
  deleteTreatment: (id) => api.delete(`/treatments/${id}`),
};

// TimeSlot services
export const timeSlotService = {
  getTimeSlots: (params) => api.get('/timeslots', { params }),
  createOrUpdateTimeSlots: (timeSlotsData) => api.post('/timeslots', { timeSlots: timeSlotsData }),
};

export default api;