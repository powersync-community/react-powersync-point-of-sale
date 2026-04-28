import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { powerSync } from "@/powersync/System";
import { connector } from "@/powersync/SupabaseConnector";
import { CASHIERS_TABLE } from "@/powersync/AppSchema";
import { generateId } from "@/lib/utils";

export interface AuthenticatedCashier {
  id: string;
  name: string;
}

interface AuthContextType {
  cashier: AuthenticatedCashier | null;
  isAuthenticating: boolean;
  error: string | null;
  loginWithName: (name: string) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [cashier, setCashier] = useState<AuthenticatedCashier | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loginWithName = useCallback(async (name: string): Promise<boolean> => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Please enter a name to continue.");
      return false;
    }

    setIsAuthenticating(true);
    setError(null);

    try {
      try {
        await connector.signInAnonymously();
      } catch {
        console.warn("Supabase auth unavailable, continuing in offline mode");
      }

      const id = generateId();
      const now = new Date().toISOString();

      await powerSync.execute(
        `INSERT INTO ${CASHIERS_TABLE} (id, name, pin_hash, is_active, created_at) VALUES (?, ?, ?, 1, ?)`,
        [id, trimmedName, `demo-${id.slice(0, 8)}`, now]
      );

      setCashier({ id, name: trimmedName });
      setIsAuthenticating(false);
      return true;
    } catch (err) {
      console.error("Login error:", err);
      setError("An error occurred during login. Please try again.");
      setIsAuthenticating(false);
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    setCashier(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        cashier,
        isAuthenticating,
        error,
        loginWithName,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
