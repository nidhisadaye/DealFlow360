// Shared enums — matches Section 8 of the DealFlow360 API contract
// All values here are the authoritative names. Do not redefine elsewhere.

const UserRole = Object.freeze({
  SALES_REP: 'SALES_REP',
  SALES_MANAGER: 'SALES_MANAGER',
  FINANCE_OPERATIONS: 'FINANCE_OPERATIONS',
  CUSTOMER: 'CUSTOMER',
  ADMIN: 'ADMIN',
});

const CustomerTier = Object.freeze({
  BRONZE: 'BRONZE',
  SILVER: 'SILVER',
  GOLD: 'GOLD',
});

const ProductType = Object.freeze({
  GOOD: 'GOOD',
  SERVICE: 'SERVICE',
});

const BillingType = Object.freeze({
  ONE_TIME: 'ONE_TIME',
  RECURRING: 'RECURRING',
});

const DealStatus = Object.freeze({
  DRAFT: 'DRAFT',
  UNDER_REVIEW: 'UNDER_REVIEW',
  APPROVAL_REQUIRED: 'APPROVAL_REQUIRED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  NEGOTIATION: 'NEGOTIATION',
  REAPPROVAL_REQUIRED: 'REAPPROVAL_REQUIRED',
  FULFILLMENT_PENDING: 'FULFILLMENT_PENDING',
  READY_TO_BILL: 'READY_TO_BILL',
  CLOSED: 'CLOSED',
});

const ApprovalStatus = Object.freeze({
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
});

const InvoiceStatus = Object.freeze({
  DRAFT: 'DRAFT',
  ISSUED: 'ISSUED',
  PAID: 'PAID',
  OVERDUE: 'OVERDUE',
});

const SubscriptionStatus = Object.freeze({
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  CANCELLED: 'CANCELLED',
});

const RiskLevel = Object.freeze({
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
});

const DealEventType = Object.freeze({
  DEAL_CREATED: 'DEAL_CREATED',
  DEAL_UPDATED: 'DEAL_UPDATED',
  DISCOUNT_CHANGED: 'DISCOUNT_CHANGED',
  EVALUATION_COMPLETED: 'EVALUATION_COMPLETED',
  APPROVAL_REQUESTED: 'APPROVAL_REQUESTED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  UPSELL_ADDED: 'UPSELL_ADDED',
  WAREHOUSE_ALLOCATED: 'WAREHOUSE_ALLOCATED',
  NEGOTIATION_STARTED: 'NEGOTIATION_STARTED',
  NEGOTIATION_REQUESTED: 'NEGOTIATION_REQUESTED',
  REAPPROVAL_TRIGGERED: 'REAPPROVAL_TRIGGERED',
  BILLING_CREATED: 'BILLING_CREATED',
  STATUS_CHANGED: 'STATUS_CHANGED',
});

// Valid state transitions — use this to guard against invalid status changes later
const VALID_TRANSITIONS = Object.freeze({
  DRAFT: ['UNDER_REVIEW'],
  UNDER_REVIEW: ['APPROVAL_REQUIRED', 'FULFILLMENT_PENDING'],
  APPROVAL_REQUIRED: ['APPROVED', 'REJECTED'],
  APPROVED: ['FULFILLMENT_PENDING', 'NEGOTIATION'],
  NEGOTIATION: ['REAPPROVAL_REQUIRED'],
  REAPPROVAL_REQUIRED: ['APPROVED', 'REJECTED'],
  FULFILLMENT_PENDING: ['READY_TO_BILL'],
  READY_TO_BILL: ['CLOSED'],
  REJECTED: [],
  CLOSED: [],
});

module.exports = {
  UserRole,
  CustomerTier,
  ProductType,
  BillingType,
  DealStatus,
  ApprovalStatus,
  InvoiceStatus,
  SubscriptionStatus,
  RiskLevel,
  DealEventType,
  VALID_TRANSITIONS,
};