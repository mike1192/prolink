import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link2, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandingConfig } from "@/hooks/useBranding";

const links = [
  { href: "#home", label: "Accueil" },
  { href: "#features", label: "Fonctionnalités" },
  { href: "#about", label: "À propos" },
  { href: "#contact", label: "Contact" },
];

interface NavbarProps {
  branding: BrandingConfig;
}

export const Navbar = ({ branding }: NavbarProps) => {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("#home");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const ids = links.map((l) => l.href.slice(1));
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el);
    if (!sections.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(`#${visible.target.id}`);
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: [0, 0.25, 0.5, 1] }
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  // Lock body scroll + escape to close on mobile menu
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = original;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const handleNav = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      history.replaceState(null, "", href);
      setActive(href);
      setOpen(false);
    }
  };

  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        scrolled || open ? "glass py-3" : "py-5 bg-transparent"
      )}
      role="banner"
    >
      <nav className="container flex items-center justify-between" aria-label="Navigation principale">
        <a
          href="#home"
          onClick={(e) => handleNav(e, "#home")}
          className="flex items-center gap-2 group rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label={`${branding.name} — retour à l'accueil`}
        >
          {branding.logoUrl ? (
            <img 
              src={branding.logoUrl} 
              alt={branding.name}
              className="h-9 w-9 rounded-xl object-contain"
            />
          ) : (
            <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary glow-primary">
              <Link2 className="h-5 w-5 text-primary-foreground" aria-hidden="true" />
            </span>
          )}
          <span className="font-display text-xl font-bold tracking-tight">
            {branding.name}
          </span>
        </a>

        <ul className="hidden md:flex items-center gap-8">
          {links.map((l) => {
            const isActive = active === l.href;
            return (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={(e) => handleNav(e, l.href)}
                  className={cn(
                    "text-sm transition-colors relative py-1 rounded-sm",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-background",
                    "after:absolute after:left-0 after:-bottom-0.5 after:h-px after:bg-gradient-primary after:transition-all after:duration-300",
                    isActive
                      ? "text-foreground after:w-full"
                      : "text-muted-foreground hover:text-foreground after:w-0 hover:after:w-full"
                  )}
                  aria-current={isActive ? "location" : undefined}
                >
                  {l.label}
                </a>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-2">
          <Button 
            onClick={()=> window.location.href= 'http://localhost:8080/auth'}
            variant="ghost" size="sm" className="hidden sm:inline-flex hover:text-primary-glow">
            Se connecter
          </Button>
          <Button 
            onClick={()=> window.location.href= 'http://localhost:8080/auth'}
            size="sm" className="hidden sm:inline-flex bg-gradient-primary hover:opacity-90 transition-opacity glow-primary border-0">
            S'inscrire
          </Button>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="md:hidden ml-1 inline-flex h-10 w-10 items-center justify-center rounded-lg glass focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
          >
            <AnimatePresence mode="wait" initial={false}>
              {open ? (
                <motion.span
                  key="x"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </motion.span>
              ) : (
                <motion.span
                  key="m"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu className="h-5 w-5" aria-hidden="true" />
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            key="mobile-menu"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="md:hidden border-t border-border/50 mt-3"
            role="dialog"
            aria-modal="true"
            aria-label="Menu mobile"
          >
            <ul className="container py-6 flex flex-col gap-1">
              {links.map((l, i) => {
                const isActive = active === l.href;
                return (
                  <motion.li
                    key={l.href}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: i * 0.05 }}
                  >
                    <a
                      href={l.href}
                      onClick={(e) => handleNav(e, l.href)}
                      aria-current={isActive ? "location" : undefined}
                      className={cn(
                        "flex items-center justify-between rounded-xl px-4 py-3 text-base transition-all",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                        isActive
                          ? "bg-gradient-primary/10 text-foreground border border-primary/30"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                      )}
                    >
                      <span>{l.label}</span>
                      {isActive && <span className="h-2 w-2 rounded-full bg-primary-glow shadow-[0_0_10px_hsl(var(--primary))]" />}
                    </a>
                  </motion.li>
                );
              })}
              <li className="mt-3 flex gap-2">
                <Button onClick={()=> window.location.href= 'http://localhost:8080/auth'} variant="outline" className="flex-1 glass">Se connecter</Button>
                <Button onClick={()=> window.location.href= 'http://localhost:8080/auth'} className="flex-1 bg-gradient-primary border-0 glow-primary">S'inscrire</Button>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};
