import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'superadmin' | 'admin';
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
}

const API_BASE_URL = 'http://localhost:3003/api';

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      token: null,
      
      login: async (email: string, password: string) => {
        try {
          const response = await fetch(`${API_BASE_URL}/admin/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });

          const data = await response.json();

          if (data.success && data.token) {
            const user: User = {
              id: data.user.id,
              email: data.user.email,
              name: data.user.name,
              role: data.user.role
            };
            
            set({ 
              user, 
              isAuthenticated: true, 
              token: data.token 
            });
            return true;
          }
          
          return false;
        } catch (error) {
          console.error('Erreur lors de la connexion:', error);
          return false;
        }
      },
      
      checkAuth: async () => {
        const { token } = get();
        
        if (!token) {
          set({ user: null, isAuthenticated: false, token: null });
          return false;
        }

        try {
          const response = await fetch(`${API_BASE_URL}/admin/auth/verify`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          const data = await response.json();

          if (data.success && data.user) {
            const user: User = {
              id: data.user.id,
              email: data.user.email,
              name: data.user.name,
              role: data.user.role
            };
            
            set({ user, isAuthenticated: true });
            return true;
          } else {
            set({ user: null, isAuthenticated: false, token: null });
            return false;
          }
        } catch (error) {
          console.error('Erreur lors de la vérification du token:', error);
          set({ user: null, isAuthenticated: false, token: null });
          return false;
        }
      },
      
      logout: async () => {
        const { token } = get();
        
        if (token) {
          try {
            await fetch(`${API_BASE_URL}/admin/auth/logout`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });
          } catch (error) {
            console.error('Erreur lors de la déconnexion:', error);
          }
        }
        
        set({ user: null, isAuthenticated: false, token: null });
      }
    }),
    {
      name: 'superadmin-auth',
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated,
        token: state.token
      }),
    }
  )
);