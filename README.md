# Clinic Management System

A professional clinic management system built with Next.js, MUI, and SQLite. This system allows multiple users on a local network to manage patient records, appointments, and treatments while maintaining data on-premises for healthcare compliance.

## Features

- **Role-based access control**: Admin, Physiotherapist, Receptionist, and Patient roles
- **Patient management**: Registration, medical history, and assignment to doctors
- **Appointment scheduling**: Time slot management with capacity controls
- **Treatment records**: Documentation of physiotherapy sessions and progress
- **Responsive UI**: Professional interface built with Material UI
- **Local data storage**: SQLite database for on-premises data management
- **Audit logging**: Track all system activities for compliance

## Tech Stack

- **Frontend**: Next.js, Material UI, React
- **Backend**: Next.js API Routes
- **Database**: SQLite with Prisma ORM
- **Authentication**: JWT-based authentication
- **Styling**: Material UI components

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/clinic-management-system.git
   cd clinic-management-system
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit the `.env` file with your configuration.

4. Set up the database:
   ```bash
   npm run init-db
   ```
   This will create the database schema and seed it with default data.

5. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Default Login Credentials

- **Admin**: admin@clinic.local / admin123
- **Receptionist**: reception@clinic.local / reception123
- **Physiotherapist**: physio1@clinic.local / physio1

## Deployment

For production deployment, build the application:

```bash
npm run build
npm start
# or
yarn build
yarn start
```

## Network Access

To allow other computers on the local network to access the system:

1. Make sure the server is running on `0.0.0.0` (configured in `.env`)
2. Other computers can access the system using the server's IP address: `http://192.168.1.100:3000` (replace with your actual IP)

## System Architecture

The system consists of three main layers:

1. **Web Application Server (Next.js)**
   - Business logic and patient management
   - Database operations
   - REST API endpoints
   - Web-based user interfaces

2. **Local Database (SQLite)**
   - Patient records and appointments
   - User authentication data
   - System configuration storage

3. **Role-Based Access Control**
   - Admin: Full system access
   - Physiotherapist: Patient treatment and records
   - Receptionist: Appointment booking and patient registration
   - Patient: View own appointments and treatments

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Next.js team for the amazing framework
- Material UI for the component library
- Prisma team for the ORM