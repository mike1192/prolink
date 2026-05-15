import { Link2, Twitter, Linkedin, Instagram, Facebook } from "lucide-react";
import { BrandingConfig } from "@/hooks/useBranding";

interface FooterProps {
  branding: BrandingConfig;
}

export const Footer = ({ branding }: FooterProps) => (
  <footer className="border-t border-border py-12 mt-16">
    <div className="container">
      <div className="grid md:grid-cols-4 gap-10 mb-10">
        <div className="md:col-span-2">
          <a href="#home" className="flex items-center gap-2 mb-4">
            {branding.logoUrl ? (
              <img 
                src={branding.logoUrl} 
                alt={branding.name}
                className="h-9 w-9 rounded-xl object-contain"
              />
            ) : (
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary glow-primary">
                <Link2 className="h-5 w-5 text-primary-foreground" />
              </span>
            )}
            <span className="font-display text-xl font-bold">
              {branding.name}
            </span>
          </a>
          <p className="text-sm text-muted-foreground max-w-sm">
            {branding.tagline}
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-4 text-sm">Lien rapide</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><a href="#features" className="hover:text-foreground transition-colors">Fonctionnalités</a></li>
            <li><a href="#about" className="hover:text-foreground transition-colors">À propos</a></li>
            <li><a href="#contact" className="hover:text-foreground transition-colors">Contact</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-4 text-sm">Suivez-nous</h4>
          <div className="flex gap-3">
            {[Twitter, Instagram, Linkedin, Facebook].map((Icon, i) => (
              <a key={i} href="#" className="h-9 w-9 rounded-lg glass flex items-center justify-center hover:border-primary/50 hover:text-primary-glow transition-all hover:-translate-y-0.5">
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-border pt-6 text-xs text-muted-foreground flex flex-col sm:flex-row justify-between gap-2">
        <span>© {new Date().getFullYear()} {branding.name}. Tous droits réservés.</span>
        <span>{branding.tagline}</span>
      </div>
    </div>
  </footer>
);
