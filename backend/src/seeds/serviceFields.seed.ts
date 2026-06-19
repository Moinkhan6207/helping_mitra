import { PrismaClient, ServiceFieldType } from '@prisma/client';

// ─── Indian States ────────────────────────────────────────────────────────────
const INDIAN_STATES_OPTIONS = [
  "Madhya Pradesh",
  "Uttar Pradesh",
  "Bihar",
  "Rajasthan",
  "Jharkhand"
];

// ─── PAN Category ─────────────────────────────────────────────────────────────
const PAN_TITLE_OPTIONS = ["Shri (Mr.)", "Smt. (Mrs.)", "Kumari (Miss)"];
const PAN_GENDER_OPTIONS = ["Male", "Female", "Transgender"];

export async function seedServiceFields(prisma: PrismaClient): Promise<number> {
  const fields = [
    // ──────────────────────────────────────────────────────────────────────────
    // 1. New PAN Apply
    // ──────────────────────────────────────────────────────────────────────────
    {
      serviceSlug: 'new-pan-apply',
      label: 'Title',
      fieldKey: 'title',
      fieldType: ServiceFieldType.SELECT,
      placeholder: 'Select Title',
      isRequired: true,
      sectionName: 'Applicant Details',
      validationRules: { options: PAN_TITLE_OPTIONS },
      displayOrder: 1,
    },
    {
      serviceSlug: 'new-pan-apply',
      label: 'Applicant Name',
      fieldKey: 'applicantName',
      fieldType: ServiceFieldType.TEXT,
      placeholder: 'Enter applicant full name (as in Aadhaar)',
      isRequired: true,
      sectionName: 'Applicant Details',
      validationRules: { minLength: 3, maxLength: 100 },
      displayOrder: 2,
    },
    {
      serviceSlug: 'new-pan-apply',
      label: 'Father Name',
      fieldKey: 'fatherName',
      fieldType: ServiceFieldType.TEXT,
      placeholder: 'Enter father name',
      isRequired: true,
      sectionName: 'Applicant Details',
      validationRules: { minLength: 3, maxLength: 100 },
      displayOrder: 3,
    },
    {
      serviceSlug: 'new-pan-apply',
      label: 'Mother Name',
      fieldKey: 'motherName',
      fieldType: ServiceFieldType.TEXT,
      placeholder: 'Enter mother name',
      isRequired: true,
      sectionName: 'Applicant Details',
      validationRules: { minLength: 3, maxLength: 100 },
      displayOrder: 4,
    },
    {
      serviceSlug: 'new-pan-apply',
      label: 'Gender',
      fieldKey: 'gender',
      fieldType: ServiceFieldType.SELECT,
      placeholder: 'Select Gender',
      isRequired: true,
      sectionName: 'Applicant Details',
      validationRules: { options: PAN_GENDER_OPTIONS },
      displayOrder: 5,
    },
    {
      serviceSlug: 'new-pan-apply',
      label: 'Date Of Birth',
      fieldKey: 'dob',
      fieldType: ServiceFieldType.DATE,
      placeholder: 'Select Date of Birth',
      isRequired: true,
      sectionName: 'Applicant Details',
      validationRules: null,
      displayOrder: 6,
    },
    {
      serviceSlug: 'new-pan-apply',
      label: 'Mobile Number',
      fieldKey: 'mobileNumber',
      fieldType: ServiceFieldType.MOBILE,
      placeholder: 'Enter 10-digit mobile number',
      isRequired: true,
      sectionName: 'Contact Details',
      validationRules: { pattern: '^[0-9]{10}$' },
      displayOrder: 7,
    },
    {
      serviceSlug: 'new-pan-apply',
      label: 'Email ID',
      fieldKey: 'emailId',
      fieldType: ServiceFieldType.EMAIL,
      placeholder: 'Enter email ID',
      isRequired: true,
      sectionName: 'Contact Details',
      validationRules: null,
      displayOrder: 8,
    },
    {
      serviceSlug: 'new-pan-apply',
      label: 'Aadhaar Number',
      fieldKey: 'aadhaarNumber',
      fieldType: ServiceFieldType.TEXT,
      placeholder: 'Enter 12-digit Aadhaar Number',
      isRequired: true,
      sectionName: 'Identity Details',
      validationRules: { minLength: 12, maxLength: 12, pattern: '^[0-9]{12}$' },
      displayOrder: 9,
    },
    {
      serviceSlug: 'new-pan-apply',
      label: 'Full Address',
      fieldKey: 'fullAddress',
      fieldType: ServiceFieldType.TEXTAREA,
      placeholder: 'Enter complete residential address',
      isRequired: true,
      sectionName: 'Address Details',
      validationRules: null,
      displayOrder: 10,
    },

    // ──────────────────────────────────────────────────────────────────────────
    // 2. PAN Correction
    // ──────────────────────────────────────────────────────────────────────────
    {
      serviceSlug: 'pan-correction',
      label: 'Applicant Name',
      fieldKey: 'applicantName',
      fieldType: ServiceFieldType.TEXT,
      placeholder: 'Enter applicant name',
      isRequired: true,
      sectionName: 'Applicant Details',
      validationRules: { minLength: 3, maxLength: 100 },
      displayOrder: 1,
    },
    {
      serviceSlug: 'pan-correction',
      label: 'Father Name',
      fieldKey: 'fatherName',
      fieldType: ServiceFieldType.TEXT,
      placeholder: 'Enter father name',
      isRequired: true,
      sectionName: 'Applicant Details',
      validationRules: { minLength: 3, maxLength: 100 },
      displayOrder: 2,
    },
    {
      serviceSlug: 'pan-correction',
      label: 'Mother Name',
      fieldKey: 'motherName',
      fieldType: ServiceFieldType.TEXT,
      placeholder: 'Enter mother name',
      isRequired: true,
      sectionName: 'Applicant Details',
      validationRules: { minLength: 3, maxLength: 100 },
      displayOrder: 3,
    },
    {
      serviceSlug: 'pan-correction',
      label: 'Date Of Birth',
      fieldKey: 'dob',
      fieldType: ServiceFieldType.DATE,
      placeholder: 'Select Date of Birth',
      isRequired: true,
      sectionName: 'Applicant Details',
      validationRules: null,
      displayOrder: 4,
    },
    {
      serviceSlug: 'pan-correction',
      label: 'Mobile Number',
      fieldKey: 'mobileNumber',
      fieldType: ServiceFieldType.MOBILE,
      placeholder: 'Enter 10-digit mobile number',
      isRequired: true,
      sectionName: 'Contact Details',
      validationRules: { pattern: '^[0-9]{10}$' },
      displayOrder: 5,
    },
    {
      serviceSlug: 'pan-correction',
      label: 'Email ID',
      fieldKey: 'emailId',
      fieldType: ServiceFieldType.EMAIL,
      placeholder: 'Enter email ID',
      isRequired: true,
      sectionName: 'Contact Details',
      validationRules: null,
      displayOrder: 6,
    },
    {
      serviceSlug: 'pan-correction',
      label: 'Aadhaar Number',
      fieldKey: 'aadhaarNumber',
      fieldType: ServiceFieldType.TEXT,
      placeholder: 'Enter 12-digit Aadhaar Number',
      isRequired: true,
      sectionName: 'Identity Details',
      validationRules: { minLength: 12, maxLength: 12, pattern: '^[0-9]{12}$' },
      displayOrder: 7,
    },
    {
      serviceSlug: 'pan-correction',
      label: 'PAN Number',
      fieldKey: 'panNumber',
      fieldType: ServiceFieldType.TEXT,
      placeholder: 'Enter 10-character PAN Number',
      isRequired: true,
      sectionName: 'Identity Details',
      validationRules: { minLength: 10, maxLength: 10, pattern: '^[A-Z]{5}[0-9]{4}[A-Z]{1}$' },
      displayOrder: 8,
    },
    {
      serviceSlug: 'pan-correction',
      label: 'Full Address',
      fieldKey: 'fullAddress',
      fieldType: ServiceFieldType.TEXTAREA,
      placeholder: 'Enter complete residential address',
      isRequired: true,
      sectionName: 'Address Details',
      validationRules: null,
      displayOrder: 9,
    },

    // ──────────────────────────────────────────────────────────────────────────
    // 3. PAN Find
    // ──────────────────────────────────────────────────────────────────────────
    {
      serviceSlug: 'pan-find',
      label: 'Aadhaar Number',
      fieldKey: 'aadhaarNumber',
      fieldType: ServiceFieldType.TEXT,
      placeholder: 'Enter 12-digit Aadhaar Number',
      isRequired: true,
      sectionName: 'Identity Details',
      validationRules: { minLength: 12, maxLength: 12, pattern: '^[0-9]{12}$' },
      displayOrder: 1,
    },

    // ──────────────────────────────────────────────────────────────────────────
    // 4. PAN PDF Service
    // ──────────────────────────────────────────────────────────────────────────
    {
      serviceSlug: 'pan-pdf-service',
      label: 'Aadhaar Number',
      fieldKey: 'aadhaarNumber',
      fieldType: ServiceFieldType.TEXT,
      placeholder: 'Enter 12-digit Aadhaar Number',
      isRequired: true,
      sectionName: 'Identity Details',
      validationRules: { minLength: 12, maxLength: 12, pattern: '^[0-9]{12}$' },
      displayOrder: 1,
    },
    {
      serviceSlug: 'pan-pdf-service',
      label: 'PAN Number',
      fieldKey: 'panNumber',
      fieldType: ServiceFieldType.TEXT,
      placeholder: 'Enter 10-character PAN Number',
      isRequired: true,
      sectionName: 'Identity Details',
      validationRules: { minLength: 10, maxLength: 10, pattern: '^[A-Z]{5}[0-9]{4}[A-Z]{1}$' },
      displayOrder: 2,
    },
    {
      serviceSlug: 'pan-pdf-service',
      label: 'Date Of Birth',
      fieldKey: 'dob',
      fieldType: ServiceFieldType.DATE,
      placeholder: 'Select Date of Birth',
      isRequired: true,
      sectionName: 'Identity Details',
      validationRules: null,
      displayOrder: 3,
    },
    {
      serviceSlug: 'pan-pdf-service',
      label: 'Aadhaar OTP Call Number',
      fieldKey: 'aadhaarOtpCallNumber',
      fieldType: ServiceFieldType.MOBILE,
      placeholder: 'Enter mobile number for Aadhaar OTP',
      isRequired: true,
      sectionName: 'Identity Details',
      validationRules: { pattern: '^[0-9]{10}$' },
      displayOrder: 4,
    },

    // ──────────────────────────────────────────────────────────────────────────
    // 5. Voter PDF
    // ──────────────────────────────────────────────────────────────────────────
    {
      serviceSlug: 'voter-pdf',
      label: 'EPIC Number',
      fieldKey: 'epicNumber',
      fieldType: ServiceFieldType.TEXT,
      placeholder: 'Enter EPIC (Voter Card) Number',
      isRequired: true,
      sectionName: 'Identity Details',
      validationRules: { pattern: '^[A-Z]{3}[0-9]{7}$' },
      displayOrder: 1,
    },
    {
      serviceSlug: 'voter-pdf',
      label: 'State Name',
      fieldKey: 'stateName',
      fieldType: ServiceFieldType.SELECT,
      placeholder: 'Select State',
      isRequired: true,
      sectionName: 'Application Details',
      validationRules: { options: INDIAN_STATES_OPTIONS },
      displayOrder: 2,
    },

    // ──────────────────────────────────────────────────────────────────────────
    // 6. Voter Mobile Number Link
    // ──────────────────────────────────────────────────────────────────────────
    {
      serviceSlug: 'voter-mobile-number-link',
      label: 'EPIC Number',
      fieldKey: 'epicNumber',
      fieldType: ServiceFieldType.TEXT,
      placeholder: 'Enter EPIC Number',
      isRequired: true,
      sectionName: 'Identity Details',
      validationRules: { pattern: '^[A-Z]{3}[0-9]{7}$' },
      displayOrder: 1,
    },
    {
      serviceSlug: 'voter-mobile-number-link',
      label: 'Mobile Number',
      fieldKey: 'mobileNumber',
      fieldType: ServiceFieldType.MOBILE,
      placeholder: 'Enter 10-digit Mobile Number',
      isRequired: true,
      sectionName: 'Contact Details',
      validationRules: { pattern: '^[0-9]{10}$' },
      displayOrder: 2,
    },

    // ──────────────────────────────────────────────────────────────────────────
    // 7. Samagra PDF
    // ──────────────────────────────────────────────────────────────────────────
    {
      serviceSlug: 'samagra-pdf',
      label: 'Member ID / Family ID',
      fieldKey: 'memberOrFamilyId',
      fieldType: ServiceFieldType.TEXT,
      placeholder: 'Enter Member ID or Family ID',
      isRequired: true,
      sectionName: 'Identity Details',
      validationRules: null,
      displayOrder: 1,
    },

    // ──────────────────────────────────────────────────────────────────────────
    // 8. Member Approval
    // ──────────────────────────────────────────────────────────────────────────
    {
      serviceSlug: 'member-approval',
      label: 'Request ID',
      fieldKey: 'requestId',
      fieldType: ServiceFieldType.TEXT,
      placeholder: 'Enter Request ID',
      isRequired: true,
      sectionName: 'Application Details',
      validationRules: null,
      displayOrder: 1,
    },

    // ──────────────────────────────────────────────────────────────────────────
    // 9. Nihar Se Sasural Transfer
    // ──────────────────────────────────────────────────────────────────────────
    {
      serviceSlug: 'nihar-se-sasural-transfer',
      label: 'Husband Name',
      fieldKey: 'husbandName',
      fieldType: ServiceFieldType.TEXT,
      placeholder: 'Enter Husband Name',
      isRequired: true,
      sectionName: 'Applicant Details',
      validationRules: null,
      displayOrder: 1,
    },
    {
      serviceSlug: 'nihar-se-sasural-transfer',
      label: 'Husband Member ID',
      fieldKey: 'husbandMemberId',
      fieldType: ServiceFieldType.TEXT,
      placeholder: 'Enter Husband Samagra Member ID',
      isRequired: true,
      sectionName: 'Applicant Details',
      validationRules: { minLength: 9, maxLength: 9, pattern: '^[0-9]{9}$' },
      displayOrder: 2,
    },
    {
      serviceSlug: 'nihar-se-sasural-transfer',
      label: 'Wife Name',
      fieldKey: 'wifeName',
      fieldType: ServiceFieldType.TEXT,
      placeholder: 'Enter Wife Name',
      isRequired: true,
      sectionName: 'Applicant Details',
      validationRules: null,
      displayOrder: 3,
    },
    {
      serviceSlug: 'nihar-se-sasural-transfer',
      label: 'Wife Member ID',
      fieldKey: 'wifeMemberId',
      fieldType: ServiceFieldType.TEXT,
      placeholder: 'Enter Wife Samagra Member ID',
      isRequired: true,
      sectionName: 'Applicant Details',
      validationRules: { minLength: 9, maxLength: 9, pattern: '^[0-9]{9}$' },
      displayOrder: 4,
    },

    // ──────────────────────────────────────────────────────────────────────────
    // 10. Family Approval
    // ──────────────────────────────────────────────────────────────────────────
    {
      serviceSlug: 'family-approval',
      label: 'Request ID',
      fieldKey: 'requestId',
      fieldType: ServiceFieldType.TEXT,
      placeholder: 'Enter Request ID',
      isRequired: true,
      sectionName: 'Application Details',
      validationRules: null,
      displayOrder: 1,
    },

    // ──────────────────────────────────────────────────────────────────────────
    // 11. RC PDF
    // ──────────────────────────────────────────────────────────────────────────
    {
      serviceSlug: 'rc-pdf',
      label: 'Vehicle Number',
      fieldKey: 'vehicleNumber',
      fieldType: ServiceFieldType.TEXT,
      placeholder: 'Enter Vehicle Number (e.g. MP04CC1234)',
      isRequired: true,
      sectionName: 'Identity Details',
      validationRules: { pattern: '^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$' },
      displayOrder: 1,
    },

    // ──────────────────────────────────────────────────────────────────────────
    // 12. DL PDF
    // ──────────────────────────────────────────────────────────────────────────
    {
      serviceSlug: 'dl-pdf',
      label: 'Driving Licence Number',
      fieldKey: 'licenceNumber',
      fieldType: ServiceFieldType.TEXT,
      placeholder: 'Enter Driving Licence Number (e.g. MP0420190001234)',
      isRequired: true,
      sectionName: 'Identity Details',
      validationRules: { pattern: '^[A-Z]{2}[0-9]{2}[0-9]{11}$' },
      displayOrder: 1,
    },
    {
      serviceSlug: 'dl-pdf',
      label: 'Date Of Birth',
      fieldKey: 'dob',
      fieldType: ServiceFieldType.DATE,
      placeholder: 'Select Date of Birth',
      isRequired: true,
      sectionName: 'Identity Details',
      validationRules: null,
      displayOrder: 2,
    },

    // ──────────────────────────────────────────────────────────────────────────
    // 13. Farmer PDF
    // ──────────────────────────────────────────────────────────────────────────
    {
      serviceSlug: 'farmer-pdf',
      label: 'Aadhaar Number',
      fieldKey: 'aadhaarNumber',
      fieldType: ServiceFieldType.TEXT,
      placeholder: 'Enter 12-digit Aadhaar Number',
      isRequired: true,
      sectionName: 'Identity Details',
      validationRules: { minLength: 12, maxLength: 12, pattern: '^[0-9]{12}$' },
      displayOrder: 1,
    },
    {
      serviceSlug: 'farmer-pdf',
      label: 'State Name',
      fieldKey: 'stateName',
      fieldType: ServiceFieldType.SELECT,
      placeholder: 'Select State',
      isRequired: true,
      sectionName: 'Application Details',
      validationRules: { options: INDIAN_STATES_OPTIONS },
      displayOrder: 2,
    },
  ];

  console.log('🧹 Cleaning up old service field configurations...');

  const activeFieldsSet = new Set<string>();
  const serviceSlugToIdMap = new Map<string, string>();

  for (const f of fields) {
    let serviceId = serviceSlugToIdMap.get(f.serviceSlug);
    if (!serviceId) {
      const service = await prisma.service.findUnique({ where: { slug: f.serviceSlug } });
      if (service) {
        serviceId = service.id;
        serviceSlugToIdMap.set(f.serviceSlug, service.id);
      }
    }
    if (serviceId) {
      activeFieldsSet.add(`${serviceId}:${f.fieldKey}`);
    }
  }

  const existingFields = await prisma.serviceField.findMany();
  for (const f of existingFields) {
    const key = `${f.serviceId}:${f.fieldKey}`;
    if (!activeFieldsSet.has(key)) {
      await prisma.serviceField.delete({ where: { id: f.id } });
    }
  }

  let seededCount = 0;

  for (const f of fields) {
    const service = await prisma.service.findUnique({ where: { slug: f.serviceSlug } });
    if (!service) {
      throw new Error(`Service with slug "${f.serviceSlug}" not found during fields seeding.`);
    }

    const rules = f.validationRules !== null ? f.validationRules : undefined;

    await prisma.serviceField.upsert({
      where: {
        serviceId_fieldKey: {
          serviceId: service.id,
          fieldKey: f.fieldKey,
        },
      },
      update: {
        label: f.label,
        fieldType: f.fieldType,
        placeholder: f.placeholder,
        isRequired: f.isRequired,
        validationRules: rules,
        sectionName: f.sectionName ?? null,
        displayOrder: f.displayOrder,
      },
      create: {
        serviceId: service.id,
        fieldKey: f.fieldKey,
        label: f.label,
        fieldType: f.fieldType,
        placeholder: f.placeholder,
        isRequired: f.isRequired,
        validationRules: rules,
        sectionName: f.sectionName ?? null,
        displayOrder: f.displayOrder,
      },
    });
    seededCount++;
  }

  return seededCount;
}
