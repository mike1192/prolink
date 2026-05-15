import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { signupUser, loginUser } from "@/lib/api";
import { toast } from "sonner";
import { Sparkles, ArrowLeft } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

export function SimpleAuthPage() {
  const { setUser, setToken } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("=== SOUMISSION ===");
    console.log("Mode:", mode);
    console.log("Email:", email);
    console.log("Password length:", password.length);

    setLoading(true);

    try {
      if (mode === "signin") {
        console.log("Connexion en cours...");
        const response = await loginUser(email, password);
        console.log("Réponse:", response);

        setToken(response.token);
        setUser(response.user);
        toast.success("Connecté !");

        if (response.user.username) {
          await navigate({ to: "/u/$username", params: { username: response.user.username } });
        }
      } else {
        console.log("Inscription en cours...");
        const response = await signupUser({
          email,
          password,
          username: email.split("@")[0],
          display_name: displayName || email.split("@")[0],
        });
        console.log("Réponse:", response);

        setToken(response.token);
        setUser(response.user);
        toast.success("Compte créé !");

        if (response.user.username) {
          await navigate({ to: "/u/$username", params: { username: response.user.username } });
        }
      }
    } catch (err: any) {
      console.error("ERREUR:", err);
      toast.error(err.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="gradient-bg-primary inline-flex h-16 w-16 items-center justify-center rounded-2xl glow mb-4">
            <Sparkles className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold">
            Project<span className="gradient-text">Link</span>
          </h1>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-6">
          {/* Toggle */}
          <div className="flex rounded-lg bg-muted p-1 mb-6">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                mode === "signin" ? "bg-background shadow-sm" : "text-muted-foreground"
              }`}
            >
              Connexion
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                mode === "signup" ? "bg-background shadow-sm" : "text-muted-foreground"
              }`}
            >
              Inscription
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="displayName">Nom affiché</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Alex Martin"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="toi@projectlink.app"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
              {loading ? "Chargement..." : mode === "signin" ? "Se connecter" : "Créer mon compte"}
            </Button>
          </form>
        </div>

        {/* Back button */}
        <button
          onClick={() => navigate({ to: "/" })}
          className="mt-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à l'accueil
        </button>
      </div>
    </div>
  );
}
