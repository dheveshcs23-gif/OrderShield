export type Role = 'ROLE_CUSTOMER' | 'ROLE_ADMIN';

export interface User {
  id: number;
  email: string;
  fullName: string;
  phone?: string;
  role: Role;
  createdAt?: string;
}

export interface Address {
  id: number;
  userId: number;
  fullName: string;
  streetLine: string;
  unit?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  isDefault?: boolean;
}

export type ProtectedAddressStatus = 'VERIFIED' | 'PENDING_VERIFICATION' | 'REVOKED';

export interface ProtectedAddress {
  id: number;
  ownerId: number;
  ownerName: string;
  ownerEmail: string;
  streetLine: string;
  unit?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
  label: string; // e.g. "Primary Residence"
  verificationStatus: ProtectedAddressStatus;
  isActive: boolean;
  registeredAt: string;
}

export type HouseholdMemberStatus = 'INVITED' | 'ACTIVE' | 'REVOKED';

export interface TrustedHouseholdMember {
  id: number;
  protectedAddressId: number;
  protectedAddressLabel: string;
  streetLine: string;
  memberUserId?: number;
  memberPhone?: string;
  memberEmail?: string;
  memberName: string;
  relationship?: string;
  status: HouseholdMemberStatus;
  invitedAt: string;
  acceptedAt?: string;
  revokedAt?: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  sku: string;
  category: Category;
  description: string;
  price: number;
  markedPrice?: number;
  stockQuantity: number;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  isFeatured?: boolean;
}

export interface CartItem {
  id: number;
  product: Product;
  quantity: number;
}

export type OrderStatus =
  | 'PENDING_SECURITY_AUTHORIZATION'
  | 'AUTHORIZATION_APPROVED'
  | 'AUTHORIZATION_REJECTED'
  | 'PROCESSING'
  | 'DISPATCHED'
  | 'DELIVERED'
  | 'CANCELLED';

export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  productImageUrl: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  id: number;
  orderNumber: string;
  userId: number;
  userEmail: string;
  userName: string;
  status: OrderStatus;
  totalAmount: number;
  isDispatchBlocked: boolean;
  dispatchBlockedReason?: string;
  shippingAddress: {
    fullName: string;
    streetLine: string;
    unit?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string;
  };
  items: OrderItem[];
  authorizationRequestId?: number;
  createdAt: string;
  dispatchedAt?: string;
}

export type AuthorizationRequestStatus = 'PENDING' | 'OTP_SENT' | 'APPROVED' | 'REJECTED';

export interface AuthorizationRequest {
  id: number;
  orderId: number;
  orderNumber: string;
  protectedAddressId: number;
  protectedAddressLabel: string;
  ownerId: number;
  ownerName?: string;
  ownerEmail: string;
  ownerPhone?: string;
  buyerId: number;
  buyerName: string;
  buyerMaskedEmail: string;
  orderItemSummary: string; // e.g. "2 items (Smart Camera, Wi-Fi Sensor)"
  orderTotal: number;
  status: AuthorizationRequestStatus;
  otpCode?: string;
  otpExpiresAt?: string;
  otpVerified?: boolean;
  requestedAt: string;
  decidedAt?: string;
  decisionNotes?: string;
}

export type NotificationType =
  | 'SECURITY_ALERT'
  | 'ORDER_STATUS_UPDATE'
  | 'HOUSEHOLD_INVITATION'
  | 'SYSTEM';

export interface Notification {
  id: number;
  userId: number;
  userEmail?: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  relatedEntityId?: number;
  createdAt: string;
}

export interface AuditLog {
  id: number;
  actorEmail: string;
  action: string;
  resourceType: string;
  resourceId: string;
  details: string;
  timestamp: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
