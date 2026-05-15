import { Reveal } from "./Reveal";
import stepAccount from "@/assets/step-account.jpg";
import stepPublish from "@/assets/step-publish.jpg";
import stepEngage from "@/assets/step-engage.jpg";
import stepCollab from "@/assets/step-collab.jpg";

const steps = [
  { n: "01", t: "Crée un compte", d: "Inscription rapide en moins de 30 secondes.", img: stepAccount },
  { n: "02", t: "Publie ton projet", d: "Présente ton idée avec image, description et objectifs.", img: stepPublish },
  { n: "03", t: "Attire des intéressés", d: "Reçois likes, commentaires et messages.", img: stepEngage },
  { n: "04", t: "Collabore & développe", d: "Bâtis ton équipe et fais grandir ton idée.", img: stepCollab },
];

export const HowItWorks = () => (
  <section className="py-24 relative">
    <div className="container">
      <Reveal>
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-sm font-medium text-primary-glow uppercase tracking-widest">Processus</span>
          <h2 className="font-display text-4xl md:text-5xl font-bold mt-3">
            Comment ça <span className="text-gradient">marche</span>
          </h2>
        </div>
      </Reveal>
      <div className="relative">
        <div className="hidden lg:block absolute top-16 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" aria-hidden="true" />
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.12}>
              <div className="relative group text-center">
                <div className="relative h-32 w-32 mx-auto mb-6">
                  <div className="absolute inset-0 rounded-full bg-gradient-primary blur-2xl opacity-40 group-hover:opacity-70 transition-opacity" aria-hidden="true" />
                  <div className="relative h-full w-full rounded-full overflow-hidden glass ring-1 ring-primary/30 group-hover:ring-primary/60 transition-all">
                    <img
                      src={s.img}
                      alt={s.t}
                      loading="lazy"
                      width={512}
                      height={512}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  </div>
                  <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-primary text-primary-foreground text-xs font-bold font-display glow-primary">
                    {s.n}
                  </span>
                </div>
                <h3 className="font-display text-xl font-semibold mb-2">{s.t}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{s.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  </section>
);
