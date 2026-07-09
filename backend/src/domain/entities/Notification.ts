export type NotificationType =
  | 'message'
  | 'order'
  | 'offer'
  | 'price-drop'
  | 'review'
  | 'security';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: Date;
}
