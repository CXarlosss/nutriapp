import { create } from 'zustand';

export type AppMode = 'real' | 'demo';
export type PaymentMethod = 'cash' | 'bizum' | 'transfer' | 'stripe';

export interface ClientPaymentRecord {
  id: string;
  date: string;
  amountEur: number;
  method: PaymentMethod;
  periodDays: number;
  concept: string;
  notes?: string;
}

export interface RealClient {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  plan: string;
  status: 'Activo' | 'Pendiente de revisión' | 'Inactivo';
  lastAppointment: string;
  nextAppointment: string;
  hasDiet: boolean;
  createdAt?: string;
  daysInPlan?: number;
  paymentMethod?: PaymentMethod;
  lastPaymentAt?: string;
  renewalDate?: string;
  lastPaymentAmountEur?: number;
  paymentHistory?: ClientPaymentRecord[];
}

export const DEMO_CLIENTS: RealClient[] = [
  {
    id: 'c1',
    name: 'Marta Morales Sánchez',
    email: 'marta.morales@example.com',
    phone: '+34 611 223 344',
    plan: 'Plan Definición 8S',
    status: 'Activo',
    lastAppointment: '06 oct, 09:00',
    nextAppointment: '20 oct, 09:00',
    hasDiet: true,
    daysInPlan: 9,
    paymentMethod: 'bizum',
    lastPaymentAt: '06 oct 2026',
    renewalDate: '06 nov 2026',
    lastPaymentAmountEur: 79,
    paymentHistory: [
      { id: 'p-101', date: '06 oct 2026', amountEur: 79, method: 'bizum', periodDays: 30, concept: 'Renovación Mensual Plan Definición 8S', notes: 'Recibido por Bizum en consulta.' },
    ],
  },
  {
    id: 'c2',
    name: 'Carlos Gómez Pardo',
    email: 'carlos.paciente@example.com',
    phone: '+34 600 112 233',
    plan: 'Recomposición',
    status: 'Activo',
    lastAppointment: '29 sep, 11:30',
    nextAppointment: 'Sin agendar',
    hasDiet: true,
    daysInPlan: 12,
    paymentMethod: 'cash',
    lastPaymentAt: '29 sep 2026',
    renewalDate: '29 oct 2026',
    lastPaymentAmountEur: 79,
    paymentHistory: [
      { id: 'p-102', date: '29 sep 2026', amountEur: 79, method: 'cash', periodDays: 30, concept: 'Cobro en Efectivo Consulta Presencial', notes: 'Entregado en mano en clínica (0% comisión).' },
    ],
  },
  {
    id: 'c3',
    name: 'Lucía Fernández Díaz',
    email: 'lucia.fernandez@example.com',
    phone: '+34 622 334 455',
    plan: 'Pérdida de Grasa',
    status: 'Activo',
    lastAppointment: '15 sep, 16:00',
    nextAppointment: '13 oct, 16:00',
    hasDiet: true,
    daysInPlan: 14,
    paymentMethod: 'transfer',
    lastPaymentAt: '15 sep 2026',
    renewalDate: '15 oct 2026',
    lastPaymentAmountEur: 79,
    paymentHistory: [
      { id: 'p-103', date: '15 sep 2026', amountEur: 79, method: 'transfer', periodDays: 30, concept: 'Transferencia Bancaria SEPA', notes: 'Justificante comprobado.' },
    ],
  },
  {
    id: 'c4',
    name: 'Javier Navarro Soler',
    email: 'javier.navarro@example.com',
    phone: '+34 633 445 566',
    plan: 'Salud Intestinal',
    status: 'Pendiente de revisión',
    lastAppointment: 'Sin citas',
    nextAppointment: 'Sin agendar',
    hasDiet: false,
    daysInPlan: 3,
    paymentMethod: 'bizum',
    lastPaymentAt: 'Sin pagos',
    renewalDate: 'Pendiente de cobro',
    lastPaymentAmountEur: 79,
  },
  {
    id: 'c5',
    name: 'Elena Ramos Vidal',
    email: 'elena.ramos@example.com',
    phone: '+34 644 556 677',
    plan: 'Rendimiento Running',
    status: 'Activo',
    lastAppointment: '01 oct, 10:00',
    nextAppointment: '22 oct, 10:00',
    hasDiet: true,
    daysInPlan: 7,
    paymentMethod: 'stripe',
    lastPaymentAt: '01 oct 2026',
    renewalDate: '01 nov 2026',
    lastPaymentAmountEur: 79,
    paymentHistory: [
      { id: 'p-105', date: '01 oct 2026', amountEur: 79, method: 'stripe', periodDays: 30, concept: 'Suscripción Stripe Online', notes: 'Cobrado con tarjeta automática.' },
    ],
  },
  {
    id: 'c6',
    name: 'David Torres Marín',
    email: 'david.torres@example.com',
    phone: '+34 655 667 788',
    plan: 'Recomposición',
    status: 'Activo',
    lastAppointment: '24 sep, 17:00',
    nextAppointment: '24 oct, 17:00',
    hasDiet: true,
    daysInPlan: 10,
    paymentMethod: 'cash',
    lastPaymentAt: '24 sep 2026',
    renewalDate: '24 oct 2026',
    lastPaymentAmountEur: 79,
    paymentHistory: [
      { id: 'p-106', date: '24 sep 2026', amountEur: 79, method: 'cash', periodDays: 30, concept: 'Cobro en Efectivo en Consulta', notes: '0% comisiones.' },
    ],
  },
  {
    id: 'c7',
    name: 'Patricia Ortiz Cano',
    email: 'patricia.ortiz@example.com',
    phone: '+34 666 778 899',
    plan: 'Plan Definición 8S',
    status: 'Activo',
    lastAppointment: '10 oct, 09:30',
    nextAppointment: '27 oct, 09:30',
    hasDiet: true,
    daysInPlan: 5,
    paymentMethod: 'bizum',
    lastPaymentAt: '10 oct 2026',
    renewalDate: '10 nov 2026',
    lastPaymentAmountEur: 79,
  },
  {
    id: 'c8',
    name: 'Andrés Gil Velasco',
    email: 'andres.gil@example.com',
    phone: '+34 677 889 900',
    plan: 'Pérdida de Grasa',
    status: 'Inactivo',
    lastAppointment: '12 ago, 12:00',
    nextAppointment: 'Sin agendar',
    hasDiet: false,
    daysInPlan: 25,
    paymentMethod: 'stripe',
    lastPaymentAt: '12 ago 2026',
    renewalDate: 'Plan inactivo',
    lastPaymentAmountEur: 79,
  },
  // Alias de compatibilidad para id 'client-1'
  {
    id: 'client-1',
    name: 'Carlos Gómez Pardo',
    email: 'carlos.paciente@example.com',
    phone: '+34 600 112 233',
    plan: 'Recomposición',
    status: 'Activo',
    lastAppointment: '29 sep, 11:30',
    nextAppointment: 'Sin agendar',
    hasDiet: true,
    daysInPlan: 12,
    paymentMethod: 'cash',
    lastPaymentAt: '29 sep 2026',
    renewalDate: '29 oct 2026',
    lastPaymentAmountEur: 79,
    paymentHistory: [
      { id: 'p-102-b', date: '29 sep 2026', amountEur: 79, method: 'cash', periodDays: 30, concept: 'Cobro en Efectivo Consulta Presencial', notes: 'Entregado en mano en clínica (0% comisión).' },
    ],
  },
];

