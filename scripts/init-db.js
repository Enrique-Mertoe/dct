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
  // Run Prisma migrations
  console.log('Running Prisma migrations...');
  // Use migrate deploy for production, migrate dev for development
  const isProduction = process.env.NODE_ENV === 'production';
  const migrateCommand = isProduction 
    ? 'npx prisma migrate deploy' 
    : 'npx prisma migrate dev --name init';
  execSync(migrateCommand, { stdio: 'inherit' });
  
  // Seed the database
  console.log('Seeding the database...');
  execSync('npm run seed', { stdio: 'inherit' });
  
  console.log('Database initialization completed successfully');
} catch (error) {
  console.error('Error initializing database:', error);
  process.exit(1);
}