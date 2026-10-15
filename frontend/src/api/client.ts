import {
  AuthResponse,
  Category,
  Order,
  Product,
  ProtectedAddress,
  TrustedHouseholdMember,
  User,
  AuthorizationRequest,
  Notification,
  AuditLog
} from '../types';
import {
  DEMO_USERS,
  MOCK_CATEGORIES,
  MOCK_PRODUCTS,
  MOCK_PROTECTED_ADDRESSES,
  MOCK_TRUSTED_MEMBERS,
  MOCK_ORDERS,
  MOCK_AUTHORIZATION_REQUESTS,
  MOCK_NOTIFICATIONS,
  MOCK_AUDIT_LOGS
} from '../data/mockData';

const API_BASE = '/api';

// In-memory state synchronized with localStorage for demo/offline resilience
class LocalShieldStore {
  protectedAddresses: ProtectedAddress[] = [...MOCK_PROTECTED_ADDRESSES];
  trustedMembers: TrustedHouseholdMember[] = [...MOCK_TRUSTED_MEMBERS];
  orders: Order[] = [...MOCK_ORDERS];
  authRequests: AuthorizationRequest[] = [...MOCK_AUTHORIZATION_REQUESTS];
  notifications: Notification[] = [...MOCK_NOTIFICATIONS];
  auditLogs: AuditLog[] = [...MOCK_AUDIT_LOGS];
  products: Product[] = [...MOCK_PRODUCTS];

  constructor() {
    this.load();
  }

  save() {
    try {
      localStorage.setItem('ordershield_local_state', JSON.stringify({
        protectedAddresses: this.protectedAddresses,
        trustedMembers: this.trustedMembers,
        orders: this.orders,
        authRequests: this.authRequests,
        notifications: this.notifications,
        auditLogs: this.auditLogs,
      }));
    } catch {
      // storage full or disabled
    }
  }

  load() {
    try {
      const data = localStorage.getItem('ordershield_local_state');
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.protectedAddresses) this.protectedAddresses = parsed.protectedAddresses;
        if (parsed.trustedMembers) this.trustedMembers = parsed.trustedMembers;
        if (parsed.orders) this.orders = parsed.orders;
        if (parsed.authRequests) this.authRequests = parsed.authRequests;
        if (parsed.notifications) this.notifications = parsed.notifications;
        if (parsed.auditLogs) this.auditLogs = parsed.auditLogs;
      }
    } catch {
      // fallback to initial mock state
    }

    // Purge sprayed/duplicate OTP notifications and deduplicate
    this.notifications = (this.notifications || []).filter(
      (n) => !n.title.includes('OTP Generated')
    );
    const seenReq = new Set<number>();
    this.notifications = this.notifications.filter((n) => {
      if (n.relatedEntityId) {
        if (seenReq.has(n.relatedEntityId)) return false;
        seenReq.add(n.relatedEntityId);
      }
      return true;
    });

    // Migrate any legacy references to Alice, Bob, and Mallory in local storage
    let stateCleaned = false;
    this.protectedAddresses = (this.protectedAddresses || []).map((pa) => {
      const name = pa.ownerName || (pa as any).owner?.fullName || '';
      const email = pa.ownerEmail || (pa as any).owner?.email || '';
      if (!name || name.toLowerCase().includes('alice') || email.toLowerCase().includes('alice')) {
        stateCleaned = true;
        return {
          ...pa,
          ownerName: 'Dhevesh',
          ownerEmail: 'dhevesh@shield.com',
          phone: pa.phone && !pa.phone.includes('555') ? pa.phone : '+91 9876543210',
        };
      }
      return pa;
    });

    this.trustedMembers = (this.trustedMembers || []).map((m) => {
      if (m.memberName?.toLowerCase().includes('bob') || m.memberEmail?.toLowerCase().includes('bob')) {
        stateCleaned = true;
        return {
          ...m,
          memberName: 'Ajay',
          memberEmail: 'ajay@shield.com',
          memberPhone: '+91 9876500000',
        };
      }
      return m;
    });

    this.orders = (this.orders || []).map((o) => {
      if (o.userName?.toLowerCase().includes('alice') || o.userEmail?.toLowerCase().includes('alice')) {
        stateCleaned = true;
        return {
          ...o,
          userName: 'Dhevesh',
          userEmail: 'dhevesh@shield.com',
        };
      }
      return o;
    });

    this.authRequests = (this.authRequests || []).map((r) => {
      if (r.ownerName?.toLowerCase().includes('alice') || r.ownerEmail?.toLowerCase().includes('alice')) {
        stateCleaned = true;
        return {
          ...r,
          ownerName: 'Dhevesh',
          ownerEmail: 'dhevesh@shield.com',
          ownerPhone: r.ownerPhone && !r.ownerPhone.includes('555') ? r.ownerPhone : '+91 9876543210',
        };
      }
      return r;
    });

    // Ensure all demo protected addresses (like Dhevesh) are always present and normalized
    MOCK_PROTECTED_ADDRESSES.forEach((pa) => {
      const norm = normalizeAddress(pa.streetLine, pa.unit, pa.city, pa.postalCode);
      const idx = this.protectedAddresses.findIndex(
        (existing) => normalizeAddress(existing.streetLine, existing.unit, existing.city, existing.postalCode) === norm
      );
      if (idx === -1) {
        this.protectedAddresses.push({ ...pa });
        stateCleaned = true;
      } else {
        const existingName = this.protectedAddresses[idx].ownerName || '';
        const cleanOwnerName = existingName.toLowerCase().includes('alice') ? 'Dhevesh' : (existingName || pa.ownerName);
        const existingEmail = this.protectedAddresses[idx].ownerEmail || '';
        const cleanOwnerEmail = existingEmail.toLowerCase().includes('alice') ? 'dhevesh@shield.com' : (existingEmail || pa.ownerEmail);
        this.protectedAddresses[idx] = {
          ...pa,
          ...this.protectedAddresses[idx],
          ownerName: cleanOwnerName,
          ownerEmail: cleanOwnerEmail,
          ownerId: cleanOwnerEmail === 'dhevesh@shield.com' ? 10 : (this.protectedAddresses[idx].ownerId || pa.ownerId),
          phone: this.protectedAddresses[idx].phone && !this.protectedAddresses[idx].phone.includes('555') ? this.protectedAddresses[idx].phone : pa.phone,
        };
      }
    });

    try {
      const activeUserStr = localStorage.getItem('ordershield_active_user');
      if (activeUserStr) {
        const activeUser = JSON.parse(activeUserStr);
        if (activeUser.email?.toLowerCase().includes('alice') || activeUser.fullName?.toLowerCase().includes('alice')) {
          localStorage.setItem('ordershield_active_user', JSON.stringify({
            id: 10,
            email: 'dhevesh@shield.com',
            fullName: 'Dhevesh',
            phone: '+91 9876543210',
            role: 'ROLE_CUSTOMER',
          }));
        }
      }
    } catch {
      // ignore
    }

    if (stateCleaned) {
      this.save();
    }
  }

  reset() {
    this.protectedAddresses = [...MOCK_PROTECTED_ADDRESSES];
    this.trustedMembers = [...MOCK_TRUSTED_MEMBERS];
    this.orders = [...MOCK_ORDERS];
    this.authRequests = [...MOCK_AUTHORIZATION_REQUESTS];
    this.notifications = [...MOCK_NOTIFICATIONS];
    this.auditLogs = [...MOCK_AUDIT_LOGS];
    localStorage.removeItem('ordershield_local_state');
  }
}

export const localStore = new LocalShieldStore();

function getToken(): string | null {
  return localStorage.getItem('ordershield_token');
}

export function setToken(token: string) {
  localStorage.setItem('ordershield_token', token);
}

