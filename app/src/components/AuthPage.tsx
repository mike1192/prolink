import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { signupUser, loginUser } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import {
  Sparkles,
  Mail,
  Lock,
  User,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

// Règles de mot de passe
interface PasswordRules {
  minLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

const checkPasswordRules = (password: string): PasswordRules => {
  return {
    minLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };
};

const isPasswordValid = (rules: PasswordRules): boolean => {
  return Object.values(rules).every(Boolean);
};

export function AuthPage() {
  const navigate = useNavigate();
  const { setUser, setToken } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const passwordRules = checkPasswordRules(password);

  const reset = () => {
    setEmail("");
    setPassword("");
    setShowPassword(false);
    setDisplayName("");
    setUsername("");
    setBio("");
    setSkills([]);
    setStep(1);
  };

  const canProceedToStep2 = email && password && isPasswordValid(passwordRules);
  const canProceedToStep3 = displayName && username.length >= 3;
  const canSubmit = mode === "signin" ? email && password : canProceedToStep3;

  const handleNextStep = () => {
    if (step === 1 && canProceedToStep2) setStep(2);
    else if (step === 2 && canProceedToStep3) setStep(3);
  };

  const handlePrevStep = () => {
    if (step > 1) setStep((step - 1) as 1 | 2 | 3);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    try {
      if (mode === "signup") {
        const cleanUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, "");
        const response = await signupUser({
          email,
          password,
          username: cleanUsername,
          display_name: displayName,
          bio: bio || undefined,
          skills: skills,
        });

        // Store token and user data
        setToken(response.token);
        setUser(response.user);

        toast.success("Compte créé avec succès ! Bienvenue sur ProLink ✨");

        // Redirect to profile page after signup
        await navigate({ to: "/u/$username", params: { username: cleanUsername } });
        reset();
      } else {
        console.log("Tentative de connexion...", { email });
        const response = await loginUser(email, password);

        console.log("Réponse login:", response);

        // Store token and user data
        setToken(response.token);
        setUser(response.user);

        toast.success("Connecté avec succès !");

        // Redirect to profile page after login
        console.log("Redirection vers:", response.user.username);
        await navigate({ to: "/u/$username", params: { username: response.user.username } });
        reset();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur";
      toast.error(msg.includes("Invalid login") ? "Identifiants invalides" : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen overflow-hidden">
      {/* Background animated blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full opacity-30 blur-3xl"
        style={{ background: "var(--gradient-primary)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full opacity-30 blur-3xl"
        style={{ background: "var(--gradient-neon)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20 blur-3xl"
        style={{ background: "var(--gradient-hero)" }}
      />

      {/* Left Section - Branding */}
      <div className="relative hidden w-1/2 flex-col justify-center p-12 lg:flex">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-lg"
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="gradient-bg-primary flex h-14 w-14 items-center justify-center rounded-2xl glow">
              <Sparkles className="h-7 w-7 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-bold">
              Pro<span className="gradient-text">Link</span>
            </h1>
          </div>

          <h2 className="mb-4 text-3xl font-bold leading-tight">
            Tes projets méritent <span className="gradient-text">une équipe</span>.
          </h2>
          <p className="mb-8 text-lg text-muted-foreground">
            Rejoins une communauté de bâtisseurs, publie tes idées et trouve des collaborateurs pour
            donner vie à tes projets.
          </p>

          <div className="space-y-4">
            {[
              {
                icon: "",
                title: "Publie tes projets",
                desc: "Partage tes idées avec la communauté",
              },
              {
                icon: "",
                title: "Trouve ta team",
                desc: "Connecte-toi avec des talents complémentaires",
              },
              { icon: "", title: "Collabore", desc: "Échange, commente et construis ensemble" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
                className="glass flex items-start gap-4 rounded-2xl p-4"
              >
                <span className="text-3xl">{item.icon}</span>
                <div>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right Section - Auth Form */}
      <div className="flex w-full items-center justify-center p-6 lg:w-1/2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass w-full max-w-md rounded-3xl p-8"
        >
          {/* Mobile logo */}
          <div className="mb-6 flex items-center justify-center gap-2 lg:hidden">
            <div className="gradient-bg-primary flex h-12 w-12 items-center justify-center rounded-xl">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold">
              Pro<span className="gradient-text">Link</span>
            </h1>
          </div>

          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold">
              {mode === "signin" ? "Bon retour ! " : "Rejoins-nous "}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {mode === "signin"
                ? "Connecte-toi pour retrouver tes projets"
                : "Crée ton compte et commence à collaborer"}
            </p>
          </div>

          {/* Stepper pour inscription */}
          {mode === "signup" && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                {[1, 2, 3].map((s) => (
                  <div key={s} className="flex items-center flex-1">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all ${step >= s
                        ? "gradient-bg-primary text-primary-foreground shadow-lg"
                        : "bg-muted text-muted-foreground"
                        }`}
                    >
                      {step > s ? <CheckCircle className="h-4 w-4" /> : s}
                    </div>
                    {s < 3 && (
                      <div
                        className={`flex-1 h-1 mx-2 rounded transition-all ${step > s ? "gradient-bg-primary" : "bg-muted"
                          }`}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Compte</span>
                <span>Profil</span>
                <span>Compétences</span>
              </div>
            </div>
          )}

          {/* Toggle */}
          <div className="mb-6 flex rounded-xl bg-muted p-1">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all ${mode === "signin"
                ? "gradient-bg-primary text-primary-foreground shadow-lg"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              Connexion
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all ${mode === "signup"
                ? "gradient-bg-primary text-primary-foreground shadow-lg"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              Inscription
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {/* ÉTAPE 1: Email & Mot de passe */}
              {mode === "signup" && step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="toi@projectlink.app"
                        className="pl-10"
                        required
                        maxLength={255}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Mot de passe</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pl-10 pr-10"
                        required
                        minLength={8}
                        maxLength={128}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Règles de mot de passe */}
                  {password && (
                    <div className="glass rounded-xl p-3 space-y-2">
                      <p className="text-xs font-semibold mb-2">Le mot de passe doit contenir :</p>
                      <div className="grid grid-cols-1 gap-1.5 text-xs">
                        <div className="flex items-center gap-2">
                          {passwordRules.minLength ? (
                            <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                          )}
                          <span
                            className={
                              passwordRules.minLength ? "text-green-500" : "text-muted-foreground"
                            }
                          >
                            8 caractères minimum
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {passwordRules.hasUpper ? (
                            <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                          )}
                          <span
                            className={
                              passwordRules.hasUpper ? "text-green-500" : "text-muted-foreground"
                            }
                          >
                            Une lettre majuscule (A-Z)
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {passwordRules.hasLower ? (
                            <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                          )}
                          <span
                            className={
                              passwordRules.hasLower ? "text-green-500" : "text-muted-foreground"
                            }
                          >
                            Une lettre minuscule (a-z)
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {passwordRules.hasNumber ? (
                            <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                          )}
                          <span
                            className={
                              passwordRules.hasNumber ? "text-green-500" : "text-muted-foreground"
                            }
                          >
                            Un chiffre (0-9)
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {passwordRules.hasSpecial ? (
                            <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                          )}
                          <span
                            className={
                              passwordRules.hasSpecial ? "text-green-500" : "text-muted-foreground"
                            }
                          >
                            Un caractère spécial (!@#$%^&*)
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <Button
                    type="button"
                    variant="hero"
                    size="lg"
                    className="w-full"
                    onClick={handleNextStep}
                    disabled={!canProceedToStep2}
                  >
                    Continuer
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </motion.div>
              )}

              {/* ÉTAPE 2: Profil */}
              {mode === "signup" && step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Nom affiché *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="displayName"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Alex Martin"
                        className="pl-10"
                        maxLength={50}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username">Nom d'utilisateur *</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground">
                        @
                      </span>
                      <Input
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="alex_dev"
                        className="pl-10"
                        maxLength={30}
                        pattern="[a-zA-Z0-9_]+"
                        required
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Lettres, chiffres et tirets bas uniquement (min. 3 caractères)
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      className="flex-1"
                      onClick={handlePrevStep}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Retour
                    </Button>
                    <Button
                      type="button"
                      variant="hero"
                      size="lg"
                      className="flex-1"
                      onClick={handleNextStep}
                      disabled={!canProceedToStep3}
                    >
                      Continuer
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* ÉTAPE 3: Compétences */}
              {mode === "signup" && step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio (optionnel)</Label>
                    <textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Parlez-nous de vous en quelques mots..."
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      maxLength={280}
                    />
                    <p className="text-xs text-muted-foreground text-right">{bio.length}/280</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Compétences (cliquez pour ajouter)</Label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        "React",
                        "TypeScript",
                        "Node.js",
                        "Python",
                        "Java",
                        "JavaScript",
                        "Vue.js",
                        "Angular",
                        "PHP",
                        "Ruby",
                        "C++",
                        "Go",
                        "Rust",
                        "SQL",
                        "MongoDB",
                        "Docker",
                        "AWS",
                        "Figma",
                        "UI/UX",
                        "DevOps",
                        "Graphiste",
                      ].map((skill) => {
                        const isSelected = skills.includes(skill);
                        return (
                          <button
                            key={skill}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setSkills(skills.filter((s) => s !== skill));
                              } else {
                                setSkills([...skills, skill]);
                              }
                            }}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${isSelected
                              ? "gradient-bg-primary text-primary-foreground shadow-lg"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                              }`}
                          >
                            {skill}
                          </button>
                        );
                      })}
                    </div>
                    {skills.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {skills.length} compétence{skills.length > 1 ? "s" : ""} sélectionnée
                        {skills.length > 1 ? "s" : ""}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      className="flex-1"
                      onClick={handlePrevStep}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Retour
                    </Button>
                    <Button
                      type="submit"
                      variant="hero"
                      size="lg"
                      className="flex-1"
                      disabled={loading || !canSubmit}
                    >
                      {loading ? (
                        "Création en cours…"
                      ) : (
                        <>
                          Créer mon compte
                          <Sparkles className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Formulaire de connexion (inchangé) */}
            {mode === "signin" && (
              <motion.div
                key="signin"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="email-signin">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email-signin"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="toi@prolink.app"
                      className="pl-10"
                      required
                      maxLength={255}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password-signin">Mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password-signin"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="hero"
                  size="lg"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    "Connexion en cours…"
                  ) : (
                    <>
                      Se connecter
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </motion.div>
            )}
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signin" ? (
              <>
                Pas encore de compte ?{" "}
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className="font-medium text-primary hover:underline"
                >
                  Inscris-toi
                </button>
              </>
            ) : (
              <>
                Déjà un compte ?{" "}
                <button
                  type="button"
                  onClick={() => setMode("signin")}
                  className="font-medium text-primary hover:underline"
                >
                  Connecte-toi
                </button>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
