export type AdminTransactionStatus = "PAID" | "FAILED" | "PENDING" | string;

export type AdminTransactionType =
  | "SUBSCRIPTION_INITIAL"
  | "SUBSCRIPTION_RENEWAL"
  | "SUBSCRIPTION_UPDATE"
  | "SUBSCRIPTION_PAYMENT";

export type AdminTransaction = {
  id: string;
  vendorId: string;
  vendorName: string | null;
  customerEmail: string | null;
  amount: number;
  currency: string;
  status: AdminTransactionStatus;
  transactionType: AdminTransactionType;
  plan: string | null;
  billingReason: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripeInvoiceId: string | null;
  stripePaymentIntentId: string | null;
  transactionDate: string;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string | null;
};

export type AdminTransactionListResponse = {
  success: boolean;
  count: number;
  transactions: AdminTransaction[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export type AdminTransactionDetailResponse = {
  success: boolean;
  transaction: AdminTransaction;
};
