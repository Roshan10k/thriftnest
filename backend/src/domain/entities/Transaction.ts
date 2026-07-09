export type TransactionType = 'payment' | 'refund' | 'withdrawal';
export type PaymentMethod = 'stripe' | 'esewa' | 'khalti';
export type TransactionStatus = 'pending' | 'completed' | 'failed';

export interface Transaction {
  id: string;
  orderId: string;
  userId: string;
  type: TransactionType;
  amount: number;
  method: PaymentMethod;
  status: TransactionStatus;
  gatewayRef?: string;
  createdAt: Date;
}
