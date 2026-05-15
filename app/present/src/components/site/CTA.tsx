import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export const CTA = () => (
  <section className="py-24 relative">
    <div className="container">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="relative rounded-[2.5rem] overflow-hidden glass p-12 md:p-20 text-center"
      >
        <div className="absolute inset-0 bg-gradient-hero opacity-20" />
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-80 w-80 rounded-full bg-primary/40 blur-3xl animate-glow-pulse" />
        <div className="absolute -bottom-32 right-1/4 h-80 w-80 rounded-full bg-neon-pink/30 blur-3xl" />
        <div className="relative">
          <h2 className="font-display text-4xl md:text-6xl font-bold leading-tight">
            Rejoignez une communauté qui<br />
            transforme les <span className="text-gradient">idées en réalité</span>
          </h2>
          <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto">
            Inscrivez-vous gratuitement en moins d'une minute. Aucune carte requise.
          </p>
          <Button
          onClick={()=> window.location.href= 'http://localhost:8080/auth'} 
          size="lg" className="mt-10 bg-gradient-primary glow-primary border-0 group text-base px-8 py-6">
            S'inscrire gratuitement
            <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </motion.div>
    </div>
  </section>
);
