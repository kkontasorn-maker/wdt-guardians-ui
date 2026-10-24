import type {
  AuditEventRecord,
  MemberRecord,
  MemberWithSubscription,
  PaymentAttemptRecord,
  SubscriptionRecord,
} from "../types";

export type MembershipStore = {
  mode: "memory" | "sqlite" | "postgres";
  createMember(member: MemberRecord): Promise<MemberRecord>;
  getMemberByGuardianId(guardianId: string): Promise<MemberWithSubscription | null>;
  getMemberById(id: string): Promise<MemberRecord | null>;
  createSubscription(sub: SubscriptionRecord): Promise<SubscriptionRecord>;
  getSubscription(id: string): Promise<SubscriptionRecord | null>;
  updateSubscription(sub: SubscriptionRecord): Promise<SubscriptionRecord>;
  createPaymentAttempt(attempt: PaymentAttemptRecord): Promise<PaymentAttemptRecord>;
  getPaymentAttemptByGatewayEventId(
    gatewayEventId: string
  ): Promise<PaymentAttemptRecord | null>;
  getPaymentAttempt(id: string): Promise<PaymentAttemptRecord | null>;
  updatePaymentAttempt(attempt: PaymentAttemptRecord): Promise<PaymentAttemptRecord>;
  findPendingAttemptByChargeId(
    gatewayChargeId: string
  ): Promise<PaymentAttemptRecord | null>;
  findPendingAttemptBySubscription(
    subscriptionId: string
  ): Promise<PaymentAttemptRecord | null>;
  appendAudit(event: AuditEventRecord): Promise<AuditEventRecord>;
};

export function createMemoryStore(): MembershipStore {
  const members = new Map<string, MemberRecord>();
  const membersByGuardian = new Map<string, string>();
  const subscriptions = new Map<string, SubscriptionRecord>();
  const payments = new Map<string, PaymentAttemptRecord>();
  const paymentsByEvent = new Map<string, string>();
  const audits: AuditEventRecord[] = [];

  return {
    mode: "memory",

    async createMember(member) {
      members.set(member.id, member);
      membersByGuardian.set(member.guardianId, member.id);
      return member;
    },

    async getMemberById(id) {
      return members.get(id) ?? null;
    },

    async getMemberByGuardianId(guardianId) {
      const memberId = membersByGuardian.get(guardianId);
      if (!memberId) return null;
      const member = members.get(memberId);
      if (!member) return null;
      const subscription =
        Array.from(subscriptions.values()).find((s) => s.memberId === member.id) ??
        null;
      return { member, subscription };
    },

    async createSubscription(sub) {
      subscriptions.set(sub.id, sub);
      return sub;
    },

    async getSubscription(id) {
      return subscriptions.get(id) ?? null;
    },

    async updateSubscription(sub) {
      subscriptions.set(sub.id, sub);
      return sub;
    },

    async createPaymentAttempt(attempt) {
      payments.set(attempt.id, attempt);
      if (attempt.gatewayEventId) {
        paymentsByEvent.set(attempt.gatewayEventId, attempt.id);
      }
      return attempt;
    },

    async getPaymentAttemptByGatewayEventId(gatewayEventId) {
      const id = paymentsByEvent.get(gatewayEventId);
      if (!id) return null;
      return payments.get(id) ?? null;
    },

    async getPaymentAttempt(id) {
      return payments.get(id) ?? null;
    },

    async updatePaymentAttempt(attempt) {
      payments.set(attempt.id, attempt);
      if (attempt.gatewayEventId) {
        paymentsByEvent.set(attempt.gatewayEventId, attempt.id);
      }
      return attempt;
    },

    async findPendingAttemptByChargeId(gatewayChargeId) {
      return (
        Array.from(payments.values()).find(
          (p) =>
            p.gatewayChargeId === gatewayChargeId &&
            (p.status === "created" || p.status === "pending")
        ) ?? null
      );
    },

    async findPendingAttemptBySubscription(subscriptionId) {
      return (
        Array.from(payments.values()).find(
          (p) =>
            p.subscriptionId === subscriptionId &&
            (p.status === "created" || p.status === "pending")
        ) ?? null
      );
    },

    async appendAudit(event) {
      audits.push(event);
      return event;
    },
  };
}
