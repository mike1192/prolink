import { createFileRoute, Navigate } from "@tanstack/react-router";
import { AuthPage } from "@/components/AuthPage";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/auth")({
  component: AuthRoute,
  head: () => ({
    meta: [{ title: "Connexion — ProjectLink" }],
  }),
});

function AuthRoute() {
  const { user, loading } = useAuth();

  // Si l'utilisateur est déjà connecté, rediriger vers son profil
  if (!loading && user) {
    return <Navigate to="/u/$username" params={{ username: user.username }} />;
  }

  // Afficher un loading pendant la vérification
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  return <AuthPage />;
}
