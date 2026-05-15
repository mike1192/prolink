import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getCurrentUser, type Profile } from "@/lib/api";
import { toast } from "sonner";

interface AuthCtx {
  user: Profile | null;
  token: string | null;
  loading: boolean;
  openLogin: () => void;
  closeLogin: () => void;
  loginOpen: boolean;
  signOut: () => void;
  setUser: (user: Profile | null) => void;
  setToken: (token: string | null) => void;
}

const AuthContext = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginOpen, setLoginOpen] = useState(false);

  const setToken = (newToken: string | null) => {
    setTokenState(newToken);
    if (newToken) {
      localStorage.setItem("auth_token", newToken);
    } else {
      localStorage.removeItem("auth_token");
    }
  };

  useEffect(() => {
    // Check for existing token on mount
    const existingToken = localStorage.getItem("auth_token");
    if (existingToken) {
      setTokenState(existingToken);
      getCurrentUser(existingToken)
        .then((userData) => {
          console.log("Auth: User loaded from token:", userData);
          setUser(userData);
        })
        .catch(() => {
          // Token is invalid, clear it
          console.log("Auth: Invalid token, clearing");
          localStorage.removeItem("auth_token");
          setTokenState(null);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      console.log("Auth: No token found");
      setLoading(false);
    }
  }, []);

  const signOut = () => {
    console.log("Auth: Signing out, clearing user and token");
    setUser(null);
    setToken(null);
    toast.success("Déconnecté avec succès");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        openLogin: () => setLoginOpen(true),
        closeLogin: () => setLoginOpen(false),
        loginOpen,
        signOut,
        setUser,
        setToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
