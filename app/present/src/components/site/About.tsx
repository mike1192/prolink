import { Reveal } from "./Reveal";
import { Compass, Target, Sparkles, Globe2 } from "lucide-react";
import { BrandingConfig } from "@/hooks/useBranding";

interface AboutProps {
  branding: BrandingConfig;
}

export const About = ({ branding }: AboutProps) => (
  <section id="about" className="py-24 relative scroll-mt-24">
    <div className="absolute inset-0 -z-10 opacity-40 [background:radial-gradient(ellipse_at_center,hsl(var(--primary)/0.18),transparent_60%)]" />
    <div className="container max-w-5xl">
      <Reveal>
        <div className="text-center max-w-3xl mx-auto">
          <span className="text-xs font-semibold text-primary-glow uppercase tracking-[0.25em]">À propos</span>
          <h2 className="font-display text-4xl md:text-5xl font-bold mt-4 mb-6">
            À propos de {branding.name}
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {branding.customContent.aboutDescription}
          </p>
        </div>
      </Reveal>

      {/* Vision / Mission / Why */}
      <div className="grid md:grid-cols-3 gap-6 mt-14">
        {[
          {
            icon: Compass,
            tag: "Notre vision",
            title: "Une scène globale pour chaque idée",
            text: "Faire émerger une génération de créateurs visibles, connectés et financés, sans dépendre de leur géographie.",
          },
          {
            icon: Target,
            tag: "Notre mission",
            title: "Connecter projets, talents et capital",
            text: "Offrir un espace où publier un projet ouvre instantanément la porte à des retours, des collaborateurs et des investisseurs.",
          },
          {
            icon: Sparkles,
            tag: "Pourquoi nous existons",
            title: "Trop d'idées meurent en silence",
            text: "Faute de réseau, de visibilité ou d'écoute, des milliers de projets brillants ne voient jamais le jour. Nous changeons cela.",
          },
        ].map((c, i) => (
          <Reveal key={c.tag} delay={0.1 + i * 0.1}>
            <div className="glass rounded-2xl p-7 h-full hover:-translate-y-1 transition-transform duration-500 group">
              <div className="h-11 w-11 rounded-xl bg-gradient-primary glow-primary flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <c.icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xs font-semibold text-primary-glow uppercase tracking-widest">{c.tag}</span>
              <h3 className="font-display text-xl font-bold mt-2 mb-3">{c.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{c.text}</p>
            </div>
          </Reveal>
        ))}
      </div>

      {/* Storytelling Afrique → Monde */}
      <Reveal delay={0.2}>
        <div className="mt-16 glass rounded-3xl p-8 md:p-12 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-gradient-primary opacity-20 blur-3xl" />
          <div className="grid md:grid-cols-[auto_1fr] gap-8 items-start relative">
            <div className="h-14 w-14 rounded-2xl bg-gradient-primary glow-primary flex items-center justify-center shrink-0">
              <Globe2 className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-display text-2xl md:text-3xl font-bold mb-5">
                Du Bénin à Lagos, de Dakar à San Francisco.
              </h3>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  <strong className="text-foreground">{branding.name} est né d'une conviction simple</strong> :
                  les idées les plus puissantes ne viennent pas toujours des écosystèmes les plus visibles.
                  Sur le continent africain, une génération entière construit, code, dessine et entreprend
                  souvent sans accès aux réseaux qui transforment une idée en entreprise mondiale.
                </p>
                <p>
                  Nous avons construit {branding.name} pour <span className="text-foreground font-medium">briser
                  ce plafond invisible</span>. Une plateforme où un étudiant du Bénin peut être découvert
                  par un investisseur à Berlin. Où un designer à Calavi trouve son co-fondateur à Montréal.
                </p>
                <p className="text-foreground font-medium">
                  Notre ambition : devenir la première vitrine mondiale des projets nés en Afrique
                  et faire rayonner cette créativité bien au-delà de nos frontières.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 md:gap-6 mt-12">
        {[
          { v: "12k+", l: "Créateurs" },
          { v: "3.5k", l: "Projets publiés" },
          { v: "48", l: "Pays représentés" },
        ].map((s, i) => (
          <Reveal key={s.l} delay={0.1 + i * 0.1}>
            <div className="glass rounded-2xl p-6 text-center">
              <div className="font-display text-3xl md:text-4xl font-bold text-gradient">{s.v}</div>
              <div className="text-xs md:text-sm text-muted-foreground mt-1">{s.l}</div>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  </section>
);
