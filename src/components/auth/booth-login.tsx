import { useState, useCallback, useRef, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, RefreshCw, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { generateFunnyName } from "@/lib/funny-names";
import { cn } from "@/lib/utils";

export function BoothLogin() {
  const navigate = useNavigate();
  const { loginWithName, isAuthenticating, error, clearError } = useAuth();
  const [name, setName] = useState(() => generateFunnyName());
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleRegenerate = useCallback(() => {
    setName(generateFunnyName());
    clearError();
  }, [clearError]);

  const handleLogin = useCallback(async () => {
    if (!name.trim()) return;
    const success = await loginWithName(name);
    if (success) navigate({ to: "/" });
  }, [name, loginWithName, navigate]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        event.preventDefault();
        setIsEditing(false);
        handleLogin();
      }
      if (event.key === "Escape") {
        event.preventDefault();
        setIsEditing(false);
      }
    },
    [handleLogin]
  );

  return (
    <div className="w-full max-w-2xl">
      <div className="flex items-center justify-between mb-16">
        <div className="flex items-center gap-3">
          <img
            src="/icons/powersync-logo.png"
            alt="PowerSync"
            className="h-7 w-7 object-contain opacity-90"
          />
          <span className="text-[10px] font-medium uppercase tracking-[0.3em] text-muted-foreground">
            powersync · pos
          </span>
        </div>
        <Link
          to="/active-sales"
          className="group flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.3em] text-muted-foreground hover:text-primary transition-colors"
        >
          live feed
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      <div className="mb-3">
        <span className="text-[10px] font-medium uppercase tracking-[0.3em] text-muted-foreground">
          your booth alias
        </span>
      </div>

      <div className="relative mb-2 group">
        {isEditing ? (
          <input
            ref={inputRef}
            value={name}
            onChange={(e) => {
              clearError();
              setName(e.target.value);
            }}
            onBlur={() => setIsEditing(false)}
            onKeyDown={handleKeyDown}
            maxLength={50}
            disabled={isAuthenticating}
            className="w-full bg-transparent border-0 text-4xl md:text-6xl font-bold tracking-tight text-foreground focus:outline-none caret-primary px-0 py-3 pr-14"
          />
        ) : (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="text-left w-full text-4xl md:text-6xl font-bold tracking-tight text-foreground py-3 pr-14 truncate"
          >
            {name || (
              <span className="text-muted-foreground/40">type a name</span>
            )}
          </button>
        )}
        <button
          type="button"
          onClick={handleRegenerate}
          disabled={isAuthenticating}
          aria-label="Generate a new name"
          className="absolute right-0 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center disabled:opacity-50"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
        <div className="h-px bg-gradient-to-r from-primary via-primary/40 to-transparent" />
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground mb-12">
        <span>tap the name to edit · or shuffle for a new one</span>
      </div>

      {error && (
        <div className="text-destructive text-sm mb-6">{error}</div>
      )}

      <button
        onClick={handleLogin}
        disabled={isAuthenticating || !name.trim()}
        className={cn(
          "w-full h-16 bg-primary text-primary-foreground transition-all flex items-center justify-between px-6 group",
          "hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none",
          "text-lg font-semibold tracking-tight"
        )}
      >
        <span>
          {isAuthenticating ? "signing in…" : "step up to the counter"}
        </span>
        {isAuthenticating ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
        )}
      </button>
    </div>
  );
}
