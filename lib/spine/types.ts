import type { BillingInterval, SpinePlanId } from "./plans";
import type { SubscriptionStatus } from "./states";

export type LocaleCode = "en" | "th";

export type MemberRecord = {
  id: string;
  guardianId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  locale: LocaleCode;
  founding: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SubscriptionRecord = {
  id: string;
  memberId: string;
  planId: SpinePlanId;
  interval: BillingInterval;
  status: SubscriptionStatus;
  amountThb: number;
  currency: "THB";
  /** Set when status becomes active after confirmed payment. */
  activatedAt: string | null;
  cancelledAt: string | null;
  currentPeriodEnd: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PaymentAttemptStatus =
  | "created"
  | "pending"
  | "successful"
  | "failed"
  | "ignored";

export type PaymentAttemptMethod = "card" | "promptpay";

export type PaymentAttemptRecord = {
  id: string;
  subscriptionId: string;
  memberId: string;
  amountThb: number;
  currency: "THB";
  status: PaymentAttemptStatus;
  /** Soft Launch channel used for this attempt. */
  paymentMethod: PaymentAttemptMethod | null;
  /** Omise / gateway charge id when known. */
  gatewayChargeId: string | null;
  /** Omise event id for webhook idempotency. */
  gatewayEventId: string | null;
  failureCode: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AuditEventRecord = {
  id: string;
  actor: string;
  action: string;
  entityType: string;
  entityId: string;
  payloadJson: string;
  createdAt: string;
};

export type JoinPendingInput = {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  planId: SpinePlanId;
  interval: BillingInterval;
  locale?: LocaleCode;
  founding?: boolean;
};

export type MemberWithSubscription = {
  member: MemberRecord;
  subscription: SubscriptionRecord | null;
};