function getClientOverrides(): Record<string, Partial<RealClient>> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem('nutriapp_client_overrides');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function findClientById(id: string, realClients?: RealClient[]): RealClient | null {
  if (!id) return null;

  const overrides = getClientOverrides();
  const getMerged = (client: RealClient | null) => {
    if (!client) return null;
    const ov = overrides[client.id] || (client.id === 'client-1' ? overrides['c2'] : undefined) || (client.id === 'c2' ? overrides['client-1'] : undefined);
    return ov ? { ...client, ...ov } : client;
  };

  // 1. Buscar primero en los clientes reales pasados por prop/estado
  if (realClients && realClients.length > 0) {
    const found = realClients.find((c) => c.id === id);
    if (found) return getMerged(found);
  }

  // 2. Buscar en localStorage de clientes reales
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('nutriapp_real_clients');
      if (saved) {
        const parsed: RealClient[] = JSON.parse(saved);
        const match = parsed.find((c) => c.id === id);
        if (match) return getMerged(match);
      }
    } catch {
      // Ignorar error de lectura de localStorage
    }
  }

  // 3. Buscar en el catálogo de clientes demo
  const foundDemo = DEMO_CLIENTS.find((c) => c.id === id);
  if (foundDemo) return getMerged(foundDemo);

  // 4. Aliases para Carlos Gómez Pardo
  if (id === 'client-1' || id === 'c2') {
    const aliasMatch = DEMO_CLIENTS.find((c) => c.id === 'client-1') || null;
    return getMerged(aliasMatch);
  }

  return null;
}

