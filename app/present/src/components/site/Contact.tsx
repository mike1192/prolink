import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, LogIn, Sparkles, Mail, Phone } from "lucide-react";
import { BrandingConfig } from "@/hooks/useBranding";

interface ContactProps {
  branding: BrandingConfig;
}

export const Contact = ({ branding }: ContactProps) => (
  <section id="contact" className="py-24 relative scroll-mt-24">
    <div className="container">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative rounded-[2.5rem] overflow-hidden glass p-12 md:p-20 text-center"
      >
        <div className="absolute inset-0 bg-gradient-hero opacity-25" aria-hidden="true" />
        <div
          className="absolute -top-32 left-1/4 h-80 w-80 rounded-full bg-primary/40 blur-3xl animate-glow-pulse"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-32 right-1/4 h-80 w-80 rounded-full bg-neon-pink/30 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="absolute top-10 right-10 h-40 w-40 rounded-full bg-neon-blue/20 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative">
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 mb-6">
            <Sparkles className="h-3.5 w-3.5 text-primary-glow" aria-hidden="true" />
            <span className="text-xs font-medium text-muted-foreground">
              Rejoignez {branding.name}
            </span>
          </div>
          <h2 className="font-display text-4xl md:text-6xl font-bold leading-tight">
            Prêt à faire <span className="text-gradient">décoller</span>
            <br />
            votre prochaine idée&nbsp;?
          </h2>
          <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto">
            Inscrivez-vous gratuitement en moins d'une minute. Aucune carte requise — juste vos
            ambitions.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button
              onClick={() => (window.location.href = "http://localhost:8080/auth")}
              size="lg"
              className="bg-gradient-primary glow-primary border-0 group text-base px-8 py-6 hover:opacity-95"
            >
              S'inscrire gratuitement
              <ArrowRight
                className="ml-1 h-5 w-5 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Button>
            <Button
              onClick={() => (window.location.href = "http://localhost:8080/auth")}
              size="lg"
              variant="outline"
              className="glass hover:bg-secondary/50 text-base px-8 py-6 border-border/60"
            >
              <LogIn className="mr-1 h-5 w-5" aria-hidden="true" />
              Se connecter
            </Button>
          </div>

          {/* Informations de contact */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <a
                href={`mailto:${branding.customContent.contactEmail}`}
                className="hover:text-primary transition-colors"
              >
                {branding.customContent.contactEmail}
              </a>
            </div>
            {branding.customContent.contactPhone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <a
                  href={`tel:${branding.customContent.contactPhone}`}
                  className="hover:text-primary transition-colors"
                >
                  {branding.customContent.contactPhone}
                </a>
              </div>
            )}
          </div>

          <p className="mt-8 text-xs text-muted-foreground">
            +12 000 créateurs · 48 pays · {branding.tagline}
          </p>
        </div>
      </motion.div>
    </div>
  </section>
);
