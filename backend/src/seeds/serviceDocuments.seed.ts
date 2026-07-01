import { PrismaClient } from '@prisma/client';

export async function seedServiceDocuments(prisma: PrismaClient): Promise<number> {
  const allowedFileTypes = ['PDF', 'JPG', 'JPEG', 'PNG'];

  const documents = [
    // New PAN Apply
    {
      serviceSlug: 'new-pan-apply',
      documentName: 'Passport Size Photo',
      documentKey: 'passportPhoto',
      isRequired: true,
      allowedFileTypes,
      displayOrder: 1,
    },
    {
      serviceSlug: 'new-pan-apply',
      documentName: 'Signature',
      documentKey: 'signature',
      isRequired: true,
      allowedFileTypes,
      displayOrder: 2,
    },
    {
      serviceSlug: 'new-pan-apply',
      documentName: 'Thumb Impression',
      documentKey: 'thumbImpression',
      isRequired: false,
      allowedFileTypes,
      displayOrder: 3,
    },
    {
      serviceSlug: 'new-pan-apply',
      documentName: 'Aadhaar Card Front',
      documentKey: 'aadhaarFront',
      isRequired: true,
      allowedFileTypes,
      displayOrder: 4,
    },
    {
      serviceSlug: 'new-pan-apply',
      documentName: 'Aadhaar Card Back',
      documentKey: 'aadhaarBack',
      isRequired: true,
      allowedFileTypes,
      displayOrder: 5,
    },
    {
      serviceSlug: 'new-pan-apply',
      documentName: 'Birth Proof',
      documentKey: 'birthProof',
      isRequired: true,
      allowedFileTypes,
      displayOrder: 6,
    },
    {
      serviceSlug: 'new-pan-apply',
      documentName: 'Address Proof',
      documentKey: 'addressProof',
      isRequired: true,
      allowedFileTypes,
      displayOrder: 7,
    },
    {
      serviceSlug: 'new-pan-apply',
      documentName: 'Supporting Documents',
      documentKey: 'supportingDocuments',
      isRequired: false,
      allowedFileTypes,
      displayOrder: 8,
    },
    // PAN Correction
    {
      serviceSlug: 'pan-correction',
      documentName: 'Passport Size Photo',
      documentKey: 'passportPhoto',
      isRequired: true,
      allowedFileTypes,
      displayOrder: 1,
    },
    {
      serviceSlug: 'pan-correction',
      documentName: 'Signature',
      documentKey: 'signature',
      isRequired: true,
      allowedFileTypes,
      displayOrder: 2,
    },
    {
      serviceSlug: 'pan-correction',
      documentName: 'Thumb Impression',
      documentKey: 'thumbImpression',
      isRequired: false,
      allowedFileTypes,
      displayOrder: 3,
    },
    {
      serviceSlug: 'pan-correction',
      documentName: 'Aadhaar Card Front',
      documentKey: 'aadhaarFront',
      isRequired: true,
      allowedFileTypes,
      displayOrder: 4,
    },
    {
      serviceSlug: 'pan-correction',
      documentName: 'Aadhaar Card Back',
      documentKey: 'aadhaarBack',
      isRequired: true,
      allowedFileTypes,
      displayOrder: 5,
    },
    {
      serviceSlug: 'pan-correction',
      documentName: 'Existing PAN Card Copy',
      documentKey: 'existingPanCard',
      isRequired: true,
      allowedFileTypes,
      displayOrder: 6,
    },
    {
      serviceSlug: 'pan-correction',
      documentName: 'Birth Proof',
      documentKey: 'birthProof',
      isRequired: true,
      allowedFileTypes,
      displayOrder: 7,
    },
    {
      serviceSlug: 'pan-correction',
      documentName: 'Address Proof',
      documentKey: 'addressProof',
      isRequired: true,
      allowedFileTypes,
      displayOrder: 8,
    },
    {
      serviceSlug: 'pan-correction',
      documentName: 'Supporting Documents',
      documentKey: 'supportingDocuments',
      isRequired: false,
      allowedFileTypes,
      displayOrder: 9,
    },
  ];

  console.log('🧹 Cleaning up old service document configurations...');
  const activeDocsSet = new Set<string>();
  const serviceSlugToIdMap = new Map<string, string>();
  for (const doc of documents) {
    let serviceId = serviceSlugToIdMap.get(doc.serviceSlug);
    if (!serviceId) {
      const service = await prisma.service.findUnique({
        where: { slug: doc.serviceSlug },
      });
      if (service) {
        serviceId = service.id;
        serviceSlugToIdMap.set(doc.serviceSlug, service.id);
      }
    }
    if (serviceId) {
      activeDocsSet.add(`${serviceId}:${doc.documentKey}`);
    }
  }

  const existingDocs = await prisma.serviceDocumentRequirement.findMany();
  for (const doc of existingDocs) {
    const key = `${doc.serviceId}:${doc.documentKey}`;
    if (!activeDocsSet.has(key)) {
      await prisma.serviceDocumentRequirement.delete({
        where: { id: doc.id },
      });
    }
  }

  let seededCount = 0;
  for (const doc of documents) {
    const service = await prisma.service.findUnique({
      where: { slug: doc.serviceSlug },
    });
    if (!service) {
      throw new Error(`Service with slug "${doc.serviceSlug}" not found during documents seeding.`);
    }

    await prisma.serviceDocumentRequirement.upsert({
      where: {
        serviceId_documentKey: {
          serviceId: service.id,
          documentKey: doc.documentKey,
        },
      },
      update: {
        documentName: doc.documentName,
        isRequired: doc.isRequired,
        allowedFileTypes: doc.allowedFileTypes,
        displayOrder: doc.displayOrder,
      },
      create: {
        serviceId: service.id,
        documentKey: doc.documentKey,
        documentName: doc.documentName,
        isRequired: doc.isRequired,
        allowedFileTypes: doc.allowedFileTypes,
        displayOrder: doc.displayOrder,
      },
    });
    seededCount++;
  }
  return seededCount;
}
