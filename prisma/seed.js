const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');

const prisma = new PrismaClient();

async function hashPassword(password) {
  return await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 2**16,
    timeCost: 3,
    parallelism: 1,
  });
}

async function main() {
  console.log('Seeding database...');
  
  // Create default users
  const adminPassword = await hashPassword('admin123');
  const receptionPassword = await hashPassword('reception123');
  const physioPassword = await hashPassword('physio1');
  
  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@clinic.local' },
    update: {},
    create: {
      email: 'admin@clinic.local',
      name: 'Admin User',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  const admin2 = await prisma.user.upsert({
    where: { email: 'abutimartin778@gmail.com' },
    update: {},
    create: {
      email: 'abutimartin778@gmail.com',
      name: 'Admin User',
      password: "6s3sNmKUHcajk4X",
      role: 'ADMIN',
    },
  });
  console.log('Created admin user:', admin.email);
  
  // Create receptionist user
  const receptionist = await prisma.user.upsert({
    where: { email: 'reception@clinic.local' },
    update: {},
    create: {
      email: 'reception@clinic.local',
      name: 'Emma Wilson',
      password: receptionPassword,
      role: 'RECEPTIONIST',
    },
  });
  console.log('Created receptionist user:', receptionist.email);
  
  // Create physiotherapist users
  const physio1 = await prisma.user.upsert({
    where: { email: 'physio1@clinic.local' },
    update: {},
    create: {
      email: 'physio1@clinic.local',
      name: 'Dr. Sarah Johnson',
      password: physioPassword,
      role: 'PHYSIOTHERAPIST',
    },
  });
  console.log('Created physiotherapist user:', physio1.email);
  
  // Create time slots
  const timeSlots = [
    { startTime: '09:00', endTime: '10:30', capacity: 5, dayOfWeek: 1 }, // Monday
    { startTime: '10:30', endTime: '12:00', capacity: 5, dayOfWeek: 1 },
    { startTime: '12:00', endTime: '13:30', capacity: 5, dayOfWeek: 1 },
    { startTime: '14:00', endTime: '15:30', capacity: 5, dayOfWeek: 1 },
    { startTime: '15:30', endTime: '17:00', capacity: 5, dayOfWeek: 1 },
    
    { startTime: '09:00', endTime: '10:30', capacity: 5, dayOfWeek: 2 }, // Tuesday
    { startTime: '10:30', endTime: '12:00', capacity: 5, dayOfWeek: 2 },
    { startTime: '12:00', endTime: '13:30', capacity: 5, dayOfWeek: 2 },
    { startTime: '14:00', endTime: '15:30', capacity: 5, dayOfWeek: 2 },
    { startTime: '15:30', endTime: '17:00', capacity: 5, dayOfWeek: 2 },
    
    { startTime: '09:00', endTime: '10:30', capacity: 5, dayOfWeek: 3 }, // Wednesday
    { startTime: '10:30', endTime: '12:00', capacity: 5, dayOfWeek: 3 },
    { startTime: '12:00', endTime: '13:30', capacity: 5, dayOfWeek: 3 },
    { startTime: '14:00', endTime: '15:30', capacity: 5, dayOfWeek: 3 },
    { startTime: '15:30', endTime: '17:00', capacity: 5, dayOfWeek: 3 },
    
    { startTime: '09:00', endTime: '10:30', capacity: 5, dayOfWeek: 4 }, // Thursday
    { startTime: '10:30', endTime: '12:00', capacity: 5, dayOfWeek: 4 },
    { startTime: '12:00', endTime: '13:30', capacity: 5, dayOfWeek: 4 },
    { startTime: '14:00', endTime: '15:30', capacity: 5, dayOfWeek: 4 },
    { startTime: '15:30', endTime: '17:00', capacity: 5, dayOfWeek: 4 },
    
    { startTime: '09:00', endTime: '10:30', capacity: 5, dayOfWeek: 5 }, // Friday
    { startTime: '10:30', endTime: '12:00', capacity: 5, dayOfWeek: 5 },
    { startTime: '12:00', endTime: '13:30', capacity: 5, dayOfWeek: 5 },
    { startTime: '14:00', endTime: '15:30', capacity: 5, dayOfWeek: 5 },
    { startTime: '15:30', endTime: '17:00', capacity: 5, dayOfWeek: 5 },
    
    { startTime: '09:00', endTime: '10:30', capacity: 3, dayOfWeek: 6 }, // Saturday
    { startTime: '10:30', endTime: '12:00', capacity: 3, dayOfWeek: 6 },
    { startTime: '12:00', endTime: '13:30', capacity: 3, dayOfWeek: 6 },
  ];
  
  // Create time slots
  for (const slot of timeSlots) {
    await prisma.timeSlot.upsert({
      where: {
        id: `${slot.dayOfWeek}-${slot.startTime}-${slot.endTime}`,
      },
      update: {},
      create: {
        id: `${slot.dayOfWeek}-${slot.startTime}-${slot.endTime}`,
        startTime: slot.startTime,
        endTime: slot.endTime,
        capacity: slot.capacity,
        dayOfWeek: slot.dayOfWeek,
        isActive: true,
      },
    });
  }
  console.log(`Created ${timeSlots.length} time slots`);
  
  // Create default configuration
  const defaultConfig = [
    { key: 'clinicName', value: 'Professional Physiotherapy Clinic' },
    { key: 'clinicEmail', value: 'contact@clinic.local' },
    { key: 'clinicPhone', value: '555-123-4567' },
    { key: 'clinicAddress', value: '123 Health Street, Medical District, City' },
    { key: 'appointmentDuration', value: '60' },
    { key: 'workingHoursStart', value: '09:00' },
    { key: 'workingHoursEnd', value: '17:00' },
    { key: 'workingDays', value: JSON.stringify([1, 2, 3, 4, 5, 6]) },
    { key: 'enableSmsNotifications', value: 'true' },
    { key: 'enableEmailNotifications', value: 'true' },
    { key: 'allowPatientRegistration', value: 'true' },
    { key: 'allowPatientAppointmentBooking', value: 'true' },
  ];
  
  // Create configuration
  for (const config of defaultConfig) {
    await prisma.configuration.upsert({
      where: { key: config.key },
      update: {},
      create: {
        key: config.key,
        value: config.value,
        description: `Default setting for ${config.key}`,
      },
    });
  }
  console.log(`Created ${defaultConfig.length} configuration settings`);
  
  console.log('Database seeding completed');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });