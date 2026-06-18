import { PrismaClient, ResultType, ServiceStatus } from '@prisma/client';

export async function seedServices(prisma: PrismaClient): Promise<number> {
  const services = [
    // PAN Services
    {
      categorySlug: 'pan-services',
      name: 'New PAN Apply',
      slug: 'new-pan-apply',
      shortDescription: 'Apply for a new PAN card.',
      description: 'Apply for a brand new PAN card with dynamic form inputs and document verification.',
      mrp: 129,
      resultType: ResultType.STATUS_ONLY,
      resultLabel: 'Success Status',
      status: ServiceStatus.ACTIVE,
      displayOrder: 1,
    },
    {
      categorySlug: 'pan-services',
      name: 'PAN Correction',
      slug: 'pan-correction',
      shortDescription: 'Correct details on your existing PAN card.',
      description: 'Request corrections in name, date of birth, photo, or other fields on an existing PAN card.',
      mrp: 129,
      resultType: ResultType.STATUS_ONLY,
      resultLabel: 'Success Status',
      status: ServiceStatus.ACTIVE,
      displayOrder: 2,
    },
    {
      categorySlug: 'pan-services',
      name: 'PAN Find',
      slug: 'pan-find',
      shortDescription: 'Find your PAN number.',
      description: 'Retrieve your PAN number details using your Aadhaar number.',
      mrp: 59,
      resultType: ResultType.TEXT_RESULT,
      resultLabel: 'PAN Number',
      status: ServiceStatus.ACTIVE,
      displayOrder: 3,
    },
    {
      categorySlug: 'pan-services',
      name: 'PAN PDF Service',
      slug: 'pan-pdf-service',
      shortDescription: 'Download PAN PDF.',
      description: 'Download the official PDF copy of your PAN Card.',
      mrp: 59,
      resultType: ResultType.FILE_UPLOAD,
      resultLabel: 'PAN PDF',
      status: ServiceStatus.ACTIVE,
      displayOrder: 4,
    },
    // Voter Services
    {
      categorySlug: 'voter-services',
      name: 'Voter PDF',
      slug: 'voter-pdf',
      shortDescription: 'Download Voter ID card PDF.',
      description: 'Retrieve and download the digital PDF of your Voter ID Card.',
      mrp: 49,
      resultType: ResultType.FILE_UPLOAD,
      resultLabel: 'Voter PDF',
      status: ServiceStatus.ACTIVE,
      displayOrder: 1,
    },
    {
      categorySlug: 'voter-services',
      name: 'Voter Mobile Number Link',
      slug: 'voter-mobile-number-link',
      shortDescription: 'Link mobile number to Voter ID.',
      description: 'Apply to link or update your mobile number in the Voter registration record.',
      mrp: 49,
      resultType: ResultType.STATUS_ONLY,
      resultLabel: 'Success Status',
      status: ServiceStatus.ACTIVE,
      displayOrder: 2,
    },
    // Samagra Services
    {
      categorySlug: 'samagra-services',
      name: 'Samagra PDF',
      slug: 'samagra-pdf',
      shortDescription: 'Download Samagra card PDF.',
      description: 'Retrieve and download the official Samagra card/member profile PDF.',
      mrp: 9,
      resultType: ResultType.FILE_UPLOAD,
      resultLabel: 'Samagra PDF',
      status: ServiceStatus.ACTIVE,
      displayOrder: 1,
    },
    {
      categorySlug: 'samagra-services',
      name: 'Member Approval',
      slug: 'member-approval',
      shortDescription: 'Approve new Samagra member.',
      description: 'Request or approve a new member addition in Samagra profile.',
      mrp: 99,
      resultType: ResultType.STATUS_ONLY,
      resultLabel: 'Success Status',
      status: ServiceStatus.ACTIVE,
      displayOrder: 2,
    },
    {
      categorySlug: 'samagra-services',
      name: 'Nihar Se Sasural Transfer',
      slug: 'nihar-se-sasural-transfer',
      shortDescription: 'Transfer Samagra profile post-marriage.',
      description: 'Transfer a female member\'s Samagra ID from maternal family to in-laws family (Nihar se Sasural).',
      mrp: 249,
      resultType: ResultType.STATUS_ONLY,
      resultLabel: 'Success Status',
      status: ServiceStatus.ACTIVE,
      displayOrder: 3,
    },
    {
      categorySlug: 'samagra-services',
      name: 'Family Approval',
      slug: 'family-approval',
      shortDescription: 'Approve family split or updates.',
      description: 'Get approval for splits, updates, or modifications in Samagra family record.',
      mrp: 149,
      resultType: ResultType.STATUS_ONLY,
      resultLabel: 'Success Status',
      status: ServiceStatus.ACTIVE,
      displayOrder: 4,
    },
    // Vahan Services
    {
      categorySlug: 'vahan-services',
      name: 'RC PDF',
      slug: 'rc-pdf',
      shortDescription: 'Download Vehicle Registration Certificate PDF.',
      description: 'Download the digital copy of your Vehicle Registration Certificate (RC) PDF.',
      mrp: 49,
      resultType: ResultType.FILE_UPLOAD,
      resultLabel: 'RC PDF',
      status: ServiceStatus.ACTIVE,
      displayOrder: 1,
    },
    // Driving Licence Services
    {
      categorySlug: 'driving-licence-services',
      name: 'DL PDF',
      slug: 'dl-pdf',
      shortDescription: 'Download Driving Licence PDF.',
      description: 'Download the digital copy of your Driving Licence (DL) PDF.',
      mrp: 49,
      resultType: ResultType.FILE_UPLOAD,
      resultLabel: 'DL PDF',
      status: ServiceStatus.ACTIVE,
      displayOrder: 1,
    },
    // Farmer Services
    {
      categorySlug: 'farmer-services',
      name: 'Farmer PDF',
      slug: 'farmer-pdf',
      shortDescription: 'Download Farmer registration card PDF.',
      description: 'Download the digital PDF copy of your official Farmer Registration details.',
      mrp: 49,
      resultType: ResultType.FILE_UPLOAD,
      resultLabel: 'Farmer PDF',
      status: ServiceStatus.ACTIVE,
      displayOrder: 1,
    },
  ];

  let seededCount = 0;
  for (const s of services) {
    const category = await prisma.serviceCategory.findUnique({
      where: { slug: s.categorySlug },
    });
    if (!category) {
      throw new Error(`Category with slug "${s.categorySlug}" not found during services seeding.`);
    }

    await prisma.service.upsert({
      where: { slug: s.slug },
      update: {
        categoryId: category.id,
        name: s.name,
        shortDescription: s.shortDescription,
        description: s.description,
        mrp: s.mrp,
        resultType: s.resultType,
        resultLabel: s.resultLabel,
        status: s.status,
        displayOrder: s.displayOrder,
      },
      create: {
        categoryId: category.id,
        name: s.name,
        slug: s.slug,
        shortDescription: s.shortDescription,
        description: s.description,
        mrp: s.mrp,
        resultType: s.resultType,
        resultLabel: s.resultLabel,
        status: s.status,
        displayOrder: s.displayOrder,
      },
    });
    seededCount++;
  }
  return seededCount;
}
