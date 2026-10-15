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
}

interface ModeState {
  mode: AppMode;
  realClients: RealClient[];
  setMode: (mode: AppMode) => void;
  toggleMode: () => void;
  addRealClient: (client: Omit<RealClient, 'id' | 'lastAppointment' | 'nextAppointment' | 'hasDiet'>) => void;
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
}));
