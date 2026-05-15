import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Heart, MessageCircle, Share2 } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import { BrandingConfig } from "@/hooks/useBranding";

const projects = [
  { title: "Eco-Farm AI", author: "Aïcha M.", tag: "AgriTech", likes: 248, comments: 32, color: "from-primary to-neon-pink" },
  { title: "SoundWave", author: "Lucas R.", tag: "Music", likes: 412, comments: 58, color: "from-neon-blue to-primary" },
  { title: "BrightCity", author: "Mariam D.", tag: "Smart City", likes: 189, comments: 21, color: "from-neon-pink to-primary-glow" },
  { title: "Lingo Labs", author: "Yann K.", tag: "EdTech", likes: 322, comments: 47, color: "from-primary-glow to-neon-blue" },
  { title: "GreenChain", author: "Sofia B.", tag: "Web3", likes: 501, comments: 73, color: "from-primary to-neon-blue" },
];

interface HeroProps {
  branding: BrandingConfig;
}

export const Hero = ({ branding }: HeroProps) => {
  const loop = [...projects, ...projects];
  return (
    <section id="home" className="relative pt-32 pb-24 overflow-hidden">
      <div
        className="absolute inset-0 -z-10 opacity-40"
        style={{ backgroundImage: `url(${heroBg})`, backgroundSize: "cover", backgroundPosition: "center" }}
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/40 via-background/80 to-background" />
      <div className="absolute inset-0 -z-10 grid-pattern opacity-30" />

      <div className="container grid lg:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 mb-6">
            <Sparkles className="h-3.5 w-3.5 text-primary-glow" />
            <span className="text-xs font-medium text-muted-foreground">{branding.tagline}</span>
          </div>
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight">
            {branding.customContent.heroTitle.split(' ').map((word, index, array) => {
              // Mettre en évidence le dernier mot avec un gradient
              if (index === array.length - 1) {
                return <span key={index} className="text-gradient">{word}</span>;
              }
              return <span key={index}>{word} </span>;
            })}
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-xl leading-relaxed">
            {branding.customContent.heroSubtitle}
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Button size="lg" className="bg-gradient-primary hover:opacity-90 glow-primary border-0 group">
              {branding.customContent.heroCtaText}
              <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button size="lg" variant="outline" className="glass hover:bg-secondary/50">
              Explorer les projets
            </Button>
          </div>
          <div className="mt-10 flex items-center gap-6">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={`h-9 w-9 rounded-full border-2 border-background bg-gradient-to-br ${projects[i].color}`} />
              ))}
            </div>
            <div className="text-sm">
              <div className="font-semibold">+12 000 créateurs</div>
              <div className="text-muted-foreground text-xs">déjà sur {branding.name}</div>
            </div>
          </div>
        </motion.div>

        {/* Phone mockup */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
          className="relative flex justify-center lg:justify-end"
        >
          <div className="absolute inset-0 -z-10 bg-gradient-primary blur-3xl opacity-30 animate-glow-pulse" />
          <div className="relative animate-float">
            <div className="relative w-[300px] h-[610px] rounded-[3rem] glass p-3 shadow-elegant" style={{ boxShadow: "var(--shadow-elegant)" }}>
              <div className="absolute top-2 left-1/2 -translate-x-1/2 h-6 w-28 bg-background rounded-b-2xl z-20" />
              <div className="relative h-full w-full rounded-[2.4rem] bg-card overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-card to-transparent z-10" />
                <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-card to-transparent z-10" />
                <div className="px-4 pt-12">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-display font-bold text-sm">Feed</span>
                    <span className="h-2 w-2 rounded-full bg-accent animate-glow-pulse" />
                  </div>
                </div>
                <div className="px-4 animate-marquee-y">
                  {loop.map((p, i) => (
                    <div key={i} className="mb-3 rounded-2xl glass p-3">
                      <div className={`h-24 w-full rounded-xl bg-gradient-to-br ${p.color} mb-3 relative overflow-hidden`}>
                        <div className="absolute inset-0 bg-grid-pattern opacity-30" />
                      </div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold">{p.title}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary-glow">{p.tag}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground mb-2">par {p.author}</div>
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <span className="flex items-center gap-1 text-[10px]"><Heart className="h-3 w-3" />{p.likes}</span>
                        <span className="flex items-center gap-1 text-[10px]"><MessageCircle className="h-3 w-3" />{p.comments}</span>
                        <Share2 className="h-3 w-3 ml-auto" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
