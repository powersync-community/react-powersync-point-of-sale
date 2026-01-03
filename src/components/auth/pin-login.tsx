import { useState, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Delete, LogIn, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";

const PIN_LENGTH = 4;

/**
 * PIN Login component
 * Displays numeric keypad for cashier authentication
 */
export function PinLogin() {
  const navigate = useNavigate();
  const { loginWithPin, isAuthenticating, error, clearError } = useAuth();
  const [pin, setPin] = useState("");

  /** Handle digit press */
  const handleDigit = useCallback(
    (digit: string) => {
      if (pin.length < PIN_LENGTH) {
        clearError();
        setPin((prev) => prev + digit);
      }
    },
    [pin.length, clearError]
  );

  /** Handle backspace */
  const handleBackspace = useCallback(() => {
    setPin((prev) => prev.slice(0, -1));
    clearError();
  }, [clearError]);

  /** Handle clear */
  const handleClear = useCallback(() => {
    setPin("");
    clearError();
  }, [clearError]);

  /** Handle login attempt */
  const handleLogin = useCallback(async () => {
    if (pin.length !== PIN_LENGTH) return;

    const success = await loginWithPin(pin);
    if (success) {
      navigate({ to: "/" });
    } else {
      setPin("");
    }
  }, [pin, loginWithPin, navigate]);

  /** Keypad digits */
  const digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "clear", "0", "back"];

  return (
    <Card className="w-full max-w-md bg-gradient-to-b from-card to-background border-2 border-border shadow-2xl">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto mb-4 h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/30">
          <LogIn className="h-8 w-8 text-white" />
        </div>
        <CardTitle className="text-2xl">Enter PIN</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Enter your 4-digit cashier PIN to continue
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* PIN Display */}
        <div className="flex justify-center gap-3">
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-14 w-14 rounded-xl border-2 flex items-center justify-center transition-all duration-200",
                i < pin.length
                  ? "border-primary bg-primary/10"
                  : "border-border bg-background"
              )}
            >
              {i < pin.length && (
                <div className="h-4 w-4 rounded-full bg-primary animate-fade-in" />
              )}
            </div>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="text-center text-destructive text-sm animate-fade-in">
            {error}
          </div>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3">
          {digits.map((digit) => {
            if (digit === "clear") {
              return (
                <Button
                  key={digit}
                  variant="ghost"
                  size="xl"
                  onClick={handleClear}
                  disabled={isAuthenticating || pin.length === 0}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Clear
                </Button>
              );
            }

            if (digit === "back") {
              return (
                <Button
                  key={digit}
                  variant="ghost"
                  size="xl"
                  onClick={handleBackspace}
                  disabled={isAuthenticating || pin.length === 0}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Delete className="h-6 w-6" />
                </Button>
              );
            }

            return (
              <Button
                key={digit}
                variant="secondary"
                size="xl"
                onClick={() => handleDigit(digit)}
                disabled={isAuthenticating || pin.length >= PIN_LENGTH}
                className="text-2xl font-bold h-16 hover:bg-secondary/80 active:scale-95 transition-all"
              >
                {digit}
              </Button>
            );
          })}
        </div>

        {/* Login Button */}
        <Button
          size="xl"
          className="w-full h-14 text-lg font-semibold"
          onClick={handleLogin}
          disabled={isAuthenticating || pin.length !== PIN_LENGTH}
        >
          {isAuthenticating ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Authenticating...
            </>
          ) : (
            <>
              <LogIn className="mr-2 h-5 w-5" />
              Sign In
            </>
          )}
        </Button>

        {/* Demo Info */}
        <div className="text-center text-xs text-muted-foreground border-t border-border pt-4">
          <p>Demo PINs: 1234, 5678, 9012</p>
        </div>
      </CardContent>
    </Card>
  );
}

