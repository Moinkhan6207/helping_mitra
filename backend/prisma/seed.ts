import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { env } from '../src/config/env';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  const adminName = env.ADMIN_NAME;
  const adminEmail = env.ADMIN_EMAIL;
  const adminMobile = env.ADMIN_MOBILE;
  const adminPassword = env.ADMIN_PASSWORD;

  // Check if admin already exists by email or mobile
  const existingAdmin = await prisma.user.findFirst({
    where: {
      OR: [
        { email: adminEmail },
        { mobile: adminMobile }
      ]
    }
  });

  if (!existingAdmin) {
    console.log('🚧 Seeding default Admin account...');
    
    // Hash password with secure rounds (10)
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(adminPassword, saltRounds);
    
    const admin = await prisma.user.create({
      data: {
        name: adminName,
        email: adminEmail,
        mobile: adminMobile,
        passwordHash,
        role: 'ADMIN',
        status: 'ACTIVE',
        userType: null, // Admin has no userType associated
        shopName: null,
        aadhaarNumber: null,
        panNumber: null,
        address: null,
        state: null,
        district: null,
        pinCode: null
      }
    });

    console.log(`✅ Default Admin user created: ${admin.email}`);
  } else {
    console.log(`ℹ️ Admin user (${adminEmail} / ${adminMobile}) already exists. Skipping creation.`);
  }

  console.log('✅ Seeding execution finished successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Error during database seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    // Ensure clean connection termination
    await prisma.$disconnect();
  });
