export type OrderStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';
export type PaymentStatus = 'PAID' | 'REFUNDED';
export type PaymentMode = 'WALLET';

export interface OrderFieldValue {
  id: string;
  orderId: string;
  fieldKey: string;
  fieldLabel: string;
  fieldValue: string;
  isSensitive: boolean;
  maskedValue?: string;
  createdAt: string;
}

export interface OrderDocument {
  id: string;
  orderId: string;
  documentKey: string;
  documentName: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  storagePath: string;
  createdAt: string;
}

export interface OrderData {
  id: string;
  orderNumber: string;
  userId: string;
  serviceId: string;
  serviceNameSnapshot: string;
  categoryNameSnapshot: string;
  orderAmount: number;
  paymentMode: PaymentMode;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  idempotencyKey: string;
  consentAccepted: boolean;
  consentAcceptedAt: string;
  createdAt: string;
  updatedAt: string;
  fieldValues?: OrderFieldValue[];
  documents?: OrderDocument[];
}

export interface OrdersListResponse {
  orders: OrderData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
