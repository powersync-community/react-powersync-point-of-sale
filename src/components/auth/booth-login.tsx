import { useState, useCallback } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Activity, LogIn, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/auth-context";
import { generateFunnyName } from "@/lib/funny-names";

export function BoothLogin() {
  const navigate = useNavigate();
  const { loginWithName, isAuthenticating, error, clearError } = useAuth();
  const [name, setName] = useState(() => generateFunnyName());

  const handleRegenerate = useCallback(() => {
    setName(generateFunnyName());
    clearError();
  }, [clearError]);

  const handleNameChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      clearError();
      setName(event.target.value);
    },
    [clearError]
  );

  const handleLogin = useCallback(async () => {
    if (!name.trim()) return;
    const success = await loginWithName(name);
    if (success) {
      navigate({ to: "/" });
    }
  }, [name, loginWithName, navigate]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        event.preventDefault();
        handleLogin();
      }
    },
    [handleLogin]
  );

  return (
    <Card className="w-full max-w-md bg-gradient-to-b from-card to-background border-2 border-border shadow-2xl">
      <CardHeader className="text-center pb-2">
        <img
          src="/icons/powersync-logo.png"
          alt="PowerSync"
          className="mx-auto mb-4 h-16 w-16 object-contain"
        />
        <CardTitle className="text-2xl">Welcome to the booth</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Pick a name (or roll a new one) and start an order
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label
            htmlFor="cashier-name"
            className="text-sm font-medium text-muted-foreground"
          >
            Your name
          </label>
          <div className="flex gap-2">
            <Input
              id="cashier-name"
              value={name}
              onChange={handleNameChange}
              onKeyDown={handleKeyDown}
              placeholder="tame-llama"
              autoFocus
              maxLength={50}
              disabled={isAuthenticating}
              className="h-12 text-lg font-medium"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRegenerate}
              disabled={isAuthenticating}
              aria-label="Generate a new name"
              className="h-12 w-12 shrink-0"
            >
              <RefreshCw className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {error && (
          <div className="text-center text-destructive text-sm animate-fade-in">
            {error}
          </div>
        )}

        <Button
          size="xl"
          className="w-full h-14 text-lg font-semibold"
          onClick={handleLogin}
          disabled={isAuthenticating || !name.trim()}
        >
          {isAuthenticating ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              <LogIn className="mr-2 h-5 w-5" />
              Sign In
            </>
          )}
        </Button>

        <div className="text-center">
          <Link
            to="/active-sales"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <Activity className="h-4 w-4" />
            View live sales activity
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
