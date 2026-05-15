import { Reveal } from "./Reveal";
import { EyeOff, Sparkles } from "lucide-react";

export const ProblemSolution = () => (
  <section className="py-24 relative">
    <div className="container grid md:grid-cols-2 gap-10">
      <Reveal>
        <div className="glass rounded-3xl p-8 h-full relative overflow-hidden">
          <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-destructive/20 blur-3xl" />
          <EyeOff className="h-10 w-10 text-destructive/80 mb-5" />
          <h3 className="font-display text-2xl font-bold mb-3">Le problème</h3>
          <p className="text-muted-foreground leading-relaxed">
            Les idées brillantes restent souvent invisibles. Faute de visibilité, de réseau ou de soutien,
            des milliers de projets prometteurs n'aboutissent jamais — étouffés par le silence.
          </p>
        </div>
      </Reveal>
      <Reveal delay={0.15}>
        <div className="glass rounded-3xl p-8 h-full relative overflow-hidden border-primary/30">
          <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-primary/30 blur-3xl" />
          <Sparkles className="h-10 w-10 text-primary-glow mb-5" />
          <h3 className="font-display text-2xl font-bold mb-3">Notre solution</h3>
          <p className="text-muted-foreground leading-relaxed">
            Prolink offre la scène que vos idées méritent. Une communauté engagée, des outils
            de collaboration et une visibilité instantanée pour transformer chaque projet en mouvement.
          </p>
        </div>
      </Reveal>
    </div>
  </section>
);
