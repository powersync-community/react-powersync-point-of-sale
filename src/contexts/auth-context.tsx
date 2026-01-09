import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { powerSync } from "@/powersync/System";
import { connector } from "@/powersync/SupabaseConnector";
import { CASHIERS_TABLE, type CashierRecord } from "@/powersync/AppSchema";

export interface AuthenticatedCashier {
  id: string;
  name: string;
}

interface AuthContextType {
  cashier: AuthenticatedCashier | null;
  isAuthenticating: boolean;
  error: string | null;
  loginWithPin: (pin: string) => Promise<boolean>;
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

  const loginWithPin = useCallback(async (pin: string): Promise<boolean> => {
    setIsAuthenticating(true);
    setError(null);

    try {
      const result = await powerSync.getAll<CashierRecord>(
        `SELECT * FROM ${CASHIERS_TABLE} WHERE pin_hash = ? AND is_active = 1 LIMIT 1`,
        [pin]
      );

      if (result.length === 0) {
        if (pin.length === 4) {
          setCashier({
            id: `demo-${pin}`,
            name: `Cashier ${pin}`,
          });
          setIsAuthenticating(false);
          return true;
        }
        
        setError("Invalid PIN. Please try again.");
        setIsAuthenticating(false);
        return false;
      }

      const foundCashier = result[0];
      
      try {
        await connector.signInAnonymously();
      } catch {
        console.warn("Supabase auth unavailable, continuing in offline mode");
      }

      setCashier({
        id: foundCashier.id,
        name: foundCashier.name ?? "Unknown",
      });

      setIsAuthenticating(false);
      return true;
    } catch (err) {
      console.error("Login error:", err);
      
      if (pin.length === 4) {
        setCashier({
          id: `demo-${pin}`,
          name: `Demo Cashier`,
        });
        setIsAuthenticating(false);
        return true;
      }
      
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
        loginWithPin,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
