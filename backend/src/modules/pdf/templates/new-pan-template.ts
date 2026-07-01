export interface PdfTemplateElement {
  type: 'text' | 'box' | 'grid' | 'image' | 'line' | 'rect' | 'checkbox';
  fieldKey?: string;
  text?: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  fontSize?: number;
  bold?: boolean;
  charCount?: number;
  boxSize?: number;
  spacing?: number;
  options?: string[];
  checkedValue?: string;
}

export interface PdfTemplate {
  serviceSlug: string;
  pageWidth: number;
  pageHeight: number;
  elements: PdfTemplateElement[];
  appendDocuments: string[];
}

export const newPanTemplate: PdfTemplate = {
  serviceSlug: 'new-pan-apply',
  pageWidth: 595.27, // A4
  pageHeight: 841.89,
  appendDocuments: [
    'thumbImpression',
    'aadhaarFront',
    'aadhaarBack',
    'birthProof',
    'addressProof',
    'supportingDocuments'
  ],
  elements: [
    // Outer Border
    { type: 'rect', x: 20, y: 20, width: 555, height: 801 },
    
    // Header Banner
    { type: 'rect', x: 20, y: 760, width: 555, height: 60 },
    { type: 'text', text: 'FORM NO. 49A', x: 30, y: 795, fontSize: 14, bold: true },
    { type: 'text', text: 'Application for Allotment of Permanent Account Number (Only for Indian Citizens)', x: 30, y: 775, fontSize: 9, bold: true },
    
    // Left Photo Box
    { type: 'rect', x: 35, y: 620, width: 110, height: 130 },
    { type: 'text', text: 'Paste Photo Here', x: 50, y: 680, fontSize: 8, bold: true },
    { type: 'text', text: '(Signature across)', x: 45, y: 665, fontSize: 7 },
    { type: 'image', fieldKey: 'passportPhoto', x: 35, y: 620, width: 110, height: 130 },
    // Mock signature across photo
    { type: 'image', fieldKey: 'signature', x: 25, y: 625, width: 100, height: 35 },

    // Right Photo Box
    { type: 'rect', x: 440, y: 620, width: 110, height: 130 },
    { type: 'text', text: 'Paste Photo Here', x: 455, y: 680, fontSize: 8, bold: true },
    { type: 'image', fieldKey: 'passportPhoto', x: 440, y: 620, width: 110, height: 130 },

    // Signature box
    { type: 'rect', x: 210, y: 620, width: 200, height: 50 },
    { type: 'text', text: 'Signature / Left Thumb Impression', x: 240, y: 605, fontSize: 7, bold: true },
    { type: 'image', fieldKey: 'signature', x: 215, y: 625, width: 190, height: 40 },

    // AO Code Section
    { type: 'rect', x: 35, y: 535, width: 515, height: 45 },
    { type: 'text', text: 'Assessing Officer (AO Code)', x: 40, y: 565, fontSize: 8, bold: true },
    { type: 'text', text: 'Area Code', x: 45, y: 555, fontSize: 7 },
    { type: 'text', text: 'AO Type', x: 145, y: 555, fontSize: 7 },
    { type: 'text', text: 'Range Code', x: 245, y: 555, fontSize: 7 },
    { type: 'text', text: 'AO Number', x: 345, y: 555, fontSize: 7 },
    
    { type: 'grid', fieldKey: 'areaCode', x: 45, y: 540, charCount: 4, boxSize: 12 },
    { type: 'grid', fieldKey: 'aoType', x: 145, y: 540, charCount: 3, boxSize: 12 },
    { type: 'grid', fieldKey: 'rangeCode', x: 245, y: 540, charCount: 4, boxSize: 12 },
    { type: 'grid', fieldKey: 'aoNumber', x: 345, y: 540, charCount: 3, boxSize: 12 },

    // Section 1: Full Name
    { type: 'text', text: '1. Full Name (Lastname, Firstname, Middlename)', x: 35, y: 510, fontSize: 9, bold: true },
    { type: 'text', text: 'Last Name:', x: 40, y: 492, fontSize: 7 },
    { type: 'grid', fieldKey: 'lastName', x: 110, y: 490, charCount: 25, boxSize: 11 },
    
    { type: 'text', text: 'First Name:', x: 40, y: 477, fontSize: 7 },
    { type: 'grid', fieldKey: 'firstName', x: 110, y: 475, charCount: 25, boxSize: 11 },
    
    { type: 'text', text: 'Middle Name:', x: 40, y: 462, fontSize: 7 },
    { type: 'grid', fieldKey: 'middleName', x: 110, y: 460, charCount: 25, boxSize: 11 },

    // Print Name
    { type: 'text', text: 'Name to be printed on PAN card:', x: 35, y: 442, fontSize: 8, bold: true },
    { type: 'grid', fieldKey: 'cardNamePrint', x: 180, y: 440, charCount: 25, boxSize: 11 },

    // Section 2: Gender
    { type: 'text', text: '2. Gender:', x: 35, y: 422, fontSize: 8, bold: true },
    { type: 'checkbox', fieldKey: 'gender', checkedValue: 'Male', x: 110, y: 420, width: 10, height: 10 },
    { type: 'text', text: 'Male', x: 125, y: 421, fontSize: 8 },
    { type: 'checkbox', fieldKey: 'gender', checkedValue: 'Female', x: 170, y: 420, width: 10, height: 10 },
    { type: 'text', text: 'Female', x: 185, y: 421, fontSize: 8 },
    { type: 'checkbox', fieldKey: 'gender', checkedValue: 'Transgender', x: 230, y: 420, width: 10, height: 10 },
    { type: 'text', text: 'Transgender', x: 245, y: 421, fontSize: 8 },

    // Section 3: Date of Birth
    { type: 'text', text: '3. Date of Birth / Incorporation (DD/MM/YYYY):', x: 35, y: 402, fontSize: 8, bold: true },
    { type: 'grid', fieldKey: 'dob', x: 280, y: 400, charCount: 8, boxSize: 11 },

    // Section 4: Parents details
    { type: 'text', text: "4. Father's Name (Lastname, Firstname, Middlename)", x: 35, y: 382, fontSize: 8, bold: true },
    { type: 'text', text: 'Last Name:', x: 40, y: 367, fontSize: 7 },
    { type: 'grid', fieldKey: 'fatherLastName', x: 110, y: 365, charCount: 25, boxSize: 11 },
    { type: 'text', text: 'First Name:', x: 40, y: 352, fontSize: 7 },
    { type: 'grid', fieldKey: 'fatherFirstName', x: 110, y: 350, charCount: 25, boxSize: 11 },
    { type: 'text', text: 'Middle Name:', x: 40, y: 337, fontSize: 7 },
    { type: 'grid', fieldKey: 'fatherMiddleName', x: 110, y: 335, charCount: 25, boxSize: 11 },

    { type: 'text', text: "Mother's Name (Optional)", x: 35, y: 317, fontSize: 8, bold: true },
    { type: 'text', text: 'Last Name:', x: 40, y: 302, fontSize: 7 },
    { type: 'grid', fieldKey: 'motherLastName', x: 110, y: 300, charCount: 25, boxSize: 11 },
    { type: 'text', text: 'First Name:', x: 40, y: 287, fontSize: 7 },
    { type: 'grid', fieldKey: 'motherFirstName', x: 110, y: 285, charCount: 25, boxSize: 11 },
    { type: 'text', text: 'Middle Name:', x: 40, y: 272, fontSize: 7 },
    { type: 'grid', fieldKey: 'motherMiddleName', x: 110, y: 270, charCount: 25, boxSize: 11 },

    // Section 5: Aadhaar Details
    { type: 'text', text: '5. Aadhaar Details:', x: 35, y: 252, fontSize: 8, bold: true },
    { type: 'text', text: 'Aadhaar No:', x: 40, y: 237, fontSize: 7 },
    { type: 'grid', fieldKey: 'aadhaarNumber', x: 110, y: 235, charCount: 12, boxSize: 11 },
    { type: 'text', text: 'Name on Aadhaar:', x: 40, y: 222, fontSize: 7 },
    { type: 'grid', fieldKey: 'aadhaarName', x: 180, y: 220, charCount: 25, boxSize: 11 },

    // Section 6: Address details
    { type: 'text', text: '6. Address for Communication:', x: 35, y: 202, fontSize: 8, bold: true },
    { type: 'text', text: 'Flat/Door/Block:', x: 40, y: 187, fontSize: 7 },
    { type: 'text', fieldKey: 'flatDoorBlock', x: 130, y: 187, fontSize: 8 },
    { type: 'text', text: 'Building/Village:', x: 280, y: 187, fontSize: 7 },
    { type: 'text', fieldKey: 'buildingVillage', x: 360, y: 187, fontSize: 8 },

    { type: 'text', text: 'Road/Street/Lane:', x: 40, y: 172, fontSize: 7 },
    { type: 'text', fieldKey: 'roadStreetLane', x: 130, y: 172, fontSize: 8 },
    { type: 'text', text: 'Area/Locality:', x: 280, y: 172, fontSize: 7 },
    { type: 'text', fieldKey: 'areaLocality', x: 360, y: 172, fontSize: 8 },

    { type: 'text', text: 'Town/City/District:', x: 40, y: 157, fontSize: 7 },
    { type: 'text', fieldKey: 'townCityDistrict', x: 130, y: 157, fontSize: 8 },
    { type: 'text', text: 'State/UT:', x: 280, y: 157, fontSize: 7 },
    { type: 'text', fieldKey: 'state', x: 360, y: 157, fontSize: 8 },

    { type: 'text', text: 'PIN Code:', x: 40, y: 142, fontSize: 7 },
    { type: 'grid', fieldKey: 'pinCode', x: 110, y: 140, charCount: 6, boxSize: 11 },
    { type: 'text', text: 'Country:', x: 280, y: 142, fontSize: 7 },
    { type: 'text', text: 'INDIA', x: 360, y: 142, fontSize: 8, bold: true },

    // Section 7: Contact Info
    { type: 'text', text: '7. Contact Details:', x: 35, y: 122, fontSize: 8, bold: true },
    { type: 'text', text: 'Mobile No:', x: 40, y: 107, fontSize: 7 },
    { type: 'grid', fieldKey: 'mobileNumber', x: 110, y: 105, charCount: 10, boxSize: 11 },
    { type: 'text', text: 'Email ID:', x: 280, y: 107, fontSize: 7 },
    { type: 'text', fieldKey: 'emailId', x: 340, y: 107, fontSize: 8 },

    // Document Proofs
    { type: 'text', text: 'Document Proof Selection Enclosures:', x: 35, y: 100, fontSize: 8, bold: true },
    { type: 'text', text: 'Identity Proof:', x: 35, y: 88, fontSize: 7.5 },
    { type: 'text', fieldKey: 'proofOfIdentity', x: 100, y: 88, fontSize: 7.5, bold: true },
    { type: 'text', text: 'Address Proof:', x: 210, y: 88, fontSize: 7.5 },
    { type: 'text', fieldKey: 'proofOfAddress', x: 275, y: 88, fontSize: 7.5, bold: true },
    { type: 'text', text: 'DOB Proof:', x: 385, y: 88, fontSize: 7.5 },
    { type: 'text', fieldKey: 'proofOfDob', x: 435, y: 88, fontSize: 7.5, bold: true },

    // Footer Declaration
    { type: 'line', x: 20, y: 75, width: 555, height: 0 },
    { type: 'text', text: 'I/We hereby declare that whatever is stated above is true to the best of my/our information and belief.', x: 35, y: 60, fontSize: 7 },
    { type: 'text', text: 'Date:', x: 35, y: 40, fontSize: 7 },
    { type: 'text', text: new Date().toLocaleDateString('en-IN'), x: 60, y: 40, fontSize: 8 },
    { type: 'text', text: 'Place:', x: 200, y: 40, fontSize: 7 },
    { type: 'text', fieldKey: 'townCityDistrict', x: 230, y: 40, fontSize: 8, bold: true }
  ]
};
