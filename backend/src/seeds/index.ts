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

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Seed default Admin user for backward compatibility
  await seedAdmin();

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
