import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { env } from '../config/env';
import { seedServiceCategories } from './serviceCategories.seed';
import { seedServices } from './services.seed';
import { seedServiceFields } from './serviceFields.seed';
import { seedServiceDocuments } from './serviceDocuments.seed';

const prisma = new PrismaClient();

async function seedAdmin() {
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
}

async function seedTestUser() {
  const testEmail = 'mdmainuddin1289@gmail.com';
  const testMobile = '9000000001';
  const testPassword = 'Moinkhan@123';

  // Check if test user already exists by email or mobile
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email: testEmail },
        { mobile: testMobile }
      ]
    }
  });

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(testPassword, saltRounds);

  let userId: string;

  if (!existingUser) {
    console.log('🚧 Seeding default test User account...');
    const user = await prisma.user.create({
      data: {
        name: 'Moin Khan',
        email: testEmail,
        mobile: testMobile,
        passwordHash,
        role: 'USER',
        status: 'ACTIVE',
        userType: 'RETAILER',
        shopName: 'Mitra Shop',
        aadhaarNumber: '123456789012',
        panNumber: 'ABCDE1234F',
        address: '123 Test Street',
        state: 'West Bengal',
        district: 'Kolkata',
        pinCode: '700001'
      }
    });
    userId = user.id;
    console.log(`✅ Default test user created: ${user.email}`);
  } else {
    userId = existingUser.id;
    // Update password hash, status, role just in case to ensure they are active
    await prisma.user.update({
      where: { id: userId },
      data: {
        status: 'ACTIVE',
        role: 'USER',
        passwordHash
      }
    });
    console.log(`ℹ️ Test user (${testEmail}) already exists. Reset password and activated.`);
  }

  // Ensure Wallet exists and has a balance of 1000.00 (100000 paise) for testing
  const wallet = await prisma.wallet.findUnique({
    where: { userId }
  });

  if (!wallet) {
    await prisma.wallet.create({
      data: {
        userId,
        balancePaise: 100000
      }
    });
    console.log(`✅ Wallet created with ₹1000.00 balance (100000 paise) for user: ${testEmail}`);
  } else {
    await prisma.wallet.update({
      where: { userId },
      data: {
        balancePaise: 100000
      }
    });
    console.log(`✅ Wallet balance reset to ₹1000.00 (100000 paise) for user: ${testEmail}`);
  }
}

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Seed default Admin user for backward compatibility
  await seedAdmin();

  // 1b. Seed default test User (Retailer)
  await seedTestUser();

  // 2. Seed Categories
  const categoriesCount = await seedServiceCategories(prisma);

  // 3. Seed Services
  const servicesCount = await seedServices(prisma);

  // 4. Seed Fields
  const fieldsCount = await seedServiceFields(prisma);

  // 5. Seed Documents
  const documentsCount = await seedServiceDocuments(prisma);

  console.log(`✓ Categories Seeded: ${categoriesCount}`);
  console.log(`✓ Services Seeded: ${servicesCount}`);
  console.log(`✓ Fields Seeded: ${fieldsCount}`);
  console.log(`✓ Documents Seeded: ${documentsCount}`);
  console.log('✓ Seed Completed Successfully');
}

main()
  .catch((e) => {
    console.error('❌ Error during database seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
