
export type ItemType = 'service' | 'product';

export interface Service {
  id: string;
  name: string;
  price: number;
  durationMinutes: number; // 0 for products
  description?: string;
  type: ItemType;
  commissionRate?: number; 
  imageUrl?: string;
  costPrice?: number;
  stock?: number;
}

export interface Package {
  id: string;
  name: string;
  description: string;
  price: number;
  monthlyLimit: number;
  serviceIds: string[];
}

export interface Subscriber {
  id: string;
  name: string;
  phone: string;
  packageId: string;
  barberId: string | 'any';
  startDate: string;
  dueDay: number;
  status: 'active' | 'expiring' | 'overdue' | 'inactive' | 'pending';
  lastPaymentAmount?: number;
  lastPaymentDate?: string;
  notes?: string;
}

export interface Barber {
  id: string;
  name: string;
  description?: string;
  photoUrl: string;
  phone: string;
  commissionRates: {
    service: number;
    product: number;
    subscription: number;
  };
  active: boolean;
  username?: string;
  password?: string;
}

export interface ClientAccount {
    id: string;
    name: string;
    phone: string;
    password?: string;
    birthDate?: string;
    photoUrl?: string;
    xp: number;
    level: number;
    totalAppointments: number;
    joinedAt: string;
    referralCount?: number;
}

export interface LevelConfig {
    xpPerService: number;
    levels: number[];
}

export interface WaitlistEntry {
    id: string;
    clientName: string;
    clientPhone: string;
    serviceId: string;
    barberId: string;
    date: string; // Desired date
    createdAt: string;
}

export interface Notification {
    id: string;
    clientId?: string; // If null, system wide or admin
    title: string;
    message: string;
    read: boolean;
    createdAt: string;
    type: 'info' | 'success' | 'warning';
}

export interface Review {
    id: string;
    clientName: string;
    rating: number;
    comment: string;
    date: string;
}

// --- NEW INTERFACE FOR BLOCKS ---
export interface BlockedTime {
    id: string;
    barberId: string | 'all'; // Can block for everyone or specific barber
    type: 'single' | 'recurring'; // Single date or weekly recurrence
    scope: 'day' | 'slot'; // Entire day or specific time range
    date?: string; // Required if type is 'single' (YYYY-MM-DD)
    weekDay?: number; // Required if type is 'recurring' (0-6, Sunday-Saturday)
    startTime?: string; // Required if scope is 'slot' (HH:MM)
    endTime?: string; // Required if scope is 'slot' (HH:MM)
    reason?: string;
}

export type PaymentMethod = 'money' | 'pix' | 'card' | 'other';

export interface Appointment {
  id: string;
  serviceId: string;
  barberId: string;
  date: string;
  time: string;
  client: { name: string; phone: string };
  clientId?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'blocked';
  totalPrice: number;
  finalPrice?: number;
  discount?: number;
  tip?: number;
  paymentMethod?: PaymentMethod;
  notes?: string;
  createdAt: string;
}