export function removeToken() {
  localStorage.removeItem('ordershield_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token && !token.startsWith('demo-token-')) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorMsg = `HTTP Error ${res.status}`;
    try {
      const errJson = await res.json();
      errorMsg = errJson.message || errJson.error || errorMsg;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return res.json();
}

// -------------------------------------------------------------
// Address Normalization Utility (Consistent with backend logic)
// -------------------------------------------------------------
export function normalizeAddress(street: string, unit?: string, city?: string, postalCode?: string): string {
  const clean = (s?: string) => (s || '')
    .toLowerCase()
    .trim()
    .replace(/\b(street|st\.)\b/g, 'st')
    .replace(/\b(avenue|ave\.)\b/g, 'ave')
    .replace(/\b(road|rd\.)\b/g, 'rd')
    .replace(/\b(boulevard|blvd\.)\b/g, 'blvd')
    .replace(/\b(apartment|apt\.)\b/g, 'apt')
    .replace(/[^a-z0-9]/g, '');

  return `${clean(street)}|${clean(unit)}|${clean(city)}|${clean(postalCode)}`;
}

// -------------------------------------------------------------
// 10-Minute Homeowner Rejection Cooldown Management
// -------------------------------------------------------------
export interface RejectionCooldown {
  addressNorm: string;
  streetLine: string;
  ownerEmail?: string;
  buyerEmail?: string;
  expiresAt: number; // timestamp in ms
}

export function getActiveCooldown(
  streetLine?: string,
  unit?: string,
  city?: string,
  postalCode?: string
): { active: boolean; remainingSeconds: number; ownerEmail?: string } {
  try {
    const raw = localStorage.getItem('ordershield_rejection_cooldowns');
    if (!raw) return { active: false, remainingSeconds: 0 };
    const cooldowns: RejectionCooldown[] = JSON.parse(raw);
    const now = Date.now();
    const targetNorm = normalizeAddress(streetLine || '', unit, city, postalCode);
    const streetClean = (streetLine || '').toLowerCase().trim();

    const activeItem = cooldowns.find((c) => {
      if (c.expiresAt <= now) return false;
      if (c.addressNorm && c.addressNorm === targetNorm) return true;
      const cStreet = (c.streetLine || '').toLowerCase().trim();
      if (streetClean && cStreet && (streetClean.includes(cStreet) || cStreet.includes(streetClean))) return true;
      return false;
    });

    if (activeItem) {
      const remainingSeconds = Math.max(0, Math.ceil((activeItem.expiresAt - now) / 1000));
      return { active: remainingSeconds > 0, remainingSeconds, ownerEmail: activeItem.ownerEmail };
    }
  } catch {
    // ignore
  }
  return { active: false, remainingSeconds: 0 };
}

export function addRejectionCooldown(
  streetLine: string,
  unit?: string,
  city?: string,
  postalCode?: string,
  ownerEmail?: string,
  buyerEmail?: string
) {
  try {
    const raw = localStorage.getItem('ordershield_rejection_cooldowns');
    const cooldowns: RejectionCooldown[] = raw ? JSON.parse(raw) : [];
    const now = Date.now();
    const expiresAt = now + 10 * 60 * 1000; // 10 minutes

    const addressNorm = normalizeAddress(streetLine, unit, city, postalCode);
    const filtered = cooldowns.filter((c) => c.expiresAt > now && c.addressNorm !== addressNorm);
    filtered.push({
      addressNorm,
      streetLine,
      ownerEmail: ownerEmail || 'Homeowner',
      buyerEmail,
      expiresAt,
    });
    localStorage.setItem('ordershield_rejection_cooldowns', JSON.stringify(filtered));
    window.dispatchEvent(new CustomEvent('ordershield_cooldown_update'));
  } catch {
    // ignore
  }
}

// Cross-tab synchronization
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'ordershield_local_state' || e.key === 'ordershield_rejection_cooldowns') {
      localStore.load();
      window.dispatchEvent(new CustomEvent('ordershield_update'));
      window.dispatchEvent(new CustomEvent('ordershield_cooldown_update'));
    }
  });
}

// Robust matcher for protected addresses (supports exact normalized hash, label matching, and street substring matching)
export function findProtectedAddressMatch(
  streetLine?: string,
  unit?: string,
  city?: string,
  postalCode?: string
): ProtectedAddress | undefined {
  localStore.load();
  const targetNorm = normalizeAddress(streetLine || '', unit, city, postalCode);
  const streetClean = (streetLine || '').toLowerCase().trim();

  return localStore.protectedAddresses.find((pa) => {
    if (!pa.isActive) return false;
    const paNorm = normalizeAddress(pa.streetLine, pa.unit, pa.city, pa.postalCode);
    if (paNorm === targetNorm) return true;

    const paStreet = (pa.streetLine || '').toLowerCase().trim();
    const paLabel = (pa.label || '').toLowerCase().trim();

    if (streetClean && paLabel && (streetClean === paLabel || streetClean.includes(paLabel) || paLabel.includes(streetClean))) {
      return true;
    }
    if (streetClean && paStreet && (streetClean === paStreet || streetClean.includes(paStreet) || paStreet.includes(streetClean))) {
      return true;
    }
    return false;
  });
}

// Robust matcher for household members against protected address and buyer details
export function isAuthorizedHouseholdMember(
  match: ProtectedAddress,
  buyer: {
    phone?: string;
    fullName?: string;
    email?: string;
    shippingPhone?: string;
    shippingFullName?: string;
  }
): boolean {
  localStore.load();
  const cleanDigits = (p?: string) => (p || '').replace(/\D/g, '');

  const buyerPhones = [
    cleanDigits(buyer.phone),
    cleanDigits(buyer.shippingPhone),
  ].filter(Boolean);

  const buyerNames = [
    (buyer.fullName || '').trim().toLowerCase(),
    (buyer.shippingFullName || '').trim().toLowerCase(),
  ].filter(Boolean);

  const buyerEmails = [
    (buyer.email || '').trim().toLowerCase(),
  ].filter(Boolean);

  return localStore.trustedMembers.some((m) => {
    if (m.status !== 'ACTIVE') return false;

    // 1. Address Match: Check ID, label, or street line
    const idMatch = Number(m.protectedAddressId) === Number(match.id);
    const labelMatch = Boolean(
      m.protectedAddressLabel &&
      match.label &&
      m.protectedAddressLabel.trim().toLowerCase() === match.label.trim().toLowerCase()
    );
    const streetMatch = Boolean(
      m.streetLine &&
      match.streetLine &&
      (
        m.streetLine.toLowerCase().includes(match.streetLine.toLowerCase()) ||
        match.streetLine.toLowerCase().includes(m.streetLine.toLowerCase())
      )
    );

    if (!idMatch && !labelMatch && !streetMatch) return false;

    // 2. Identity match: Mobile Number (unique phone match, exact or last 10 digits)
    const mPhoneDigits = cleanDigits(m.memberPhone);
    if (mPhoneDigits) {
      const phoneMatches = buyerPhones.some((bp) => {
        if (!bp) return false;
        if (bp === mPhoneDigits) return true;
        if (bp.length >= 10 && mPhoneDigits.length >= 10 && bp.slice(-10) === mPhoneDigits.slice(-10)) {
          return true;
        }
        return false;
      });
      if (phoneMatches) return true;
    }

    // 3. Email match
    if (m.memberEmail) {
      const emailMatches = buyerEmails.some((be) => be && be === (m.memberEmail || '').trim().toLowerCase());
      if (emailMatches) return true;
    }

    // 4. Full Name match
    if (m.memberName) {
      const mNameLower = m.memberName.trim().toLowerCase();
      const nameMatches = buyerNames.some((bn) => bn && bn === mNameLower);
      if (nameMatches) return true;
    }

    return false;
  });
}

