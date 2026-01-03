import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PinLogin } from "@/components/auth/pin-login";
import { useAuth } from "@/contexts/auth-context";
import { useEffect } from "react";

/**
 * Login route component
 * Redirects to main POS if already authenticated
 */
function LoginPage() {
  const navigate = useNavigate();
  const { cashier } = useAuth();

  // Redirect to main page if already logged in
  useEffect(() => {
    if (cashier) {
      navigate({ to: "/" });
    }
  }, [cashier, navigate]);

  return (
    <div className="h-full flex items-center justify-center p-4">
      <PinLogin />
    </div>
  );
}

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