interface ModeState {
  mode: AppMode;
  realClients: RealClient[];
  setMode: (mode: AppMode) => void;
  toggleMode: () => void;
  addRealClient: (client: Omit<RealClient, 'id' | 'lastAppointment' | 'nextAppointment' | 'hasDiet'>) => void;
  updateRealClient: (id: string, updates: Partial<RealClient>) => void;
  recordClientPayment: (
    clientId: string,
    payment: {
      method: PaymentMethod;
      amountEur: number;
      periodDays: number;
      notes?: string;
    }
  ) => void;
  getClient: (id: string) => RealClient | undefined;
}

const STORAGE_KEY = 'nutriapp_app_mode';
const CLIENTS_STORAGE_KEY = 'nutriapp_real_clients';

// Obtener modo inicial seguro para SSR (por defecto 'demo' para exploración inicial y tests E2E)
function getInitialMode(): AppMode {
  if (typeof window === 'undefined') return 'demo';
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'real' ? 'real' : 'demo';
  } catch {
    return 'demo';
  }
}

function getInitialRealClients(): RealClient[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(CLIENTS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export const useModeStore = create<ModeState>((set, get) => ({
  mode: getInitialMode(),
  realClients: getInitialRealClients(),

  setMode: (mode: AppMode) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, mode);
      } catch (e) {
        console.warn('No se pudo guardar nutriapp_app_mode:', e);
      }
    }
    set({ mode });
  },

  toggleMode: () => {
    const nextMode: AppMode = get().mode === 'demo' ? 'real' : 'demo';
    get().setMode(nextMode);
  },

  addRealClient: (clientData) => {
    const newClient: RealClient = {
      id: `client_${Date.now()}`,
      name: clientData.name,
      email: clientData.email,
      phone: clientData.phone,
      plan: clientData.plan,
      status: clientData.status,
      lastAppointment: 'Sin citas',
      nextAppointment: 'Sin agendar',
      hasDiet: false,
      createdAt: new Date().toISOString(),
    };

    const updated = [newClient, ...get().realClients];
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('No se pudieron guardar los clientes reales:', e);
      }
    }
    set({ realClients: updated });
  },

  updateRealClient: (id, updates) => {
    const updated = get().realClients.map((c) => (c.id === id ? { ...c, ...updates } : c));
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('No se pudieron actualizar los clientes reales:', e);
      }
    }
    set({ realClients: updated });
  },

  recordClientPayment: (clientId, payment) => {
    const renewalDateObj = new Date(Date.now() + payment.periodDays * 24 * 60 * 60 * 1000);
    const formattedRenewal = renewalDateObj.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const nowFormatted = new Date().toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    const newRecord: ClientPaymentRecord = {
      id: `p-${Date.now()}`,
      date: nowFormatted,
      amountEur: payment.amountEur,
      method: payment.method,
      periodDays: payment.periodDays,
      concept: `Cobro ${payment.method.toUpperCase()} (${payment.periodDays}d)`,
      notes: payment.notes || 'Registrado en consulta sin comisiones.',
    };

    const client = findClientById(clientId, get().realClients);
    const existingHistory = client?.paymentHistory || [];

    const updates: Partial<RealClient> = {
      status: 'Activo',
      paymentMethod: payment.method,
      lastPaymentAt: nowFormatted,
      renewalDate: formattedRenewal,
      lastPaymentAmountEur: payment.amountEur,
      paymentHistory: [newRecord, ...existingHistory],
    };

    // 1. Guardar en overrides para demo y persistencia
    if (typeof window !== 'undefined') {
      try {
        const overrides = getClientOverrides();
        overrides[clientId] = { ...(overrides[clientId] || {}), ...updates };
        if (clientId === 'client-1') overrides['c2'] = overrides[clientId];
        if (clientId === 'c2') overrides['client-1'] = overrides[clientId];
        localStorage.setItem('nutriapp_client_overrides', JSON.stringify(overrides));
      } catch (e) {
        console.warn('Error guardando overrides de clientes:', e);
      }
    }

    // 2. Si existe en realClients, actualizarlo en la lista
    const isReal = get().realClients.some((c) => c.id === clientId);
    if (isReal) {
      get().updateRealClient(clientId, updates);
    } else {
      // Disparar re-render forzando cambio en Zustand
      set({ realClients: [...get().realClients] });
    }
  },

  getClient: (id: string) => {
    return findClientById(id, get().realClients) || undefined;
  },
}));
