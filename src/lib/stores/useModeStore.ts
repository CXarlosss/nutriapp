import { create } from 'zustand';

export type AppMode = 'real' | 'demo';

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
}

export const DEMO_CLIENTS: RealClient[] = [
  { id: 'c1', name: 'Marta Morales Sánchez', email: 'marta.morales@example.com', phone: '+34 611 223 344', plan: 'Plan Definición 8S', status: 'Activo', lastAppointment: '06 oct, 09:00', nextAppointment: '20 oct, 09:00', hasDiet: true, daysInPlan: 9 },
  { id: 'c2', name: 'Carlos Gómez Pardo', email: 'carlos.paciente@example.com', phone: '+34 600 112 233', plan: 'Recomposición', status: 'Activo', lastAppointment: '29 sep, 11:30', nextAppointment: 'Sin agendar', hasDiet: true, daysInPlan: 12 },
  { id: 'c3', name: 'Lucía Fernández Díaz', email: 'lucia.fernandez@example.com', phone: '+34 622 334 455', plan: 'Pérdida de Grasa', status: 'Activo', lastAppointment: '15 sep, 16:00', nextAppointment: '13 oct, 16:00', hasDiet: true, daysInPlan: 14 },
  { id: 'c4', name: 'Javier Navarro Soler', email: 'javier.navarro@example.com', phone: '+34 633 445 566', plan: 'Salud Intestinal', status: 'Pendiente de revisión', lastAppointment: 'Sin citas', nextAppointment: 'Sin agendar', hasDiet: false, daysInPlan: 3 },
  { id: 'c5', name: 'Elena Ramos Vidal', email: 'elena.ramos@example.com', phone: '+34 644 556 677', plan: 'Rendimiento Running', status: 'Activo', lastAppointment: '01 oct, 10:00', nextAppointment: '22 oct, 10:00', hasDiet: true, daysInPlan: 7 },
  { id: 'c6', name: 'David Torres Marín', email: 'david.torres@example.com', phone: '+34 655 667 788', plan: 'Recomposición', status: 'Activo', lastAppointment: '24 sep, 17:00', nextAppointment: '24 oct, 17:00', hasDiet: true, daysInPlan: 10 },
  { id: 'c7', name: 'Patricia Ortiz Cano', email: 'patricia.ortiz@example.com', phone: '+34 666 778 899', plan: 'Plan Definición 8S', status: 'Activo', lastAppointment: '10 oct, 09:30', nextAppointment: '27 oct, 09:30', hasDiet: true, daysInPlan: 5 },
  { id: 'c8', name: 'Andrés Gil Velasco', email: 'andres.gil@example.com', phone: '+34 677 889 900', plan: 'Pérdida de Grasa', status: 'Inactivo', lastAppointment: '12 ago, 12:00', nextAppointment: 'Sin agendar', hasDiet: false, daysInPlan: 25 },
  // Alias de compatibilidad para id 'client-1'
  { id: 'client-1', name: 'Carlos Gómez Pardo', email: 'carlos.paciente@example.com', phone: '+34 600 112 233', plan: 'Recomposición', status: 'Activo', lastAppointment: '29 sep, 11:30', nextAppointment: 'Sin agendar', hasDiet: true, daysInPlan: 12 },
];

export function findClientById(id: string, realClients?: RealClient[]): RealClient | null {
  if (!id) return null;

  // 1. Buscar primero en los clientes reales pasados por prop/estado
  if (realClients && realClients.length > 0) {
    const found = realClients.find((c) => c.id === id);
    if (found) return found;
  }

  // 2. Buscar en localStorage de clientes reales
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('nutriapp_real_clients');
      if (saved) {
        const parsed: RealClient[] = JSON.parse(saved);
        const match = parsed.find((c) => c.id === id);
        if (match) return match;
      }
    } catch {
      // Ignorar error de lectura de localStorage
    }
  }

  // 3. Buscar en el catálogo de clientes demo
  const foundDemo = DEMO_CLIENTS.find((c) => c.id === id);
  if (foundDemo) return foundDemo;

  // 4. Aliases para Carlos Gómez Pardo
  if (id === 'client-1' || id === 'c2') {
    return DEMO_CLIENTS.find((c) => c.id === 'client-1') || null;
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
  getClient: (id: string) => RealClient | undefined;
}

const STORAGE_KEY = 'nutriapp_app_mode';
const CLIENTS_STORAGE_KEY = 'nutriapp_real_clients';

// Obtener modo inicial seguro para SSR
function getInitialMode(): AppMode {
  if (typeof window === 'undefined') return 'real';
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'demo' ? 'demo' : 'real';
  } catch {
    return 'real';
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

  getClient: (id: string) => {
    return findClientById(id, get().realClients) || undefined;
  },
}));
