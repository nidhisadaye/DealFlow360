export type UserRole =
  | "SALES_REP"
  | "SALES_MANAGER"
  | "FINANCE_OPERATIONS"
  | "CUSTOMER"
  | "ADMIN";

export type CustomerTier =
  | "BRONZE"
  | "SILVER"
  | "GOLD";

export type ProductType =
  | "GOOD"
  | "SERVICE";

export type BillingType =
  | "ONE_TIME"
  | "RECURRING";

export type DealStatus =
  | "DRAFT"
  | "UNDER_REVIEW"
  | "APPROVAL_REQUIRED"
  | "APPROVED"
  | "REJECTED"
  | "NEGOTIATION"
  | "REAPPROVAL_REQUIRED"
  | "FULFILLMENT_PENDING"
  | "READY_TO_BILL"
  | "CLOSED";

export type ApprovalStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED";

export type RiskLevel =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type DealEventType =
  | "DEAL_CREATED"
  | "DEAL_UPDATED"
  | "DISCOUNT_CHANGED"
  | "EVALUATION_COMPLETED"
  | "APPROVAL_REQUESTED"
  | "APPROVED"
  | "REJECTED"
  | "UPSELL_ADDED"
  | "WAREHOUSE_ALLOCATED"
  | "NEGOTIATION_STARTED"
  | "NEGOTIATION_REQUESTED"
  | "REAPPROVAL_TRIGGERED"
  | "BILLING_CREATED"
  | "STATUS_CHANGED";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  company: string;
  email: string;
  phone?: string;
  tier: CustomerTier;
  creditLimit?: number;
  isActive: boolean;
  createdAt: string;
}

export interface CustomerTierConfig {
  id: string;
  tier: CustomerTier;
  maxDiscountPercent: number;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  category: string;
  type: ProductType;
  billingType: BillingType;
  salePrice: number;
  costPrice: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
}

export interface DealItem {
  id: string;
  dealId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  billingType: BillingType;
  recurringInterval?: "MONTHLY" | "QUARTERLY" | "YEARLY";
  discountPercent: number;
  subtotal: number;
  total: number;
}

export interface Deal {
  id: string;
  customerId: string;
  salesRepId: string;
  title: string;
  status: DealStatus;
  items: DealItem[];
  discountPercent: number;
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  costAmount: number;
  marginAmount: number;
  marginPercent: number;
  riskScore: number;
  riskLevel: RiskLevel;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface DiscountRule {
  id: string;
  name: string;
  customerTier?: CustomerTier;
  productCategory?: string;
  maxDiscountPercent: number;
  requiresApprovalAbove: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApprovalRequest {
  id: string;
  dealId: string;
  requestedBy: string;
  approverRole: UserRole;
  status: ApprovalStatus;
  reason: string;
  requestedDiscountPercent: number;
  allowedDiscountPercent: number;
  riskScore: number;
  comments?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Warehouse {
  id: string;
  name: string;
  location: string;
  isActive: boolean;
  createdAt: string;
}

export interface Inventory {
  id: string;
  warehouseId: string;
  productId: string;
  availableQuantity: number;
  reservedQuantity: number;
  updatedAt: string;
}

export interface WarehouseAllocation {
  warehouseId: string;
  warehouseName: string;
  productId: string;
  quantity: number;
  status: "ALLOCATED" | "PARTIAL" | "UNAVAILABLE";
}

export interface UpsellRecommendation {
  productId: string;
  productName: string;
  reason: string;
  quantity: number;
  revenueImpact: number;
  marginImpactPercent: number;
  confidence?: number;
}

export interface Negotiation {
  id: string;
  dealId: string;
  requestedBy: string;
  requestedDiscountPercent: number;
  previousDiscountPercent: number;
  reason?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  updatedAt: string;
}

export interface DealEvent {
  id: string;
  dealId: string;
  eventType: DealEventType;
  actorId: string;
  description: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface Subscription {
  id: string;
  dealId: string;
  productId: string;
  billingInterval: "MONTHLY" | "QUARTERLY" | "YEARLY";
  amount: number;
  startDate: string;
  nextBillingDate: string;
  status: "ACTIVE" | "PAUSED" | "CANCELLED";
}

export interface Invoice {
  id: string;
  dealId: string;
  customerId: string;
  invoiceType: "ONE_TIME" | "RECURRING";
  amount: number;
  currency: string;
  status: "DRAFT" | "ISSUED" | "PAID" | "OVERDUE";
  dueDate?: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  paymentMethod: "CASH" | "BANK_TRANSFER" | "CARD" | "OTHER";
  status: "PENDING" | "SUCCESS" | "FAILED";
  paidAt?: string;
}