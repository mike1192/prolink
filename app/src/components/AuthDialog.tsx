import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { signupUser, loginUser } from "@/lib/api";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

export function AuthDialog() {
  const { loginOpen, closeLogin, setUser, setToken } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setEmail("");
    setPassword("");
    setDisplayName("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("=== FORMULAIRE SOUMIS ===");
    console.log("Mode:", mode);
    console.log("Email:", email);
    console.log("Password:", password);

    if (!email || !password) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        console.log("Mode: INSCRIPTION");
        if (password.length < 6) {
          toast.error("Mot de passe : 6 caractères minimum");
          setLoading(false);
          return;
        }
        const response = await signupUser({
          email,
          password,
          username: email.split("@")[0],
          display_name: displayName || email.split("@")[0],
        });

        console.log("Inscription réussie:", response);
        setToken(response.token);
        setUser(response.user);

        toast.success("Compte créé ! Bienvenue sur ProjectLink ✨");
        closeLogin();
        reset();

        if (response.user.username) {
          await navigate({ to: "/u/$username", params: { username: response.user.username } });
        }
      } else {
        console.log("Mode: CONNEXION");
        const response = await loginUser(email, password);

        console.log("Connexion réussie:", response);
        setToken(response.token);
        setUser(response.user);

        toast.success("Connecté !");
        closeLogin();
        reset();

        if (response.user.username) {
          console.log("Redirection vers:", response.user.username);
          await navigate({ to: "/u/$username", params: { username: response.user.username } });
        }
      }
    } catch (err) {
      console.error("=== ERREUR ===", err);
      const msg = err instanceof Error ? err.message : "Erreur";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={loginOpen}
      onOpenChange={(o) => {
        console.log("Dialog onOpenChange:", o);
        if (!o) closeLogin();
      }}
    >
      <DialogContent className="glass max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="gradient-bg-primary flex h-10 w-10 items-center justify-center rounded-xl">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <DialogTitle className="text-xl">Bienvenue sur ProjectLink</DialogTitle>
              <DialogDescription>Rejoins la communauté des bâtisseurs.</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-4">
          {/* Toggle boutons au lieu de Tabs */}
          <div className="flex rounded-lg bg-muted p-1 mb-4">
            <button
              type="button"
              onClick={() => {
                console.log("Switch to signin");
                setMode("signin");
              }}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                mode === "signin" ? "bg-background shadow-sm" : "text-muted-foreground"
              }`}
            >
              Connexion
            </button>
            <button
              type="button"
              onClick={() => {
                console.log("Switch to signup");
                setMode("signup");
              }}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                mode === "signup" ? "bg-background shadow-sm" : "text-muted-foreground"
              }`}
            >
              Inscription
            </button>
          </div>

          <form
            onSubmit={(e) => {
              console.log("Form onSubmit triggered!");
              handleSubmit(e);
            }}
            className="space-y-4"
          >
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="dn">Nom affiché</Label>
                <Input
                  id="dn"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Alex Martin"
                  maxLength={50}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  console.log("Email changed:", e.target.value);
                  setEmail(e.target.value);
                }}
                placeholder="toi@projectlink.app"
                required
                maxLength={255}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  console.log("Password changed");
                  setPassword(e.target.value);
                }}
                placeholder="••••••••"
                required
                minLength={6}
                maxLength={128}
              />
            </div>

            <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
              {loading ? "Patiente…" : mode === "signup" ? "Créer mon compte" : "Se connecter"}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
