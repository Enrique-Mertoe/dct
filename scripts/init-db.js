const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Ensure the prisma directory exists
const prismaDir = path.join(__dirname, '..', 'prisma');
if (!fs.existsSync(prismaDir)) {
  console.error('Prisma directory not found');
  process.exit(1);
}

try {
  console.log('=== DATABASE INITIALIZATION START ===');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('DATABASE_URL:', process.env.DATABASE_URL);
  console.log('Current working directory:', process.cwd());
  
  // Run Prisma migrations
  console.log('Running Prisma migrations...');
  // Use migrate deploy for production, migrate dev for development
  const isProduction = process.env.NODE_ENV === 'production';
  const migrateCommand = 'npx prisma migrate deploy';
  console.log('Migration command:', migrateCommand);
  execSync(migrateCommand, { stdio: 'inherit' });
  console.log('✓ Migrations completed');
  
  // Seed the database
  console.log('Seeding the database...');
  console.log('Seed command: npm run seed');
  execSync('npm run seed', { stdio: 'inherit' });
  console.log('✓ Seeding completed');
  
  console.log('=== DATABASE INITIALIZATION COMPLETED SUCCESSFULLY ===');
} catch (error) {
  console.error('Error initializing database:', error);
  process.exit(1);
}