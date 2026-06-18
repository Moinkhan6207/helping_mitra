import { ResultType, ServiceFieldType } from '@prisma/client';

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

export interface QuickSearchResult {
  name: string;
  slug: string;
}

export interface ServiceQueryOptions {
  page: number;
  limit: number;
  categorySlug?: string;
  search?: string;
}

export interface AdminServiceQueryOptions {
  page: number;
  limit: number;
  categorySlug?: string;
  search?: string;
  status?: string;
}
