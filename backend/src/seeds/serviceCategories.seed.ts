import { PrismaClient, CategoryStatus } from '@prisma/client';

export async function seedServiceCategories(prisma: PrismaClient): Promise<number> {
  const categories = [
    {
      name: 'PAN Services',
      slug: 'pan-services',
      description: 'PAN related digital services.',
      status: CategoryStatus.ACTIVE,
      displayOrder: 1,
    },
    {
      name: 'Voter Services',
      slug: 'voter-services',
      description: 'Voter ID card related services.',
      status: CategoryStatus.ACTIVE,
      displayOrder: 2,
    },
    {
      name: 'Samagra Services',
      slug: 'samagra-services',
      description: 'Samagra ID portal services.',
      status: CategoryStatus.ACTIVE,
      displayOrder: 3,
    },
    {
      name: 'Vahan Services',
      slug: 'vahan-services',
      description: 'Vehicle information and portal services.',
      status: CategoryStatus.ACTIVE,
      displayOrder: 4,
    },
    {
      name: 'Driving Licence Services',
      slug: 'driving-licence-services',
      description: 'Driving Licence information and portal services.',
      status: CategoryStatus.ACTIVE,
      displayOrder: 5,
    },
    {
      name: 'Farmer Services',
      slug: 'farmer-services',
      description: 'Agricultural and farmer portal services.',
      status: CategoryStatus.ACTIVE,
      displayOrder: 6,
    },
  ];

  let seededCount = 0;
  for (const cat of categories) {
    await prisma.serviceCategory.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        description: cat.description,
        status: cat.status,
        displayOrder: cat.displayOrder,
      },
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        status: cat.status,
        displayOrder: cat.displayOrder,
      },
    });
    seededCount++;
  }
  return seededCount;
}
