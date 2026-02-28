import { Service, Barber, Appointment, Package, Subscriber, ClientAccount, LevelConfig, WaitlistEntry, Notification, Review, BlockedTime } from '../types';

const KEYS = {
  SERVICES: 'barberpro_services',
  BARBERS: 'barberpro_barbers',
  APPOINTMENTS: 'barberpro_appointments',
  PACKAGES: 'barberpro_packages',
  SUBSCRIBERS: 'barberpro_subscribers',
  CLIENTS: 'barberpro_clients',
  LEVEL_CONFIG: 'barberpro_level_config',
  WAITLIST: 'barberpro_waitlist',
  NOTIFICATIONS: 'barberpro_notifications',
  REVIEWS: 'barberpro_reviews',
  BLOCKED_TIMES: 'barberpro_blocked_times'
};

// Seed Data
const INITIAL_SERVICES: Service[] = [
  { id: 's1', name: 'Corte + Barba', price: 70, durationMinutes: 60, description: 'Combo completo: corte masculino e barba.', type: 'service', imageUrl: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&q=80&w=200' },
  { id: 's2', name: 'Corte Masculino', price: 45, durationMinutes: 30, description: 'Corte tradicional masculino com acabamento na máquina e tesoura.', type: 'service', imageUrl: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&q=80&w=200' },
  { id: 's3', name: 'Barba', price: 30, durationMinutes: 30, description: 'Barba completa com navalha e toalha quente.', type: 'service', imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b7f300?auto=format&fit=crop&q=80&w=200' },
  { id: 's4', name: 'Pezinho / Acabamento', price: 15, durationMinutes: 15, description: 'Apenas o acabamento do corte.', type: 'service', imageUrl: 'https://images.unsplash.com/photo-1512690459411-b9245aed614b?auto=format&fit=crop&q=80&w=200' },
];

const INITIAL_PACKAGES: Package[] = [
    { id: 'pkg1', name: 'Rei da Barbearia', description: 'Cortes ilimitados.', price: 149.90, monthlyLimit: 99, serviceIds: ['s2'] },
    { id: 'pkg2', name: 'Barba de Respeito', description: '4 Barbas por mês.', price: 99.90, monthlyLimit: 4, serviceIds: ['s3'] },
];

const INITIAL_REVIEWS: Review[] = [
    { id: 'r1', clientName: 'Cristyan Hoffmann', rating: 5, comment: 'Gostei do espaço! Profissionais excelentes.', date: '2024-02-10' },
    { id: 'r2', clientName: 'João Silva', rating: 5, comment: 'Melhor degradê da região.', date: '2024-02-12' },
    { id: 'r3', clientName: 'Pedro Santos', rating: 4, comment: 'Ótimo atendimento, só atrasou um pouquinho.', date: '2024-02-14' },
];

const INITIAL_BARBERS: Barber[] = [
  { 
    id: 'b1', 
    name: 'Carlos Silva', 
    description: 'Especialista em cortes clássicos.',
    photoUrl: 'https://images.unsplash.com/photo-1583900985737-6d1e13025682?auto=format&fit=crop&q=80&w=200', 
    phone: '11999999999', 
    commissionRates: { service: 50, product: 20, subscription: 10 },
    active: true, 
    username: 'carlos', 
    password: '123' 
  },
  { 
    id: 'b2', 
    name: 'Marcos Oliveira', 
    description: 'Mestre em degradês e platinados.',
    photoUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=200', 
    phone: '11988888888', 
    commissionRates: { service: 45, product: 15, subscription: 5 },
    active: true, 
    username: 'marcos', 
    password: '123' 
  },
];

const INITIAL_LEVEL_CONFIG: LevelConfig = {
    xpPerService: 100,
    levels: [100, 300, 600, 1000, 1500, 2100, 2800, 3600, 5000] 
};

export const storage = {
  getServices: (): Service[] => {
    const data = localStorage.getItem(KEYS.SERVICES);
    return data ? JSON.parse(data) : INITIAL_SERVICES;
  },
  saveServices: (services: Service[]) => {
    localStorage.setItem(KEYS.SERVICES, JSON.stringify(services));
  },
  
  getPackages: (): Package[] => {
    const data = localStorage.getItem(KEYS.PACKAGES);
    return data ? JSON.parse(data) : INITIAL_PACKAGES;
  },
  savePackages: (packages: Package[]) => {
    localStorage.setItem(KEYS.PACKAGES, JSON.stringify(packages));
  },

  getSubscribers: (): Subscriber[] => {
    const data = localStorage.getItem(KEYS.SUBSCRIBERS);
    return data ? JSON.parse(data) : [];
  },
  saveSubscribers: (subscribers: Subscriber[]) => {
    localStorage.setItem(KEYS.SUBSCRIBERS, JSON.stringify(subscribers));
  },

  getBarbers: (): Barber[] => {
    const data = localStorage.getItem(KEYS.BARBERS);
    const barbers = data ? JSON.parse(data) : INITIAL_BARBERS;
    return barbers;
  },
  saveBarbers: (barbers: Barber[]) => {
    localStorage.setItem(KEYS.BARBERS, JSON.stringify(barbers));
  },

  getAppointments: (): Appointment[] => {
    const data = localStorage.getItem(KEYS.APPOINTMENTS);
    return data ? JSON.parse(data) : [];
  },
  saveAppointment: (appointment: Appointment) => {
    const appointments = storage.getAppointments();
    appointments.push(appointment);
    localStorage.setItem(KEYS.APPOINTMENTS, JSON.stringify(appointments));
  },
  updateAppointments: (appointments: Appointment[]) => {
    localStorage.setItem(KEYS.APPOINTMENTS, JSON.stringify(appointments));
  },

  // --- Gamification & Clients ---
  getClients: (): ClientAccount[] => {
      const data = localStorage.getItem(KEYS.CLIENTS);
      return data ? JSON.parse(data) : [];
  },
  saveClients: (clients: ClientAccount[]) => {
      localStorage.setItem(KEYS.CLIENTS, JSON.stringify(clients));
  },
  updateClient: (updatedClient: ClientAccount) => {
      const clients = storage.getClients();
      const newClients = clients.map(c => c.id === updatedClient.id ? updatedClient : c);
      storage.saveClients(newClients);
      // Update session if it's the current user
      const session = sessionStorage.getItem('clientSession');
      if (session) {
          const current = JSON.parse(session);
          if (current.id === updatedClient.id) {
              sessionStorage.setItem('clientSession', JSON.stringify(updatedClient));
          }
      }
  },
  
  getLevelConfig: (): LevelConfig => {
      const data = localStorage.getItem(KEYS.LEVEL_CONFIG);
      return data ? JSON.parse(data) : INITIAL_LEVEL_CONFIG;
  },
  saveLevelConfig: (config: LevelConfig) => {
      localStorage.setItem(KEYS.LEVEL_CONFIG, JSON.stringify(config));
  },

  // --- Reviews ---
  getReviews: (): Review[] => {
      const data = localStorage.getItem(KEYS.REVIEWS);
      return data ? JSON.parse(data) : INITIAL_REVIEWS;
  },
  addReview: (review: Review) => {
      const reviews = storage.getReviews();
      reviews.push(review);
      localStorage.setItem(KEYS.REVIEWS, JSON.stringify(reviews));
  },

  // --- Waitlist ---
  getWaitlist: (): WaitlistEntry[] => {
      const data = localStorage.getItem(KEYS.WAITLIST);
      return data ? JSON.parse(data) : [];
  },
  addToWaitlist: (entry: WaitlistEntry) => {
      const list = storage.getWaitlist();
      list.push(entry);
      localStorage.setItem(KEYS.WAITLIST, JSON.stringify(list));
  },
  removeFromWaitlist: (id: string) => {
      const list = storage.getWaitlist().filter(w => w.id !== id);
      localStorage.setItem(KEYS.WAITLIST, JSON.stringify(list));
  },
  
  // --- AUTOMATIC WAITLIST LOGIC ---
  checkWaitlistAfterCancellation: (cancelledApp: Appointment) => {
      // 1. Get Waitlist matching Date
      const waitlist = storage.getWaitlist()
        .filter(w => w.date === cancelledApp.date)
        // 2. Sort by creation (FIFO - First In First Out)
        .sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      
      const services = storage.getServices();

      for (const entry of waitlist) {
          // Check Barber preference
          if (entry.barberId !== 'any' && entry.barberId !== cancelledApp.barberId) continue;
          
          // Check if Service Duration fits in the cancelled slot
          const entryService = services.find(s => s.id === entry.serviceId);
          if (!entryService) continue;

          // Check availability for this specific waitlist entry in the freed slot
          // We assume the cancelled slot time is the target.
          // Note: isTimeSlotAvailable checks ALL appointments, and since we just cancelled 'cancelledApp', 
          // that slot should be free unless duration causes overlap with next app.
          const isAvailable = storage.isTimeSlotAvailable(
              cancelledApp.barberId, 
              cancelledApp.date, 
              cancelledApp.time, 
              entryService.durationMinutes
          );

          if (isAvailable) {
              // --- AUTOMATIC BOOKING ---
              const newApp: Appointment = {
                  id: crypto.randomUUID(),
                  serviceId: entry.serviceId,
                  barberId: cancelledApp.barberId, // Assign to the barber who had the cancellation
                  date: cancelledApp.date,
                  time: cancelledApp.time,
                  client: { name: entry.clientName, phone: entry.clientPhone },
                  status: 'confirmed',
                  totalPrice: entryService.price,
                  notes: 'Agendamento automático via Lista de Espera',
                  createdAt: new Date().toISOString()
              };

              storage.saveAppointment(newApp);
              storage.removeFromWaitlist(entry.id);

              // Notify System/Admin
              storage.addNotification({
                  id: crypto.randomUUID(),
                  title: 'Lista de Espera Ativada',
                  message: `Agendamento automático realizado para ${entry.clientName} às ${cancelledApp.time}.`,
                  read: false,
                  createdAt: new Date().toISOString(),
                  type: 'success'
              });

              // In a real app, we would send SMS/WhatsApp here
              console.log(`Auto-booked ${entry.clientName} from waitlist`);
              
              // Only fill one slot per cancellation
              return; 
          }
      }
  },

  // --- Notifications ---
  getNotifications: (clientId: string): Notification[] => {
      const data = localStorage.getItem(KEYS.NOTIFICATIONS);
      const all: Notification[] = data ? JSON.parse(data) : [];
      return all.filter(n => n.clientId === clientId || !n.clientId).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  addNotification: (notification: Notification) => {
      const data = localStorage.getItem(KEYS.NOTIFICATIONS);
      const all: Notification[] = data ? JSON.parse(data) : [];
      all.push(notification);
      localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(all));
  },

  // --- Blocked Times ---
  getBlockedTimes: (): BlockedTime[] => {
      const data = localStorage.getItem(KEYS.BLOCKED_TIMES);
      return data ? JSON.parse(data) : [];
  },
  saveBlockedTime: (blocked: BlockedTime) => {
      const all = storage.getBlockedTimes();
      all.push(blocked);
      localStorage.setItem(KEYS.BLOCKED_TIMES, JSON.stringify(all));
  },
  removeBlockedTime: (id: string) => {
      const all = storage.getBlockedTimes().filter(b => b.id !== id);
      localStorage.setItem(KEYS.BLOCKED_TIMES, JSON.stringify(all));
  },

  // Helper to add XP
  awardXpToClient: (clientId: string) => {
      const clients = storage.getClients();
      const config = storage.getLevelConfig();
      
      const updatedClients = clients.map(client => {
          if (client.id === clientId) {
              const newXp = client.xp + config.xpPerService;
              let newLevel = client.level;
              
              for (let i = config.levels.length - 1; i >= 0; i--) {
                  if (newXp >= config.levels[i]) {
                      newLevel = i + 2; 
                      break;
                  }
              }
              if (newXp < config.levels[0]) newLevel = 1;

              return {
                  ...client,
                  xp: newXp,
                  level: Math.max(client.level, newLevel), 
                  totalAppointments: client.totalAppointments + 1
              };
          }
          return client;
      });
      storage.saveClients(updatedClients);
  },

  isTimeSlotAvailable: (barberId: string, date: string, time: string, durationMinutes: number): boolean => {
    // 1. Check if blocked by rules (BlockedTime)
    const blockedTimes = storage.getBlockedTimes();
    const checkDateObj = new Date(date + 'T00:00:00'); // Ensure local date logic matches
    const weekDay = checkDateObj.getDay(); // 0-6
    const timeToMinutes = (t: string) => {
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
    };
    const reqStart = timeToMinutes(time);
    const reqEnd = reqStart + durationMinutes;

    for (const rule of blockedTimes) {
        // Filter by Barber
        if (rule.barberId !== 'all' && rule.barberId !== barberId) continue;

        // Check Date matching (Single vs Recurring)
        let dateMatch = false;
        if (rule.type === 'single') {
            dateMatch = rule.date === date;
        } else if (rule.type === 'recurring') {
            dateMatch = rule.weekDay === weekDay;
        }

        if (!dateMatch) continue;

        // Check Scope (Day vs Slot)
        if (rule.scope === 'day') {
            return false; // Whole day blocked
        } else if (rule.scope === 'slot' && rule.startTime && rule.endTime) {
            const ruleStart = timeToMinutes(rule.startTime);
            const ruleEnd = timeToMinutes(rule.endTime);
            // Overlap check
            if (reqStart < ruleEnd && reqEnd > ruleStart) {
                return false;
            }
        }
    }

    // 2. Check existing Appointments
    const appointments = storage.getAppointments().filter(
      a => a.barberId === barberId && a.date === date && a.status !== 'cancelled'
    );
    
    return !appointments.some(app => {
      const services = storage.getServices();
      const service = services.find(s => s.id === app.serviceId);
      const appDuration = service ? service.durationMinutes : 30;
      const existingStart = timeToMinutes(app.time);
      const existingEnd = existingStart + appDuration;
      return (reqStart < existingEnd && reqEnd > existingStart);
    });
  },

  exportData: () => {
    return JSON.stringify({
      services: JSON.parse(localStorage.getItem(KEYS.SERVICES) || '[]'),
      packages: JSON.parse(localStorage.getItem(KEYS.PACKAGES) || '[]'),
      subscribers: JSON.parse(localStorage.getItem(KEYS.SUBSCRIBERS) || '[]'),
      barbers: JSON.parse(localStorage.getItem(KEYS.BARBERS) || '[]'),
      appointments: JSON.parse(localStorage.getItem(KEYS.APPOINTMENTS) || '[]'),
      clients: JSON.parse(localStorage.getItem(KEYS.CLIENTS) || '[]'),
      levelConfig: JSON.parse(localStorage.getItem(KEYS.LEVEL_CONFIG) || '{}'),
      blockedTimes: JSON.parse(localStorage.getItem(KEYS.BLOCKED_TIMES) || '[]'),
      exportedAt: new Date().toISOString()
    }, null, 2);
  },

  importData: (jsonString: string) => {
    try {
      const data = JSON.parse(jsonString);
      if (data.services) localStorage.setItem(KEYS.SERVICES, JSON.stringify(data.services));
      if (data.packages) localStorage.setItem(KEYS.PACKAGES, JSON.stringify(data.packages));
      if (data.subscribers) localStorage.setItem(KEYS.SUBSCRIBERS, JSON.stringify(data.subscribers));
      if (data.barbers) localStorage.setItem(KEYS.BARBERS, JSON.stringify(data.barbers));
      if (data.appointments) localStorage.setItem(KEYS.APPOINTMENTS, JSON.stringify(data.appointments));
      if (data.clients) localStorage.setItem(KEYS.CLIENTS, JSON.stringify(data.clients));
      if (data.levelConfig) localStorage.setItem(KEYS.LEVEL_CONFIG, JSON.stringify(data.levelConfig));
      if (data.blockedTimes) localStorage.setItem(KEYS.BLOCKED_TIMES, JSON.stringify(data.blockedTimes));
      return true;
    } catch (e) {
      return false;
    }
  }
};