export interface CreateCustomerRequest {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  smsEnabled?: boolean;
}

export interface UpdateCustomerRequest {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  smsEnabled?: boolean;
}

export interface CustomerResponse {
  customerId: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  smsEnabled: boolean;
}