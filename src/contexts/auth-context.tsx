import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { powerSync } from "@/powersync/System";
import { connector } from "@/powersync/SupabaseConnector";
import { CASHIERS_TABLE, type CashierRecord } from "@/powersync/AppSchema";

/** Authenticated cashier information */
export interface AuthenticatedCashier {
  id: string;
  name: string;
}

/** Auth context state and methods */
interface AuthContextType {
  /** Currently authenticated cashier, null if not logged in */
  cashier: AuthenticatedCashier | null;
  /** Whether authentication is in progress */
  isAuthenticating: boolean;
  /** Authentication error message if any */
  error: string | null;
  /** Authenticate with PIN */
  loginWithPin: (pin: string) => Promise<boolean>;
  /** Log out current cashier */
  logout: () => Promise<void>;
  /** Clear any auth errors */
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

/**
 * Hook to access auth context
 * @throws Error if used outside AuthProvider
 */
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

/**
 * Auth Provider component
 * Manages cashier authentication state with PIN validation
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [cashier, setCashier] = useState<AuthenticatedCashier | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Authenticate cashier with PIN
   * Validates against local SQLite database (synced from server)
   */
  const loginWithPin = useCallback(async (pin: string): Promise<boolean> => {
    setIsAuthenticating(true);
    setError(null);

    try {
      // Query local database for cashier with matching PIN
      // In production, you would use proper PIN hashing
      const result = await powerSync.getAll<CashierRecord>(
        `SELECT * FROM ${CASHIERS_TABLE} WHERE pin_hash = ? AND is_active = 1 LIMIT 1`,
        [pin]
      );

      if (result.length === 0) {
        // For demo mode without backend, allow any 4-digit PIN
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
      
      // Try to ensure Supabase session is active (anonymous auth)
      try {
        await connector.signInAnonymously();
      } catch {
        // Continue without Supabase - works offline
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
      
      // For demo mode, allow login even if DB query fails
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

  /**
   * Log out current cashier
   */
  const logout = useCallback(async () => {
    setCashier(null);
    setError(null);
  }, []);

  /**
   * Clear authentication errors
   */
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

