import { Reveal } from "./Reveal";
import { Rocket, Heart, TrendingUp, Users, MessageSquare, Globe } from "lucide-react";
import featurePublish from "@/assets/feature-publish.jpg";
import featureLikes from "@/assets/feature-likes.jpg";
import featureInvestors from "@/assets/feature-investors.jpg";
import featureTeam from "@/assets/feature-team.jpg";
import featureChat from "@/assets/feature-chat.jpg";
import featureGlobal from "@/assets/feature-global.jpg";

const features = [
  { icon: Rocket, image: featurePublish, title: "Publier un projet", desc: "Partagez votre vision en quelques secondes avec un format pensé pour engager." },
  { icon: Heart, image: featureLikes, title: "Likes & commentaires", desc: "Recevez des retours authentiques d'une communauté qui croit en l'innovation." },
  { icon: TrendingUp, image: featureInvestors, title: "Trouver des investisseurs", desc: "Connectez-vous à des financeurs en quête du prochain projet à fort potentiel." },
  { icon: Users, image: featureTeam, title: "Rejoindre un projet", desc: "Découvrez des équipes qui cherchent exactement vos compétences." },
  { icon: MessageSquare, image: featureChat, title: "Discussions en temps réel", desc: "Échangez instantanément avec collaborateurs et soutiens autour d'un projet." },
  { icon: Globe, image: featureGlobal, title: "Visibilité internationale", desc: "Rayonnez bien au-delà de votre cercle, de l'Afrique au monde entier." },
];

export const Features = () => (
  <section id="features" className="py-24 relative scroll-mt-24">
    <div className="container">
      <Reveal>
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-sm font-medium text-primary-glow uppercase tracking-widest">Fonctionnalités</span>
          <h2 className="font-display text-4xl md:text-5xl font-bold mt-3">
            Tout ce qu'il faut pour <span className="text-gradient">faire décoller</span> vos idées
          </h2>
        </div>
      </Reveal>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((f, i) => (
          <Reveal key={f.title} delay={i * 0.07}>
            <article className="group glass rounded-2xl h-full transition-all duration-500 hover:-translate-y-2 hover:border-primary/50 relative overflow-hidden flex flex-col">
              <div className="relative h-44 overflow-hidden">
                <img
                  src={f.image}
                  alt={f.title}
                  loading="lazy"
                  width={768}
                  height={512}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" aria-hidden="true" />
                <div className="absolute bottom-3 left-3 h-11 w-11 rounded-xl bg-gradient-primary flex items-center justify-center glow-primary ring-1 ring-primary/40">
                  <f.icon className="h-5 w-5 text-primary-foreground" aria-hidden="true" />
                </div>
              </div>
              <div className="p-6 pt-5 flex-1 flex flex-col">
                <h3 className="font-display text-xl font-semibold mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </div>
  </section>
);
