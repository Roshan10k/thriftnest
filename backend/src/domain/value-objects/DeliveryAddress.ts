export interface DeliveryAddress {
  fullName: string;
  phone: string;
  street: string;
  city: string;
  district: string;
  postalCode: string;
}

export type DeliveryMethod = 'standard' | 'express' | 'pickup';
