import { OrderStatus } from '../orders/types';

export interface AdminOrderQueryFilters {
  page?: number;
  limit?: number;
  search?: string;
  orderStatus?: OrderStatus | '';
  serviceId?: string;
  assignedAdminId?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number | '';
  maxAmount?: number | '';
  sortBy?: 'createdAt' | 'orderAmountPaise' | 'orderStatus';
  sortOrder?: 'asc' | 'desc';
}

export interface AdminOrderListItem {
  id: string;
  orderNumber: string;
  serviceNameSnapshot: string;
  categoryNameSnapshot: string;
  orderAmount: number;
  orderAmountPaise: number;
  orderStatus: OrderStatus;
  paymentStatus: string;
  refundStatus: string;
  createdAt: string;
  updatedAt: string;
  assignedAdminId: string | null;
  assignedAdminName: string;
  processingStartedAt: string | null;
  user: {
    name: string;
    mobile: string;
    userType: string | null;
  };
}

export interface AdminOrdersListResponse {
  orders: AdminOrderListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminOrderStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  rejected: number;
}

export interface AdminUserListItem {
  id: string;
  name: string;
  email: string;
}

export interface AdminOrderDetailField {
  id: string;
  fieldKey: string;
  fieldLabel: string;
  fieldValue: string;
  isSensitive: boolean;
}

export interface AdminOrderDetailDocument {
  id: string;
  documentKey: string;
  documentName: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
}

export interface AdminOrderTimelineItem {
  id: string;
  action: string;
  actorName: string;
  remarks: string | null;
  metadata: any;
  createdAt: string;
}

export interface AdminOrderDetail {
  id: string;
  orderNumber: string;
  userId: string;
  serviceId: string;
  serviceNameSnapshot: string;
  categoryNameSnapshot: string;
  orderAmount: string | number;
  orderAmountPaise: number;
  orderStatus: OrderStatus;
  version: number;
  assignedAdminId: string | null;
  assignedAdminName: string;
  assignedAt: string | null;
  assignedByAdminId: string | null;
  assignedByAdminName: string | null;
  processingStartedAt: string | null;
  processingStartedByAdminId: string | null;
  processingStartedByAdminName: string | null;
  createdAt: string;
  updatedAt: string;
  resultTypeSnapshot: string | null;
  resultLabelSnapshot: string | null;
  completedAt: string | null;
  completedByAdminId: string | null;
  completedByAdminName: string | null;
  userVisibleCompletionNote: string | null;
  internalCompletionNote: string | null;
  rejectedAt: string | null;
  rejectedByAdminId: string | null;
  rejectedByAdminName: string | null;
  internalRejectionReason: string | null;
  userVisibleRejectionReason: string | null;
  refundStatus: string | null;
  refundAmountPaise: number | null;
  user: {
    id: string;
    name: string;
    mobile: string;
    email: string;
    userType: 'CUSTOMER' | 'RETAILER';
    createdAt: string;
  };
  fieldValues: AdminOrderDetailField[];
  documents: AdminOrderDetailDocument[];
  timeline: AdminOrderTimelineItem[];
}

export interface RevealFieldResponse {
  fieldKey: string;
  fieldValue: string;
}

export interface FileAccessResponse {
  signedUrl: string;
}

export interface AssignOrderPayload {
  assignedAdminId: string;
  version: number;
  idempotencyKey?: string;
}

export interface ClaimOrderPayload {
  version: number;
  idempotencyKey?: string;
}

export interface ReassignOrderPayload {
  assignedAdminId: string;
  reason: string;
  version: number;
  idempotencyKey?: string;
}

export interface StartProcessingPayload {
  version: number;
  idempotencyKey?: string;
}

export interface OrderActionResponse {
  orderId: string;
  assignedAdminId?: string;
  orderStatus?: OrderStatus;
  version: number;
}

export type NoteType = 'GENERAL' | 'VERIFICATION' | 'DOCUMENT' | 'FOLLOW_UP' | 'ESCALATION';

export interface OrderInternalNote {
  id: string;
  orderId: string;
  note: string;
  noteType: NoteType | null;
  createdByAdminId: string;
  createdAt: string;
  createdByAdmin: {
    name: string;
    role: string;
  };
}

export interface OrderInternalNotesResponse {
  notes: OrderInternalNote[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface OrderResultDraft {
  id?: string;
  textValue?: string | null;
  fileName?: string | null;
  fileType?: string | null;
  fileSize?: number | null;
  storagePath?: string | null;
  internalCompletionNote?: string | null;
  userVisibleCompletionNote?: string | null;
  createdByAdminId?: string;
  updatedAt?: string;
}

export interface OrderResultResponse {
  resultTypeSnapshot: 'FILE_UPLOAD' | 'STATUS_ONLY' | 'TEXT_RESULT' | null;
  resultLabelSnapshot: string | null;
  draft: OrderResultDraft | null;
}

export interface ResultFileUploadResponse {
  fileName: string;
  fileType: string;
  fileSize: number;
  storagePath: string;
  isReplacement: boolean;
}

export interface ResultFileAccessResponse {
  signedUrl: string;
  fileName: string | null;
  fileType: string | null;
}

export interface CompleteOrderPayload {
  version: number;
  idempotencyKey?: string;
  result?: {
    textValue?: string | null;
    fileName?: string | null;
    fileType?: string | null;
    fileSize?: number | null;
    storagePath?: string | null;
  } | null;
  userVisibleCompletionNote?: string;
  internalCompletionNote?: string | null;
}

export interface CompleteOrderResponse {
  orderId: string;
  orderNumber: string;
  orderStatus: 'SUCCESS';
  completedAt: string;
  completedByAdminId: string;
  completedByAdminName: string;
  version: number;
}

export interface CompletionSummaryResult {
  id: string;
  resultType: string;
  resultLabel: string;
  textValue: string | null;
  fileName: string | null;
  fileType: string | null;
  fileSize: number | null;
  storagePath: string | null;
}

export interface CompletionSummary {
  completed: boolean;
  completedAt: string | null;
  completedBy: string | null;
  completedByAdminId: string | null;
  resultType: string | null;
  resultLabel: string | null;
  userVisibleCompletionNote: string | null;
  result?: CompletionSummaryResult | null;
}

export interface RejectOrderPayload {
  refundOption: 'FULL_REFUND' | 'NO_REFUND';
  internalRejectionReason: string;
  userVisibleRejectionReason: string;
  noRefundReason?: string;
  version: number;
  idempotencyKey?: string;
}

export interface RejectOrderResponse {
  orderId: string;
  orderStatus: 'REJECTED';
  rejectedAt: string;
  rejectedByAdminId: string;
  rejectedByAdminName: string;
  refundStatus: 'COMPLETED' | 'NOT_REQUIRED';
  refundAmountPaise: number | null;
  version: number;
}
