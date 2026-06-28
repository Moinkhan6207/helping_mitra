/**
 * Notification Service - Architecture for Order Event Notifications
 * 
 * This service provides hooks for sending notifications for order lifecycle events.
 * Currently implements the architecture for:
 * - Order Completed
 * - Order Rejected
 * - Refund Completed
 * 
 * Actual notification delivery (email, SMS, push) can be implemented by extending
 * the respective methods with integration to notification providers.
 * 
 * NOTE: This is architecture preparation only. Database schema for notifications
 * needs to be added before full implementation.
 */

export interface NotificationPayload {
  userId: string;
  orderId: string;
  orderNumber: string;
  serviceName: string;
  timestamp: Date;
}

export interface CompletedNotificationPayload extends NotificationPayload {
  resultType?: string;
  resultLabel?: string;
  userVisibleCompletionNote?: string;
}

export interface RejectedNotificationPayload extends NotificationPayload {
  userVisibleRejectionReason: string;
  refundStatus?: string;
  refundAmount?: number;
}

export interface RefundNotificationPayload extends NotificationPayload {
  refundAmount: number;
  refundStatus: string;
}

export class NotificationService {
  /**
   * Send notification when an order is completed.
   * 
   * Events that trigger this:
   * - Order status changes to SUCCESS
   * - Result is delivered to user
   * 
   * @param payload - Order completion details
   */
  async notifyOrderCompleted(payload: CompletedNotificationPayload): Promise<void> {
    // TODO: Store notification record in database (requires Notification schema)
    // TODO: Integrate with email service
    // TODO: Integrate with SMS service
    // TODO: Integrate with push notification service
    
    console.log('[Notification Service] Order Completed:', {
      userId: payload.userId,
      orderNumber: payload.orderNumber,
      serviceName: payload.serviceName,
      resultType: payload.resultType,
    });
  }

  /**
   * Send notification when an order is rejected.
   * 
   * Events that trigger this:
   * - Order status changes to REJECTED
   * - Rejection reason is provided
   * 
   * @param payload - Order rejection details
   */
  async notifyOrderRejected(payload: RejectedNotificationPayload): Promise<void> {
    // TODO: Store notification record in database (requires Notification schema)
    // TODO: Integrate with email service
    // TODO: Integrate with SMS service
    // TODO: Integrate with push notification service
    
    console.log('[Notification Service] Order Rejected:', {
      userId: payload.userId,
      orderNumber: payload.orderNumber,
      serviceName: payload.serviceName,
      userVisibleRejectionReason: payload.userVisibleRejectionReason,
      refundStatus: payload.refundStatus,
    });
  }

  /**
   * Send notification when a refund is completed.
   * 
   * Events that trigger this:
   * - Refund status changes to COMPLETED
   * - Wallet is credited with refund amount
   * 
   * @param payload - Refund completion details
   */
  async notifyRefundCompleted(payload: RefundNotificationPayload): Promise<void> {
    // TODO: Store notification record in database (requires Notification schema)
    // TODO: Integrate with email service
    // TODO: Integrate with SMS service
    // TODO: Integrate with push notification service
    
    console.log('[Notification Service] Refund Completed:', {
      userId: payload.userId,
      orderNumber: payload.orderNumber,
      serviceName: payload.serviceName,
      refundAmount: payload.refundAmount,
      refundStatus: payload.refundStatus,
    });
  }
}

export const notificationService = new NotificationService();
