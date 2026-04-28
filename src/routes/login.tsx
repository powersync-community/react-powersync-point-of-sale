import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BoothLogin } from "@/components/auth/booth-login";
import { useAuth } from "@/contexts/auth-context";
import { useEffect } from "react";

function LoginPage() {
  const navigate = useNavigate();
  const { cashier } = useAuth();

  useEffect(() => {
    if (cashier) {
      navigate({ to: "/" });
    }
  }, [cashier, navigate]);

  return (
    <div className="h-full flex items-center justify-center p-4">
      <BoothLogin />
    </div>
  );
}

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

