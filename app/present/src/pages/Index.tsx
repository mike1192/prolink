import { useEffect } from "react";
import { Navbar } from "@/components/site/Navbar";
import { Hero } from "@/components/site/Hero";
import { ProblemSolution } from "@/components/site/ProblemSolution";
import { Features } from "@/components/site/Features";
import { HowItWorks } from "@/components/site/HowItWorks";
import { Community } from "@/components/site/Community";
import { About } from "@/components/site/About";
import { CTA } from "@/components/site/CTA";
import { Contact } from "@/components/site/Contact";
import { Footer } from "@/components/site/Footer";
import { useBranding } from "@/hooks/useBranding";

const Index = () => {
  const { data: branding, isLoading } = useBranding();

  // Appliquer la configuration de branding au document
  useEffect(() => {
    if (branding) {
      // Mettre à jour le titre de l'onglet
      document.title = branding.tabTitle;
      
      // Mettre à jour le favicon si un logo est défini
      if (branding.logoUrl) {
        let favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
        if (!favicon) {
          favicon = document.createElement('link');
          favicon.rel = 'icon';
          document.head.appendChild(favicon);
        }
        favicon.href = branding.logoUrl;
      }
      
      // Appliquer les couleurs personnalisées
      const root = document.documentElement;
      if (branding.primaryColor) {
        root.style.setProperty('--primary', branding.primaryColor);
      }
      if (branding.accentColor) {
        root.style.setProperty('--accent', branding.accentColor);
      }
    }
  }, [branding]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!branding) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Erreur de chargement</h1>
          <p className="text-muted-foreground">Impossible de charger la configuration de la plateforme.</p>
        </div>
      </div>
    );
  }

  // Créer un tableau des sections triées par ordre et filtrées par statut activé
  const enabledSections = Object.entries(branding.sections)
    .filter(([_, section]) => section.enabled)
    .sort((a, b) => a[1].order - b[1].order)
    .map(([key]) => key);

  // Composants de sections
  const sectionComponents = {
    hero: <Hero key="hero" branding={branding} />,
    problemSolution: <ProblemSolution key="problemSolution" />,
    features: <Features key="features" />,
    howItWorks: <HowItWorks key="howItWorks" />,
    community: <Community key="community" />,
    about: <About key="about" branding={branding} />,
    contact: <Contact key="contact" branding={branding} />
  };

  return (
    <div className="min-h-screen overflow-x-hidden">
      <Navbar branding={branding} />
      <main>
        {enabledSections.map(sectionKey => 
          sectionComponents[sectionKey as keyof typeof sectionComponents]
        )}
      </main>
      <Footer branding={branding} />
    </div>
  );
};

export default Index;
