export type CategoryStatus = 'ACTIVE' | 'INACTIVE';
export type ServiceStatus = 'ACTIVE' | 'INACTIVE';
export type ResultType = 'FILE_UPLOAD' | 'STATUS_ONLY' | 'TEXT_RESULT';
export type ServiceFieldType = 'TEXT' | 'NUMBER' | 'DATE' | 'EMAIL' | 'MOBILE' | 'TEXTAREA' | 'SELECT';

export interface CategoryData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export interface ServiceListItem {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  mrp: number;
  resultType: ResultType;
  resultLabel: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  _count?: {
    fields: number;
    documentRequirements: number;
  };
}

export interface ServiceDetailsData extends ServiceListItem {}

export interface ServiceFieldData {
  label: string;
  fieldKey: string;
  fieldType: ServiceFieldType;
  placeholder: string | null;
  isRequired: boolean;
  validationRules: any;
}

export interface ServiceDocumentData {
  documentName: string;
  documentKey: string;
  isRequired: boolean;
  allowedFileTypes: string[];
}

export interface ServiceQueryOptions {
  page: number;
  limit: number;
  category?: string;
  search?: string;
}

export interface ServicesResponse {
  services: ServiceListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