// -------------------------------------------------------------
// API Services with automatic backend call + seamless demo fallback
// -------------------------------------------------------------
export const api = {
  // Authentication
  auth: {
    async login(email: string, _password: string): Promise<AuthResponse> {
      try {
        const res = await request<AuthResponse>('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password: _password }),
        });
        if (res && res.token) {
          setToken(res.token);
        }
        return res;
      } catch {
        // Check registered demo users in localStorage first so saved phone and name are preserved!
        const savedUsers: User[] = JSON.parse(localStorage.getItem('ordershield_registered_users') || '[]');
        const savedUser = savedUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());

        // Find in demo personas or create customer
        const persona = Object.values(DEMO_USERS).find((p) => p.user.email.toLowerCase() === email.toLowerCase());
        const user: User = savedUser || (persona ? persona.user : {
          id: Math.floor(Math.random() * 1000) + 10,
          email,
          fullName: email.split('@')[0],
          role: 'ROLE_CUSTOMER',
          createdAt: new Date().toISOString(),
        });
        const token = `demo-token-${user.id}-${Date.now()}`;
        setToken(token);
        return { token, user };
      }
    },

    async register(data: { email: string; password: string; fullName: string; phone?: string }): Promise<AuthResponse> {
      try {
        const res = await request<AuthResponse>('/auth/register', {
          method: 'POST',
          body: JSON.stringify(data),
        });
        if (res && res.token) {
          setToken(res.token);
        }
        return res;
      } catch {
        const user: User = {
          id: Math.floor(Math.random() * 1000) + 20,
          email: data.email,
          fullName: data.fullName,
          phone: data.phone,
          role: 'ROLE_CUSTOMER',
          createdAt: new Date().toISOString(),
        };
        const token = `demo-token-${user.id}-${Date.now()}`;
        setToken(token);

        try {
          const savedUsers: User[] = JSON.parse(localStorage.getItem('ordershield_registered_users') || '[]');
          const idx = savedUsers.findIndex((u) => u.email.toLowerCase() === user.email.toLowerCase());
          if (idx >= 0) savedUsers[idx] = user;
          else savedUsers.push(user);
          localStorage.setItem('ordershield_registered_users', JSON.stringify(savedUsers));
        } catch {
          // ignore
        }

        return { token, user };
      }
    },

    async me(): Promise<User> {
      return await request<User>('/auth/me');
    },
  },

  // Products & Categories
  products: {
    async getAll(): Promise<Product[]> {
      try {
        const list = await request<Product[]>('/products');
        if (Array.isArray(list) && list.length > 0) {
          return list.map((p) => {
            const match = MOCK_PRODUCTS.find((m) => m.id === p.id || m.sku === p.sku);
            return match ? { ...p, imageUrl: match.imageUrl } : p;
          });
        }
        return localStore.products;
      } catch {
        return localStore.products;
      }
    },

    async getById(id: number): Promise<Product> {
      try {
        const prod = await request<Product>(`/products/${id}`);
        const match = MOCK_PRODUCTS.find((m) => m.id === prod.id || m.sku === prod.sku);
        return match ? { ...prod, imageUrl: match.imageUrl } : prod;
      } catch {
        const p = localStore.products.find((item) => item.id === id);
        if (!p) throw new Error('Product not found');
        return p;
      }
    },

    async getCategories(): Promise<Category[]> {
      try {
        return await request<Category[]>('/categories');
      } catch {
        return MOCK_CATEGORIES;
      }
    },

    async updateStock(id: number, stock: number): Promise<Product> {
      try {
        return await request<Product>(`/products/${id}/stock`, {
          method: 'PATCH',
          body: JSON.stringify({ stockQuantity: stock }),
        });
      } catch {
        const p = localStore.products.find((item) => item.id === id);
        if (p) p.stockQuantity = stock;
        return p!;
      }
    },
  },

  // Protected Addresses
  addresses: {
    async getProtectedAddresses(userEmail?: string): Promise<ProtectedAddress[]> {
      const emailLower = (userEmail || '').trim().toLowerCase();
      try {
        const url = userEmail ? `/shield/protected-addresses?ownerEmail=${encodeURIComponent(userEmail)}` : '/shield/protected-addresses';
        const list = await request<ProtectedAddress[]>(url);
        if (userEmail) {
          return list.filter((a) => {
            const owner = (a.ownerEmail || (a as any).owner?.email || '').toLowerCase();
            if (owner === emailLower) return true;
            if (emailLower === 'dhevesh@shield.com' && (owner.includes('dhevesh') || a.id === 102)) return true;
            return false;
          });
        }
        return list;
      } catch {
        if (userEmail) {
          return localStore.protectedAddresses.filter((a) => {
            const owner = (a.ownerEmail || (a as any).owner?.email || '').toLowerCase();
            if (owner === emailLower) return true;
            if (emailLower === 'dhevesh@shield.com' && (owner.includes('dhevesh') || a.id === 102)) return true;
            return false;
          });
        }
        return localStore.protectedAddresses;
      }
    },

    async registerProtectedAddress(data: Omit<ProtectedAddress, 'id' | 'verificationStatus' | 'registeredAt'>): Promise<ProtectedAddress> {
      try {
        const res = await request<ProtectedAddress>('/shield/protected-addresses', {
          method: 'POST',
          body: JSON.stringify(data),
        });
        localStore.protectedAddresses.push(res);
        localStore.save();
        return res;
      } catch {
        const newAddr: ProtectedAddress = {
          ...data,
          id: Date.now(),
          verificationStatus: 'VERIFIED',
          registeredAt: new Date().toISOString(),
        };
        localStore.protectedAddresses.push(newAddr);
        localStore.auditLogs.unshift({
          id: Date.now(),
          actorEmail: data.ownerEmail,
          action: 'PROTECTED_ADDRESS_REGISTERED',
          resourceType: 'PROTECTED_ADDRESS',
          resourceId: String(newAddr.id),
          details: `Registered ${newAddr.streetLine}, ${newAddr.city} as verified protected home address`,
          timestamp: new Date().toISOString(),
        });
        localStore.save();
        return newAddr;
      }
    },

    async deleteProtectedAddress(addressId: number, ownerEmail?: string): Promise<void> {
      try {
        await request(`/shield/protected-addresses/${addressId}`, { method: 'DELETE' });
      } catch {
        // Fallback for demo store
      }
      localStore.protectedAddresses = localStore.protectedAddresses.filter((a) => a.id !== addressId);
      localStore.trustedMembers = localStore.trustedMembers.filter((m) => m.protectedAddressId !== addressId);
      localStore.authRequests = localStore.authRequests.filter((r) => r.protectedAddressId !== addressId);
      if (ownerEmail) {
        localStore.auditLogs.unshift({
          id: Date.now(),
          actorEmail: ownerEmail,
          action: 'PROTECTED_ADDRESS_DELETED',
          resourceType: 'PROTECTED_ADDRESS',
          resourceId: String(addressId),
          details: `Deleted protected privacy address #${addressId}`,
          timestamp: new Date().toISOString(),
        });
      }
      localStore.save();
    },

    // Trusted Household Members
    async getTrustedMembers(addressId?: number): Promise<TrustedHouseholdMember[]> {
      try {
        const url = addressId ? `/shield/members?addressId=${addressId}` : '/shield/members';
        return await request<TrustedHouseholdMember[]>(url);
      } catch {
        if (addressId) {
          return localStore.trustedMembers.filter((m) => m.protectedAddressId === addressId);
        }
        return localStore.trustedMembers;
      }
    },

    async inviteMember(data: {
      protectedAddressId: number;
      memberPhone: string;
      memberName: string;
      memberEmail?: string;
      relationship?: string;
      ownerEmail: string;
    }): Promise<TrustedHouseholdMember> {
      try {
        return await request<TrustedHouseholdMember>('/shield/members/invite', {
          method: 'POST',
          body: JSON.stringify(data),
        });
      } catch {
        localStore.load();
        let addr = localStore.protectedAddresses.find((a) => Number(a.id) === Number(data.protectedAddressId));
        if (!addr && localStore.protectedAddresses.length > 0) {
          addr = localStore.protectedAddresses.find(
            (a) => a.ownerEmail && data.ownerEmail && a.ownerEmail.toLowerCase() === data.ownerEmail.toLowerCase()
          ) || localStore.protectedAddresses[0];
        }
        const targetAddressId = addr ? addr.id : (Number(data.protectedAddressId) || Date.now());
        const member: TrustedHouseholdMember = {
          id: Date.now(),
          protectedAddressId: targetAddressId,
          protectedAddressLabel: addr?.label || 'Protected Address',
          streetLine: addr ? `${addr.streetLine}, ${addr.city}` : '',
          memberPhone: data.memberPhone,
          memberEmail: data.memberEmail || `${data.memberPhone.replace(/\D/g, '')}@family.shield`,
          memberName: data.memberName,
          relationship: data.relationship || 'Authorized Family Member',
          status: 'ACTIVE', // Instantly active
          invitedAt: new Date().toISOString(),
          acceptedAt: new Date().toISOString(),
        };
        localStore.trustedMembers.push(member);
        localStore.auditLogs.unshift({
          id: Date.now(),
          actorEmail: data.ownerEmail,
          action: 'HOUSEHOLD_MEMBER_INVITED',
          resourceType: 'TRUSTED_MEMBER',
          resourceId: String(member.id),
          details: `Authorized ${data.memberName} (Mobile: ${data.memberPhone}) as trusted family member`,
          timestamp: new Date().toISOString(),
        });
        localStore.save();
        return member;
      }
    },

    async revokeMember(memberId: number, ownerEmail: string): Promise<void> {
      try {
        await request(`/shield/members/${memberId}/revoke`, { method: 'POST' });
      } catch {
        // fallback
      }
      localStore.load();
      const mem = localStore.trustedMembers.find((m) => m.id === memberId);
      if (mem) {
        mem.status = 'REVOKED';
        mem.revokedAt = new Date().toISOString();
        localStore.auditLogs.unshift({
          id: Date.now(),
          actorEmail: ownerEmail,
          action: 'HOUSEHOLD_MEMBER_REVOKED',
          resourceType: 'TRUSTED_MEMBER',
          resourceId: String(memberId),
          details: `Revoked household member access for ${mem.memberName || mem.memberPhone || mem.memberEmail}`,
          timestamp: new Date().toISOString(),
        });
        localStore.save();
      }
    },

    async grantMember(memberId: number, ownerEmail: string): Promise<void> {
      try {
        await request(`/shield/members/${memberId}/grant`, { method: 'POST' });
      } catch {
        // fallback
      }
      localStore.load();
      const mem = localStore.trustedMembers.find((m) => m.id === memberId);
      if (mem) {
        mem.status = 'ACTIVE';
        delete mem.revokedAt;
        mem.acceptedAt = new Date().toISOString();
        localStore.auditLogs.unshift({
          id: Date.now(),
          actorEmail: ownerEmail,
          action: 'HOUSEHOLD_MEMBER_GRANTED',
          resourceType: 'TRUSTED_MEMBER',
          resourceId: String(memberId),
          details: `Granted household delivery access to ${mem.memberName} (${mem.memberPhone || mem.memberEmail})`,
          timestamp: new Date().toISOString(),
        });
        localStore.save();
      }
    },

    async deleteMember(memberId: number, ownerEmail: string): Promise<void> {
      try {
        await request(`/shield/members/${memberId}`, { method: 'DELETE' });
      } catch {
        // fallback
      }
      localStore.load();
      const mem = localStore.trustedMembers.find((m) => m.id === memberId);
      localStore.trustedMembers = localStore.trustedMembers.filter((m) => m.id !== memberId);
      localStore.auditLogs.unshift({
        id: Date.now(),
        actorEmail: ownerEmail,
        action: 'HOUSEHOLD_MEMBER_DELETED',
        resourceType: 'TRUSTED_MEMBER',
        resourceId: String(memberId),
        details: `Deleted authorized household member ${mem ? mem.memberName : memberId} (${mem ? (mem.memberPhone || mem.memberEmail) : ''})`,
        timestamp: new Date().toISOString(),
      });
      localStore.save();
    },
  },

  // Orders & OrderShield Protection Evaluation
  orders: {
    async createOrder(payload: {
      user: User;
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
      items: { product: Product; quantity: number }[];
      totalAmount: number;
    }): Promise<{ order: Order; authorizationRequired: boolean; authorizationReason?: string }> {
      localStore.load();
      // 10-Minute Anti-Frustration Rejection Cooldown Check
      const cd = getActiveCooldown(
        payload.shippingAddress.streetLine,
        payload.shippingAddress.unit,
        payload.shippingAddress.city,
        payload.shippingAddress.postalCode
      );
      if (cd.active) {
        const m = Math.floor(cd.remainingSeconds / 60);
        const s = cd.remainingSeconds % 60;
        throw new Error(
          `Homeowner declined delivery to this address. A 10-minute anti-spam cooldown is active (${m}m ${s}s remaining). No notification was sent.`
        );
      }

      try {
        const backendBody = {
          shippingAddress: {
            fullName: payload.shippingAddress.fullName,
            streetLine: payload.shippingAddress.streetLine,
            unit: payload.shippingAddress.unit,
            city: payload.shippingAddress.city,
            state: payload.shippingAddress.state,
            postalCode: payload.shippingAddress.postalCode,
            country: payload.shippingAddress.country || 'United States',
            phone: payload.shippingAddress.phone,
          },
          items: payload.items.map((i) => ({
            productId: i.product.id,
            quantity: i.quantity,
          })),
        };

        const orderRes = await request<any>('/orders', {
          method: 'POST',
          body: JSON.stringify(backendBody),
        });

        const isBlocked = orderRes.status === 'PENDING_SECURITY_AUTHORIZATION' || orderRes.isDispatchBlocked === true;

        const matchedPa = findProtectedAddressMatch(
          payload.shippingAddress.streetLine,
          payload.shippingAddress.unit,
          payload.shippingAddress.city,
          payload.shippingAddress.postalCode
        );

        // Check if buyer is authorized household member
        const isHouseholdMemberLocal = matchedPa ? isAuthorizedHouseholdMember(matchedPa, {
          phone: payload.user.phone,
          shippingPhone: payload.shippingAddress.phone,
          fullName: payload.user.fullName,
          shippingFullName: payload.shippingAddress.fullName,
          email: payload.user.email,
        }) : false;

        if (isHouseholdMemberLocal) {
          return {
            order: {
              ...(orderRes as Order),
              status: 'PROCESSING',
              isDispatchBlocked: false,
              dispatchBlockedReason: undefined,
            },
            authorizationRequired: false,
          };
        }

        if (isBlocked && orderRes.authorizationRequestId) {
          const reqId = orderRes.authorizationRequestId;

          const ownerName = orderRes.ownerName || matchedPa?.ownerName || (matchedPa as any)?.owner?.fullName || 'Dhevesh';
          const ownerPhone = orderRes.ownerPhone || matchedPa?.phone || (matchedPa as any)?.owner?.phone || '+91 8122936210';
          const ownerEmail = orderRes.ownerEmail || matchedPa?.ownerEmail || (matchedPa as any)?.owner?.email || 'dhevesh@shield.com';
          const ownerId = orderRes.ownerId || matchedPa?.ownerId || (matchedPa as any)?.owner?.id || 10;
          const label = matchedPa?.label || payload.shippingAddress.streetLine || 'Protected Address';

          if (!localStore.authRequests.some((r) => r.id === reqId)) {
            const authReq: AuthorizationRequest = {
              id: reqId,
              orderId: orderRes.id,
              orderNumber: orderRes.orderNumber,
              protectedAddressId: matchedPa?.id || 102,
              protectedAddressLabel: label,
              ownerId,
              ownerName,
              ownerEmail,
              ownerPhone,
              buyerId: payload.user.id,
              buyerName: payload.user.fullName,
              buyerMaskedEmail: payload.user.email.replace(/(?<=.{2}).(?=.*@)/g, '*'),
              orderItemSummary: `${payload.items.reduce((acc, i) => acc + i.quantity, 0)} item(s) (${payload.items.map((i) => i.product.name).join(', ')})`,
              orderTotal: payload.totalAmount,
              status: 'PENDING',
              requestedAt: new Date().toISOString(),
            };
            localStore.authRequests.unshift(authReq);

            localStore.notifications.unshift({
              id: Date.now() + 2,
              userId: ownerId,
              userEmail: ownerEmail,
              type: 'SECURITY_ALERT',
              title: '🛡️ OrderShield Security Alert: Delivery Authorization Required',
              message: `An order for $${payload.totalAmount.toFixed(2)} (${authReq.orderItemSummary}) was placed to your protected address "${label}" by ${payload.user.fullName} (Phone: ${ownerPhone}). Do you allow or reject this order?`,
              isRead: false,
              relatedEntityId: reqId,
              createdAt: new Date().toISOString(),
            });
            localStore.save();
            window.dispatchEvent(new CustomEvent('ordershield_update', { detail: { requestId: reqId, status: 'PENDING' } }));
          }
        }

        return {
          order: orderRes as Order,
          authorizationRequired: isBlocked,
          authorizationReason: orderRes.dispatchBlockedReason,
        };
      } catch {
        // Fallback for offline/standalone mode
        // Robust check against localStore.protectedAddresses
        const matchedProtected = findProtectedAddressMatch(
          payload.shippingAddress.streetLine,
          payload.shippingAddress.unit,
          payload.shippingAddress.city,
          payload.shippingAddress.postalCode
        );

        let isBlocked = false;
        let orderStatus: Order['status'] = 'PROCESSING';
        let authReqId: number | undefined = undefined;
        let authReason: string | undefined = undefined;

        if (matchedProtected) {
          const ownerId = matchedProtected.ownerId || (matchedProtected as any).owner?.id || 10;
          const ownerName = matchedProtected.ownerName || (matchedProtected as any).owner?.fullName || 'Dhevesh';
          const ownerEmail = matchedProtected.ownerEmail || (matchedProtected as any).owner?.email || 'dhevesh@shield.com';
          const ownerPhone = matchedProtected.phone || (matchedProtected as any).owner?.phone || '+91 8122936210';

          const isOwner = payload.user.id === ownerId || payload.user.email.toLowerCase() === ownerEmail.toLowerCase();
          const isHouseholdMember = isAuthorizedHouseholdMember(matchedProtected, {
            phone: payload.user.phone,
            shippingPhone: payload.shippingAddress.phone,
            fullName: payload.user.fullName,
            shippingFullName: payload.shippingAddress.fullName,
            email: payload.user.email,
          });

          if (isOwner || isHouseholdMember) {
            // Owner order or Active trusted household member: Normal processing, zero friction, no alert!
            isBlocked = false;
            orderStatus = 'PROCESSING';
          } else {
            // Neither owner nor trusted member: TRIGGER ORDERSHIELD SECURITY!
            isBlocked = true;
            orderStatus = 'PENDING_SECURITY_AUTHORIZATION';
            authReqId = Date.now();
            authReason = `Address is protected by OrderShield owner ${ownerName}. Awaiting security authorization.`;

            // Create Authorization Request for Owner
            const authReq: AuthorizationRequest = {
              id: authReqId,
              orderId: Date.now() + 1,
              orderNumber: `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`,
              protectedAddressId: matchedProtected.id,
              protectedAddressLabel: matchedProtected.label,
              ownerId,
              ownerName,
              ownerEmail,
              ownerPhone,
              buyerId: payload.user.id,
              buyerName: payload.user.fullName,
              buyerMaskedEmail: payload.user.email.replace(/(?<=.{2}).(?=.*@)/g, '*'),
              orderItemSummary: `${payload.items.reduce((acc, i) => acc + i.quantity, 0)} item(s) (${payload.items.map((i) => i.product.name).join(', ')})`,
              orderTotal: payload.totalAmount,
              status: 'PENDING',
              requestedAt: new Date().toISOString(),
            };
            localStore.authRequests.unshift(authReq);

            const phoneText = ownerPhone ? ` (Phone: ${ownerPhone})` : '';

            // Push Notification to the Address Owner
            localStore.notifications.unshift({
              id: Date.now() + 2,
              userId: ownerId,
              userEmail: ownerEmail,
              type: 'SECURITY_ALERT',
              title: '🛡️ OrderShield Security Alert: Delivery Authorization Required',
              message: `An order for $${payload.totalAmount.toFixed(2)} (${authReq.orderItemSummary}) was placed to your protected address "${matchedProtected.label}" by ${payload.user.fullName}${phoneText}. Do you allow or reject this order?`,
              isRead: false,
              relatedEntityId: authReq.id,
              createdAt: new Date().toISOString(),
            });

            // Audit Log
            localStore.auditLogs.unshift({
              id: Date.now() + 3,
              actorEmail: payload.user.email,
              action: 'ORDER_AUTHORIZATION_TRIGGERED',
              resourceType: 'ORDER',
              resourceId: String(authReq.orderId),
              details: `Order placed to protected address ${matchedProtected.streetLine} by non-member. Dispatch blocked pending authorization.`,
              timestamp: new Date().toISOString(),
            });
          }
        }

        const newOrder: Order = {
          id: authReqId ? authReqId + 1 : Date.now(),
          orderNumber: `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          userId: payload.user.id,
          userEmail: payload.user.email,
          userName: payload.user.fullName,
          status: orderStatus,
          totalAmount: payload.totalAmount,
          isDispatchBlocked: isBlocked,
          dispatchBlockedReason: isBlocked ? authReason : undefined,
          shippingAddress: payload.shippingAddress,
          items: payload.items.map((i, idx) => ({
            id: idx + 1,
            productId: i.product.id,
            productName: i.product.name,
            productImageUrl: i.product.imageUrl,
            quantity: i.quantity,
            unitPrice: i.product.price,
            subtotal: i.product.price * i.quantity,
          })),
          authorizationRequestId: authReqId,
          createdAt: new Date().toISOString(),
        };

        // If authorization request was created, link exact orderId
        if (authReqId) {
          const req = localStore.authRequests.find((r) => r.id === authReqId);
          if (req) {
            req.orderId = newOrder.id;
            req.orderNumber = newOrder.orderNumber;
          }
        }

        localStore.orders.unshift(newOrder);
        localStore.save();

        window.dispatchEvent(new CustomEvent('ordershield_update', {
          detail: {
            requestId: authReqId,
            status: 'PENDING',
          }
        }));

        const ownerNameFinal = matchedProtected ? (matchedProtected.ownerName || (matchedProtected as any).owner?.fullName || 'Dhevesh') : 'Dhevesh';
        const ownerPhoneFinal = matchedProtected ? (matchedProtected.phone || (matchedProtected as any).owner?.phone || '+91 9876543210') : '+91 9876543210';

        return {
          order: {
            ...newOrder,
            ownerName: ownerNameFinal,
            ownerPhone: ownerPhoneFinal,
          } as any,
          authorizationRequired: isBlocked,
          authorizationReason: authReason,
        };
      }
    },

    async getMyOrders(userId: number): Promise<Order[]> {
      try {
        return await request<Order[]>(`/orders/my`);
      } catch {
        return localStore.orders.filter((o) => o.userId === userId);
      }
    },

    async getAllOrders(): Promise<Order[]> {
      try {
        return await request<Order[]>('/orders/all');
      } catch {
        return localStore.orders;
      }
    },

    async getOrderById(id: number): Promise<Order> {
      try {
        return await request<Order>(`/orders/${id}`);
      } catch {
        const ord = localStore.orders.find((o) => o.id === id);
        if (!ord) throw new Error('Order not found');
        return ord;
      }
    },

    async dispatchOrder(orderId: number, adminEmail: string): Promise<Order> {
      try {
        return await request<Order>(`/orders/${orderId}/dispatch`, { method: 'POST' });
      } catch {
        const order = localStore.orders.find((o) => o.id === orderId);
        if (!order) throw new Error('Order not found');
        if (order.isDispatchBlocked) {
          throw new Error('SECURITY VIOLATION: Cannot dispatch order while OrderShield authorization is pending or rejected!');
        }
        order.status = 'DISPATCHED';
        order.dispatchedAt = new Date().toISOString();

        localStore.auditLogs.unshift({
          id: Date.now(),
          actorEmail: adminEmail,
          action: 'ORDER_DISPATCHED',
          resourceType: 'ORDER',
          resourceId: String(orderId),
          details: `Order ${order.orderNumber} successfully dispatched to carrier`,
          timestamp: new Date().toISOString(),
        });
        localStore.save();
        return order;
      }
    },
  },

  // Security Authorization Requests
  security: {
    async getPendingRequests(ownerEmail: string): Promise<AuthorizationRequest[]> {
      let backendReqs: AuthorizationRequest[] = [];
      try {
        backendReqs = await request<AuthorizationRequest[]>('/shield/requests');
      } catch {
        // ignore
      }

      const emailLower = (ownerEmail || '').toLowerCase();
      const isDhevesh = emailLower.includes('dhevesh') || emailLower === 'dhevesh@shield.com';
      const localReqs = localStore.authRequests.filter((r) => {
        const reqOwnerEmail = (r.ownerEmail || '').toLowerCase();
        if (reqOwnerEmail && reqOwnerEmail === emailLower) return true;
        if (isDhevesh && (reqOwnerEmail.includes('dhevesh') || reqOwnerEmail === 'dhevesh@shield.com' || r.ownerId === 10 || !r.ownerEmail)) return true;
        return false;
      });

      const map = new Map<number, AuthorizationRequest>();
      backendReqs.forEach((r) => map.set(r.id, r));
      localReqs.forEach((r) => map.set(r.id, r));
      return Array.from(map.values()).sort(
        (a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
      );
    },

    async allowRequest(requestId: number, deciderEmail: string): Promise<{ status: string; otpCode: string; ownerPhone: string; request: AuthorizationRequest }> {
      try {
        const res = await request<AuthorizationRequest>(`/shield/requests/${requestId}/allow`, {
          method: 'POST',
        });
        // sync to local store
        const found = localStore.authRequests.find((r) => r.id === requestId);
        if (found) {
          found.status = 'OTP_SENT';
          found.otpCode = res.otpCode;
          found.ownerPhone = res.ownerPhone;
          found.decidedAt = new Date().toISOString();
        }
        // mark pending alert as resolved/allowed (do NOT spray new OTP notifications)
        localStore.notifications.forEach((n) => {
          if (n.relatedEntityId === requestId) {
            n.isRead = true;
            n.title = '🛡️ OrderShield Delivery Allowed';
            n.message = `You ALLOWED delivery for Order #${res.orderNumber || found?.orderNumber || 'ORD'}. Security OTP sent to your phone ${res.ownerPhone || found?.ownerPhone || '+91 8122936210'}.`;
          }
        });
        localStore.notifications = localStore.notifications.filter((n) => !n.title.includes('OTP Generated'));
        localStore.save();
        window.dispatchEvent(new CustomEvent('ordershield_update', { detail: { requestId, status: 'OTP_SENT', otpCode: res.otpCode } }));
        return {
          status: 'OTP_SENT',
          otpCode: res.otpCode || '',
          ownerPhone: res.ownerPhone || found?.ownerPhone || '+91 8122936210',
          request: res,
        };
      } catch {
        const req = localStore.authRequests.find((r) => r.id === requestId);
        if (!req) throw new Error('Authorization request not found');

        const otp = String(Math.floor(100000 + Math.random() * 900000));
        req.status = 'OTP_SENT';
        req.otpCode = otp;
        req.otpExpiresAt = new Date(Date.now() + 600000).toISOString();
        req.decidedAt = new Date().toISOString();
        req.decisionNotes = 'Homeowner approved delivery; 6-digit verification OTP generated.';

        const ownerPhone = req.ownerPhone || '+91 8122936210';

        // Update existing notification to allowed (do NOT create duplicate/sprayed OTP notifications)
        localStore.notifications.forEach((n) => {
          if (n.relatedEntityId === requestId) {
            n.isRead = true;
            n.title = '🛡️ OrderShield Delivery Allowed';
            n.message = `You ALLOWED delivery for Order #${req.orderNumber}. Security OTP sent to your phone ${ownerPhone}.`;
          }
        });
        localStore.notifications = localStore.notifications.filter((n) => !n.title.includes('OTP Generated'));

        // Audit Log
        localStore.auditLogs.unshift({
          id: Date.now() + 20,
          actorEmail: deciderEmail,
          action: 'DELIVERY_ALLOWED_OTP_GENERATED',
          resourceType: 'AUTHORIZATION_REQUEST',
          resourceId: String(requestId),
          details: `Homeowner generated delivery OTP (${otp}) sent to ${ownerPhone} for buyer ${req.buyerName} on order #${req.orderNumber}`,
          timestamp: new Date().toISOString(),
        });

        localStore.save();
        window.dispatchEvent(new CustomEvent('ordershield_update', { detail: { requestId, status: 'OTP_SENT', otpCode: otp } }));
        return {
          status: 'OTP_SENT',
          otpCode: otp,
          ownerPhone,
          request: req,
        };
      }
    },

    async rejectRequest(requestId: number, notes?: string, deciderEmail?: string): Promise<AuthorizationRequest> {
      localStore.load();
      // Record 10-Minute Anti-Frustration Rejection Cooldown
      const reqForCooldown = localStore.authRequests.find((r) => r.id === requestId);
      const paForCooldown = localStore.protectedAddresses.find((a) => a.id === reqForCooldown?.protectedAddressId);
      const streetForCooldown = paForCooldown?.streetLine || reqForCooldown?.protectedAddressLabel || '';
      addRejectionCooldown(
        streetForCooldown,
        paForCooldown?.unit,
        paForCooldown?.city,
        paForCooldown?.postalCode,
        reqForCooldown?.ownerEmail || deciderEmail,
        reqForCooldown?.buyerMaskedEmail
      );

      try {
        const res = await request<AuthorizationRequest>(`/shield/requests/${requestId}/reject`, {
          method: 'POST',
          body: JSON.stringify({ decision: 'REJECTED', notes }),
        });
        const found = localStore.authRequests.find((r) => r.id === requestId);
        if (found) {
          found.status = 'REJECTED';
          found.decisionNotes = notes || 'Declined by address owner';
          found.decidedAt = new Date().toISOString();
        }
        // Mark related security alerts as read
        localStore.notifications.forEach((n) => {
          if (n.relatedEntityId === requestId) {
            n.isRead = true;
          }
        });
        localStore.save();
        window.dispatchEvent(new CustomEvent('ordershield_update', { detail: { requestId, status: 'REJECTED' } }));
        return res;
      } catch {
        const req = localStore.authRequests.find((r) => r.id === requestId);
        if (!req) throw new Error('Authorization request not found');

        req.status = 'REJECTED';
        req.decidedAt = new Date().toISOString();
        req.decisionNotes = notes || 'Declined by address owner';

        const order = localStore.orders.find((o) => o.id === req.orderId);
        if (order) {
          order.status = 'AUTHORIZATION_REJECTED';
          order.isDispatchBlocked = true;
          order.dispatchBlockedReason = `Authorization rejected by address owner: ${notes || 'Declined by address owner'}`;

          // Notify buyer
          localStore.notifications.unshift({
            id: Date.now() + 10,
            userId: req.buyerId,
            type: 'ORDER_STATUS_UPDATE',
            title: '❌ OrderShield Delivery Declined',
            message: `Your order #${order.orderNumber} was declined by verified address owner ${req.ownerEmail || 'Homeowner'}. A 10-minute cooldown is active for this address to prevent notification spam.`,
            isRead: false,
            relatedEntityId: order.id,
            createdAt: new Date().toISOString(),
          });
        }

        // Mark related security alerts as read
        localStore.notifications.forEach((n) => {
          if (n.relatedEntityId === requestId) {
            n.isRead = true;
          }
        });

        localStore.auditLogs.unshift({
          id: Date.now() + 20,
          actorEmail: deciderEmail || req.ownerEmail,
          action: 'AUTHORIZATION_REJECTED',
          resourceType: 'AUTHORIZATION_REQUEST',
          resourceId: String(requestId),
          details: `Owner rejected delivery for order #${req.orderNumber}. Note: "${notes || 'Declined by address owner'}"`,
          timestamp: new Date().toISOString(),
        });

        localStore.save();
        window.dispatchEvent(new CustomEvent('ordershield_update', { detail: { requestId, status: 'REJECTED' } }));
        return req;
      }
    },

    async verifyOtp(requestId: number, otpCode: string, userEmail?: string): Promise<{ order: Order; request: AuthorizationRequest }> {
      localStore.load();
      try {
        const res = await request<AuthorizationRequest>(`/shield/requests/${requestId}/verify-otp`, {
          method: 'POST',
          body: JSON.stringify({ otpCode }),
        });
        const orderRes = await request<Order>(`/orders/${res.orderId}`);
        const found = localStore.authRequests.find((r) => r.id === requestId);
        if (found) {
          found.status = 'APPROVED';
          found.otpVerified = true;
          found.decidedAt = new Date().toISOString();
        }
        localStore.save();
        window.dispatchEvent(new CustomEvent('ordershield_update', { detail: { requestId, status: 'APPROVED' } }));
        return { order: orderRes, request: res };
      } catch (err: any) {
        localStore.load();
        // Check local store fallback
        const req = localStore.authRequests.find((r) => r.id === requestId);
        if (!req) throw new Error(err.message || 'Authorization request not found');

        if (req.status === 'APPROVED') {
          const ord = localStore.orders.find((o) => o.id === req.orderId);
          if (ord) return { order: ord, request: req };
        }

        if (req.status === 'PENDING') {
          throw new Error('Homeowner has not approved this delivery yet. Please wait for homeowner to click Allow in their notification.');
        }

        if (req.status === 'REJECTED') {
          throw new Error('Delivery request was declined by the homeowner.');
        }

        if (req.status !== 'OTP_SENT') {
          throw new Error(`Cannot verify OTP: Delivery request is in status ${req.status}`);
        }

        if (!req.otpCode) {
          throw new Error('Homeowner has not generated an OTP yet. Please wait for homeowner to click Allow.');
        }

        if (req.otpCode.trim() !== otpCode.trim()) {
          throw new Error('Invalid OTP. Please check the 6-digit code received on the homeowner’s phone number.');
        }

        req.otpVerified = true;
        req.status = 'APPROVED';
        req.decidedAt = new Date().toISOString();

        const order = localStore.orders.find((o) => o.id === req.orderId);
        if (order) {
          order.status = 'AUTHORIZATION_APPROVED';
          order.isDispatchBlocked = false;
          order.dispatchBlockedReason = undefined;

          // Notify buyer
          localStore.notifications.unshift({
            id: Date.now() + 10,
            userId: req.buyerId,
            type: 'ORDER_STATUS_UPDATE',
            title: '✅ Order Verified & Approved',
            message: `Your order #${order.orderNumber} to "${req.protectedAddressLabel}" was verified using the homeowner phone OTP. Order is queued for fulfillment!`,
            isRead: false,
            relatedEntityId: order.id,
            createdAt: new Date().toISOString(),
          });

          // Notify owner
          localStore.notifications.unshift({
            id: Date.now() + 11,
            userId: req.ownerId,
            type: 'SECURITY_ALERT',
            title: '🛡️ Delivery Verified via OTP',
            message: `Buyer ${req.buyerName} successfully verified delivery for order #${order.orderNumber} using your phone OTP.`,
            isRead: false,
            relatedEntityId: order.id,
            createdAt: new Date().toISOString(),
          });
        }

        localStore.auditLogs.unshift({
          id: Date.now() + 20,
          actorEmail: userEmail || req.buyerMaskedEmail,
          action: 'OTP_VERIFIED_ORDER_CONFIRMED',
          resourceType: 'ORDER',
          resourceId: String(req.orderId),
          details: `Order #${req.orderNumber} verified with valid homeowner OTP`,
          timestamp: new Date().toISOString(),
        });

        localStore.save();
        window.dispatchEvent(new CustomEvent('ordershield_update', { detail: { requestId, status: 'APPROVED' } }));
        return { order: order!, request: req };
      }
    },

    async getRequestStatus(requestId: number): Promise<{
      id: number;
      orderNumber: string;
      orderId: number;
      status: string;
      ownerName: string;
      ownerPhoneMasked: string;
      ownerPhone?: string;
      buyerName: string;
      otpCode?: string;
      isVerified: boolean;
      message: string;
    }> {
      localStore.load();
      try {
        return await request<any>(`/shield/requests/${requestId}/status`);
      } catch {
        localStore.load();
        const req = localStore.authRequests.find((r) => r.id === requestId);
        if (!req) throw new Error('Authorization request not found');

        const phone = req.ownerPhone || '+91 8122936210';
        const masked = phone.length > 4 ? `${phone.slice(0, 4)} **** ${phone.slice(-4)}` : '****';
        return {
          id: req.id,
          orderNumber: req.orderNumber,
          orderId: req.orderId,
          status: req.status,
          ownerName: (req as any).ownerName || 'Verified Owner',
          ownerPhoneMasked: masked,
          ownerPhone: phone,
          buyerName: req.buyerName,
          otpCode: req.otpCode,
          isVerified: Boolean(req.otpVerified),
          message: req.status === 'OTP_SENT'
            ? 'Homeowner has ALLOWED this delivery! Enter the 6-digit OTP sent to homeowner’s phone.'
            : (req.status === 'APPROVED' ? 'Order verified and approved.' : 'Waiting for homeowner authorization decision.'),
        };
      }
    },

    async decideRequest(requestId: number, decision: 'APPROVED' | 'REJECTED', notes: string, deciderEmail: string): Promise<AuthorizationRequest> {
      try {
        return await request<AuthorizationRequest>(`/shield/requests/${requestId}/decision`, {
          method: 'POST',
          body: JSON.stringify({ decision, notes }),
        });
      } catch {
        if (decision === 'APPROVED') {
          const res = await this.allowRequest(requestId, deciderEmail);
          return res.request;
        } else {
          return await this.rejectRequest(requestId, notes, deciderEmail);
        }
      }
    },

    async getAuditLogs(): Promise<AuditLog[]> {
      try {
        return await request<AuditLog[]>('/shield/audit-logs');
      } catch {
        return localStore.auditLogs;
      }
    },

    async deleteAuditLog(logId: number): Promise<void> {
      try {
        await request(`/shield/audit-logs/${logId}`, { method: 'DELETE' });
      } catch {
        // fallback
      }
      localStore.load();
      localStore.auditLogs = localStore.auditLogs.filter((l) => l.id !== logId);
      localStore.save();
    },

    async clearAuditLogs(ownerEmail?: string): Promise<void> {
      try {
        await request('/shield/audit-logs', { method: 'DELETE' });
      } catch {
        // fallback
      }
      localStore.load();
      localStore.auditLogs = [];
      localStore.save();
    },

    async evaluateAddress(address: {
      streetLine: string;
      unit?: string;
      city: string;
      state: string;
      postalCode: string;
      country?: string;
      phone?: string;
      fullName?: string;
    }): Promise<{
      isProtected: boolean;
      isOwner: boolean;
      isHouseholdMember: boolean;
      ownerDisplayName?: string;
      ownerPhone?: string;
      label?: string;
      reason: string;
    }> {
      localStore.load();
      let backendRes: any = null;
      try {
        backendRes = await request<any>('/shield/evaluate-address', {
          method: 'POST',
          body: JSON.stringify(address),
        });
      } catch {
        // fallback
      }

      const match = findProtectedAddressMatch(
        address.streetLine,
        address.unit,
        address.city,
        address.postalCode
      );

      if (!match && (!backendRes || !backendRes.isProtected)) {
        return {
          isProtected: false,
          isOwner: false,
          isHouseholdMember: false,
          reason: 'Standard unprotected address. Normal processing applies.',
        };
      }
      const activeUser = JSON.parse(localStorage.getItem('ordershield_active_user') || '{}');
      const rawOwnerEmail = (match ? (match.ownerEmail || (match as any).owner?.email) : backendRes?.ownerEmail) || 'dhevesh@shield.com';
      const ownerEmail = rawOwnerEmail.toLowerCase().includes('alice') ? 'dhevesh@shield.com' : rawOwnerEmail;
      const rawOwnerName = (match ? (match.ownerName || (match as any).owner?.fullName) : backendRes?.ownerDisplayName) || 'Dhevesh';
      const ownerName = (!rawOwnerName || rawOwnerName.toLowerCase().includes('alice')) ? 'Dhevesh' : rawOwnerName;
      let ownerPhone = (match ? (match.phone || (match as any).owner?.phone) : backendRes?.ownerPhone) || '+91 9876543210';
      if (ownerPhone.includes('555')) {
        ownerPhone = '+91 9876543210';
      }
      const label = (match ? match.label : backendRes?.label) || 'Protected Address';

      const isOwner = (activeUser.email || '').toLowerCase() === ownerEmail.toLowerCase();

      // Robust check using isAuthorizedHouseholdMember
      const isHousehold = match
        ? isAuthorizedHouseholdMember(match, {
            phone: activeUser.phone,
            shippingPhone: address.phone,
            fullName: activeUser.fullName,
            shippingFullName: address.fullName,
            email: activeUser.email,
          })
        : localStore.trustedMembers.some((m) => {
            if (m.status !== 'ACTIVE') return false;
            const cleanDigits = (p?: string) => (p || '').replace(/\D/g, '');
            const mPhone = cleanDigits(m.memberPhone);
            const userPhone = cleanDigits(address.phone) || cleanDigits(activeUser.phone);
            return (
              (mPhone && userPhone && (mPhone === userPhone || (mPhone.length >= 10 && userPhone.length >= 10 && mPhone.slice(-10) === userPhone.slice(-10)))) ||
              (m.memberEmail && activeUser.email && m.memberEmail.toLowerCase() === activeUser.email.toLowerCase()) ||
              (m.memberName && (address.fullName || activeUser.fullName) && m.memberName.toLowerCase().trim() === (address.fullName || activeUser.fullName || '').toLowerCase().trim())
            );
          });

      if (backendRes && backendRes.isProtected) {
        return {
          ...backendRes,
          isHouseholdMember: backendRes.isHouseholdMember || isHousehold,
          reason: backendRes.isOwner
            ? backendRes.reason
            : (backendRes.isHouseholdMember || isHousehold)
            ? 'Active Household Member — Instant Approval'
            : backendRes.reason,
        };
      }

      return {
        isProtected: true,
        isOwner,
        isHouseholdMember: isHousehold,
        ownerDisplayName: ownerName,
        ownerPhone,
        label,
        reason: isOwner
          ? 'Verified Owner Address — Instant Approval'
          : isHousehold
          ? 'Active Household Member — Instant Approval'
          : `Protected Address Detected — Owner Authorization Required by ${ownerName}`,
      };
    },
  },

  // Notifications
  notifications: {
    async getMyNotifications(userId: number, userEmail?: string): Promise<Notification[]> {
      let backendNotifs: Notification[] = [];
      try {
        backendNotifs = await request<Notification[]>('/notifications');
      } catch {
        // ignore
      }

      const emailLower = (userEmail || '').toLowerCase();
      const isDhevesh = emailLower.includes('dhevesh') || emailLower === 'dhevesh@shield.com';

      // 1. Auto-synchronize pending Authorization Requests:
      const deletedIds: Set<number> = new Set(
        JSON.parse(localStorage.getItem('ordershield_deleted_notifs') || '[]')
      );

      // If there are pending requests belonging to Dhevesh or the current user, ensure active unread notifications exist unless deleted!
      localStore.authRequests.forEach((req) => {
        const reqOwnerEmail = (req.ownerEmail || '').toLowerCase();
        const belongsToUser =
          reqOwnerEmail === emailLower ||
          (isDhevesh && (reqOwnerEmail.includes('dhevesh') || !reqOwnerEmail || req.ownerId === 10 || req.ownerId === userId));

        if (belongsToUser && !deletedIds.has(req.id)) {
          const existingNotif = localStore.notifications.find(
            (n) => n.relatedEntityId === req.id && n.type === 'SECURITY_ALERT' && !n.title.includes('OTP')
          );

          if (!existingNotif && req.status === 'PENDING') {
            const notifId = Date.now() + Math.floor(Math.random() * 1000);
            if (!deletedIds.has(notifId)) {
              localStore.notifications.unshift({
                id: notifId,
                userId: userId,
                userEmail: userEmail || req.ownerEmail,
                type: 'SECURITY_ALERT',
                title: '🛡️ OrderShield Security Alert: Delivery Authorization Required',
                message: `An order for $${req.orderTotal.toFixed(2)} (${req.orderItemSummary}) was placed to your protected address "${req.protectedAddressLabel}" by ${req.buyerName} (Phone: ${req.ownerPhone || '+91 8122936210'}). Do you allow or reject this order?`,
                isRead: false,
                relatedEntityId: req.id,
                createdAt: req.requestedAt || new Date().toISOString(),
              });
              localStore.save();
            }
          } else if (existingNotif) {
            // If the request was previously declined or approved, ensure the notification is marked read!
            if ((req.status === 'REJECTED' || req.status === 'APPROVED') && !existingNotif.isRead) {
              existingNotif.isRead = true;
              localStore.save();
            }
          }
        }
      });

      const localNotifs = localStore.notifications.filter((n) => {
        if (deletedIds.has(n.id) || (n.relatedEntityId && deletedIds.has(n.relatedEntityId))) return false;
        if (n.title.includes('OTP Generated')) return false;
        if (n.userId && n.userId === userId) return true;
        const notifEmail = ((n as any).userEmail || '').toLowerCase();
        if (emailLower && notifEmail && notifEmail === emailLower) return true;
        if (isDhevesh) {
          if (notifEmail.includes('dhevesh') || notifEmail === 'dhevesh@shield.com' || n.userId === 10 || n.type === 'SECURITY_ALERT') {
            return true;
          }
        }
        return false;
      });

      const map = new Map<number, Notification>();
      backendNotifs.forEach((n) => {
        if (!deletedIds.has(n.id) && !(n.relatedEntityId && deletedIds.has(n.relatedEntityId)) && !n.title.includes('OTP Generated')) {
          map.set(n.id, n);
        }
      });
      localNotifs.forEach((n) => {
        if (!deletedIds.has(n.id) && !(n.relatedEntityId && deletedIds.has(n.relatedEntityId)) && !n.title.includes('OTP Generated')) {
          map.set(n.id, n);
        }
      });
      return Array.from(map.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    },

    async markRead(id: number): Promise<void> {
      try {
        await request(`/notifications/${id}/read`, { method: 'POST' });
      } catch {
        const notif = localStore.notifications.find((n) => n.id === id);
        if (notif) {
          notif.isRead = true;
          localStore.save();
        }
      }
    },

    async clearAll(userId: number, userEmail?: string): Promise<void> {
      localStore.load();
      try {
        await request('/notifications/clear', { method: 'POST' });
      } catch {
        // ignore
      }

      const emailLower = (userEmail || '').toLowerCase();
      const isDhevesh = emailLower.includes('dhevesh') || emailLower === 'dhevesh@shield.com';

      // Save deleted IDs so background polling never brings them back
      const deletedIds: number[] = JSON.parse(localStorage.getItem('ordershield_deleted_notifs') || '[]');

      localStore.notifications.forEach((n) => {
        const notifEmail = ((n as any).userEmail || '').toLowerCase();
        const matches = n.userId === userId ||
          (emailLower && notifEmail && notifEmail === emailLower) ||
          (isDhevesh && (notifEmail.includes('dhevesh') || notifEmail === 'dhevesh@shield.com' || n.userId === 10 || n.type === 'SECURITY_ALERT'));

        if (matches) {
          deletedIds.push(n.id);
          if (n.relatedEntityId) {
            deletedIds.push(n.relatedEntityId);
          }
        }
      });

      localStorage.setItem('ordershield_deleted_notifs', JSON.stringify(Array.from(new Set(deletedIds))));

      // Purge from localStore
      localStore.notifications = localStore.notifications.filter((n) => {
        const notifEmail = ((n as any).userEmail || '').toLowerCase();
        if (n.userId && n.userId === userId) return false;
        if (emailLower && notifEmail && notifEmail === emailLower) return false;
        if (isDhevesh && (notifEmail.includes('dhevesh') || notifEmail === 'dhevesh@shield.com' || n.userId === 10 || n.type === 'SECURITY_ALERT')) {
          return false;
        }
        return true;
      });

      localStore.save();
      window.dispatchEvent(new CustomEvent('ordershield_update'));
    },

    async deleteNotification(id: number): Promise<void> {
      try {
        await request(`/notifications/${id}`, { method: 'DELETE' });
      } catch {
        // ignore
      }

      const deletedIds: number[] = JSON.parse(localStorage.getItem('ordershield_deleted_notifs') || '[]');
      deletedIds.push(id);
      const targetNotif = localStore.notifications.find((n) => n.id === id);
      if (targetNotif && targetNotif.relatedEntityId) {
        deletedIds.push(targetNotif.relatedEntityId);
      }
      localStorage.setItem('ordershield_deleted_notifs', JSON.stringify(Array.from(new Set(deletedIds))));

      localStore.notifications = localStore.notifications.filter((n) => n.id !== id);
      localStore.save();
      window.dispatchEvent(new CustomEvent('ordershield_update'));
    },
  },
};
