'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { clientAuthApi } from './api';

interface ClientUser {
  client_id: number;
  name: string;
  company_name: string;
  email: string;
}

interface ClientAuthContextType {
  client: ClientUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const ClientAuthContext = createContext<ClientAuthContextType | undefined>(undefined);

export function ClientAuthProvider({ children }: { children: ReactNode }) {
  const [client, setClient] = useState<ClientUser | null>(() => {
    if (typeof window === 'undefined') return null;
    const token = localStorage.getItem('client_token');
    const clientData = localStorage.getItem('client_user');
    if (!token || !clientData) return null;
    try {
      return JSON.parse(clientData) as ClientUser;
    } catch {
      localStorage.removeItem('client_token');
      localStorage.removeItem('client_user');
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await clientAuthApi.login(email, password);

      if (response.error) {
        return { success: false, error: response.error };
      }

      const data = response.data;
      if (!data || !data.token) {
        return { success: false, error: 'No token received' };
      }

      // Store the client token (overwrite the admin token for client session)
      localStorage.setItem('client_token', data.token);
      localStorage.setItem('token', data.token);

      const clientUser: ClientUser = {
        client_id: data.client_id,
        name: data.name,
        company_name: data.company_name,
        email,
      };
      localStorage.setItem('client_user', JSON.stringify(clientUser));
      setClient(clientUser);

      router.push('/client-dashboard');
      return { success: true };
    } catch {
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const logout = () => {
    localStorage.removeItem('client_token');
    localStorage.removeItem('client_user');
    localStorage.removeItem('token');
    setClient(null);
    router.push('/client-login');
  };

  return (
    <ClientAuthContext.Provider value={{ client, loading, login, logout }}>
      {children}
    </ClientAuthContext.Provider>
  );
}

export function useClientAuth() {
  const context = useContext(ClientAuthContext);
  if (context === undefined) {
    throw new Error('useClientAuth must be used within a ClientAuthProvider');
  }
  return context;
}
