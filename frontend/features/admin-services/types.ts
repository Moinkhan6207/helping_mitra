import { ResultType, ServiceFieldType } from '../services/types';

export type CategoryStatus = 'ACTIVE' | 'INACTIVE';
export type ServiceStatus = 'ACTIVE' | 'INACTIVE';

export interface AdminCategoryData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: CategoryStatus;
  displayOrder: number;
}

export interface AdminServiceListItem {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  mrp: number;
  resultType: ResultType;
  resultLabel: string;
  status: ServiceStatus;
  displayOrder: number;
  category: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface AdminServiceDetailsData extends AdminServiceListItem {
  categoryId: string;
  fields: AdminServiceFieldData[];
  documentRequirements: AdminServiceDocumentData[];
}

export interface AdminServiceFieldData {
  id: string;
  serviceId: string;
  label: string;
  fieldKey: string;
  fieldType: ServiceFieldType;
  placeholder: string | null;
  isRequired: boolean;
  validationRules: any;
  displayOrder: number;
}

export interface AdminServiceDocumentData {
  id: string;
  serviceId: string;
  documentName: string;
  documentKey: string;
  isRequired: boolean;
  allowedFileTypes: string[];
  displayOrder: number;
}

export interface PriceHistoryRecord {
  oldMrp: number;
  newMrp: number;
  changedBy: string;
  createdAt: string;
}

export interface PriceHistoryResponse {
  serviceName: string;
  history: PriceHistoryRecord[];
}

export interface AdminServiceQueryOptions {
  page: number;
  limit: number;
  category?: string;
  search?: string;
  status?: string;
}
