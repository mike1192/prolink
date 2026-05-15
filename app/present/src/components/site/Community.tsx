import { Reveal } from "./Reveal";
import { Heart, MessageCircle } from "lucide-react";
import avatarAmina from "@/assets/avatar-amina.jpg";
import avatarDavid from "@/assets/avatar-david.jpg";
import avatarInes from "@/assets/avatar-ines.jpg";

const cards = [
  { title: "Solar Mesh Network", author: "Amina K.", role: "Fondatrice", tag: "CleanTech", likes: 842, comments: 124, color: "from-primary to-neon-pink", quote: "Nous avons trouvé notre CTO en 3 jours sur Projectlink.", avatar: avatarAmina },
  { title: "Lingua Africa", author: "David O.", role: "Cofondateur", tag: "EdTech", likes: 612, comments: 98, color: "from-neon-blue to-primary", quote: "Notre 1er investisseur nous a contactés via la plateforme.", avatar: avatarDavid },
  { title: "Wave Studio", author: "Inès B.", role: "Designer", tag: "Creative", likes: 459, comments: 67, color: "from-neon-pink to-primary-glow", quote: "Une communauté qui pousse vraiment vers le haut.", avatar: avatarInes },
];

export const Community = () => (
  <section className="py-24 relative">
    <div className="container">
      <Reveal>
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-sm font-medium text-primary-glow uppercase tracking-widest">Communauté</span>
          <h2 className="font-display text-4xl md:text-5xl font-bold mt-3">
            Une scène, des <span className="text-gradient">milliers d'histoires</span>
          </h2>
        </div>
      </Reveal>
      <div className="grid md:grid-cols-3 gap-6">
        {cards.map((c, i) => (
          <Reveal key={c.title} delay={i * 0.1}>
            <div className="glass rounded-3xl overflow-hidden group hover:border-primary/40 transition-all duration-500 hover:-translate-y-2 h-full flex flex-col">
              <div className={`h-40 bg-gradient-to-br ${c.color} relative`}>
                <div className="absolute inset-0 grid-pattern opacity-20" />
                <span className="absolute top-4 right-4 text-xs px-2.5 py-1 rounded-full glass">{c.tag}</span>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="font-display text-lg font-bold mb-1">{c.title}</h3>
                <div className="flex items-center gap-2 mb-4">
                  <img
                    src={c.avatar}
                    alt={c.author}
                    loading="lazy"
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded-full object-cover ring-2 ring-background shadow-md"
                  />
                  <span className="text-xs text-muted-foreground">{c.author} · {c.role}</span>
                </div>
                <p className="text-sm text-foreground/80 italic mb-5 flex-1">"{c.quote}"</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground border-t border-border pt-4">
                  <span className="flex items-center gap-1.5"><Heart className="h-3.5 w-3.5 text-neon-pink" />{c.likes}</span>
                  <span className="flex items-center gap-1.5"><MessageCircle className="h-3.5 w-3.5 text-accent" />{c.comments}</span>
                </div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  </section>
);
