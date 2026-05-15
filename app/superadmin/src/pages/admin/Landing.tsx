import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBrandingConfig } from "@/hooks/useBranding";
import { ArrowDown, ArrowUp, GripVertical, Image as ImageIcon, RotateCcw, Trash2, Upload, Save, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function Landing() {
  const { data: config, updateConfig, resetConfig, isLoading, isUpdating, isResetting } = useBrandingConfig();
  const fileInput = useRef<HTMLInputElement>(null);
  const [localConfig, setLocalConfig] = useState(config);

  // Synchroniser les données locales avec les données du serveur
  useEffect(() => {
    if (config) {
      setLocalConfig(config);
      // Appliquer les changements au document
      document.title = config.tabTitle;
      if (config.logoUrl) {
        const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
        if (favicon) {
          favicon.href = config.logoUrl;
        }
      }
    }
  }, [config]);

  const handleSave = () => {
    if (localConfig) {
      updateConfig(localConfig);
    }
  };

  const handleReset = () => {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser toute la configuration ?')) {
      resetConfig();
    }
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) { 
      toast.error("Image uniquement"); 
      return; 
    }
    if (file.size > 1024 * 1024 * 2) { 
      toast.error("Taille max 2 MB"); 
      return; 
    }
    
    const reader = new FileReader();
    reader.onload = () => {
      const logoUrl = String(reader.result);
      setLocalConfig(prev => prev ? { ...prev, logoUrl } : null);
      toast.success("Logo mis à jour localement - Cliquez sur Sauvegarder");
    };
    reader.readAsDataURL(file);
  };

  const updateLocalConfig = (updates: any) => {
    setLocalConfig(prev => prev ? { ...prev, ...updates } : null);
  };

  const updateSection = (sectionKey: string, updates: any) => {
    setLocalConfig(prev => prev ? {
      ...prev,
      sections: {
        ...prev.sections,
        [sectionKey]: { ...prev.sections[sectionKey as keyof typeof prev.sections], ...updates }
      }
    } : null);
  };

  const updateCustomContent = (updates: unknown) => {
    setLocalConfig(prev => prev ? {
      ...prev,
      customContent: { ...prev.customContent, ...updates }
    } : null);
  };

  if (isLoading || !localConfig) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const sections = Object.entries(localConfig.sections).sort((a, b) => a[1].order - b[1].order);
  const enabledCount = sections.filter(([_, section]) => section.enabled).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Landing & Branding"
        subtitle={`${enabledCount}/${sections.length} sections actives · Synchronisé avec la page publique`}
        actions={
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleReset}
              disabled={isResetting}
            >
              {isResetting ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4 mr-2" />
              )}
              Réinitialiser
            </Button>
            <Button 
              onClick={handleSave}
              disabled={isUpdating}
              className="bg-green-600 hover:bg-green-700"
            >
              {isUpdating ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Sauvegarder
            </Button>
          </div>
        }
      />

      <Tabs defaultValue="branding" className="space-y-6">
        <TabsList>
          <TabsTrigger value="branding">Identité</TabsTrigger>
          <TabsTrigger value="sections">Sections</TabsTrigger>
          <TabsTrigger value="content">Contenu</TabsTrigger>
        </TabsList>

        <TabsContent value="branding" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Configuration de l'identité */}
            <Card>
              <CardHeader>
                <CardTitle>Identité de la Plateforme</CardTitle>
                <CardDescription>
                  Configuration de base de votre plateforme
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm">Logo</Label>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="h-16 w-16 rounded-xl border border-border bg-secondary/40 flex items-center justify-center overflow-hidden">
                      {localConfig.logoUrl ? (
                        <img src={localConfig.logoUrl} alt={localConfig.name} className="h-full w-full object-contain" />
                      ) : (
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button size="sm" variant="outline" onClick={() => fileInput.current?.click()}>
                        <Upload className="h-3.5 w-3.5 mr-2" /> Importer
                      </Button>
                      {localConfig.logoUrl && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-destructive" 
                          onClick={() => updateLocalConfig({ logoUrl: null })}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-2" /> Supprimer
                        </Button>
                      )}
                    </div>
                    <input
                      ref={fileInput}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">PNG/SVG · 2 MB max · synchronisé avec le favicon</p>
                </div>

                <div>
                  <Label htmlFor="name">Nom de la plateforme</Label>
                  <Input 
                    id="name"
                    value={localConfig.name} 
                    onChange={(e) => updateLocalConfig({ name: e.target.value })} 
                  />
                </div>

                <div>
                  <Label htmlFor="tagline">Tagline</Label>
                  <Input 
                    id="tagline"
                    value={localConfig.tagline} 
                    onChange={(e) => updateLocalConfig({ tagline: e.target.value })} 
                  />
                </div>

                <div>
                  <Label htmlFor="tabTitle">Titre de l'onglet (navigateur)</Label>
                  <Input 
                    id="tabTitle"
                    value={localConfig.tabTitle} 
                    onChange={(e) => updateLocalConfig({ tabTitle: e.target.value })} 
                  />
                  <p className="text-xs text-muted-foreground mt-1">Mis à jour en direct sur cet onglet.</p>
                </div>
              </CardContent>
            </Card>

            {/* Aperçu en temps réel */}
            <Card>
              <CardHeader>
                <CardTitle>Aperçu en Temps Réel</CardTitle>
                <CardDescription>
                  Prévisualisation de votre configuration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Aperçu onglet navigateur */}
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Onglet Navigateur</div>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background border border-border">
                    {localConfig.logoUrl ? (
                      <img src={localConfig.logoUrl} alt="" className="h-5 w-5 rounded" />
                    ) : (
                      <div className="h-5 w-5 rounded gradient-primary" />
                    )}
                    <span className="text-xs text-muted-foreground truncate">{localConfig.tabTitle}</span>
                  </div>
                </div>

                {/* Aperçu hero section */}
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Section Hero</div>
                  <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-accent/5 border border-border">
                    <div className="font-display font-bold text-lg">{localConfig.name}</div>
                    <div className="text-sm text-muted-foreground mt-1">{localConfig.tagline}</div>
                    <div className="text-xs text-muted-foreground mt-2">
                      {localConfig.customContent.heroTitle}
                    </div>
                  </div>
                </div>

                {/* Statut des sections */}
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Sections Actives</div>
                  <div className="space-y-1">
                    {sections.map(([key, section]) => (
                      <div key={key} className="flex items-center justify-between text-xs">
                        <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <Badge variant={section.enabled ? "default" : "outline"} className="text-xs">
                          {section.enabled ? "Activé" : "Désactivé"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sections" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sections de la Landing Page</CardTitle>
              <CardDescription>
                Activez, désactivez et réordonnez les sections de votre page d'accueil
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sections.map(([key, section], index) => (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, x: -6 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-4 p-4 rounded-lg border bg-card"
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    
                    <span className="text-xs font-mono text-muted-foreground w-8">
                      #{section.order}
                    </span>
                    
                    <div className="flex-1">
                      <div className="font-medium text-sm capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Section {key} de la page d'accueil
                      </div>
                    </div>
                    
                    <Switch 
                      checked={section.enabled} 
                      onCheckedChange={(enabled) => updateSection(key, { enabled })}
                    />
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Contenu Hero */}
            <Card>
              <CardHeader>
                <CardTitle>Section Hero</CardTitle>
                <CardDescription>
                  Contenu principal de votre page d'accueil
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="heroTitle">Titre principal</Label>
                  <Input 
                    id="heroTitle"
                    value={localConfig.customContent.heroTitle}
                    onChange={(e) => updateCustomContent({ heroTitle: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="heroSubtitle">Sous-titre</Label>
                  <Textarea 
                    id="heroSubtitle"
                    value={localConfig.customContent.heroSubtitle}
                    onChange={(e) => updateCustomContent({ heroSubtitle: e.target.value })}
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="heroCtaText">Texte du bouton CTA</Label>
                  <Input 
                    id="heroCtaText"
                    value={localConfig.customContent.heroCtaText}
                    onChange={(e) => updateCustomContent({ heroCtaText: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Contenu About & Contact */}
            <Card>
              <CardHeader>
                <CardTitle>À Propos & Contact</CardTitle>
                <CardDescription>
                  Informations sur votre organisation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="aboutTitle">Titre section À propos</Label>
                  <Input 
                    id="aboutTitle"
                    value={localConfig.customContent.aboutTitle}
                    onChange={(e) => updateCustomContent({ aboutTitle: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="aboutDescription">Description</Label>
                  <Textarea 
                    id="aboutDescription"
                    value={localConfig.customContent.aboutDescription}
                    onChange={(e) => updateCustomContent({ aboutDescription: e.target.value })}
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="contactEmail">Email de contact</Label>
                  <Input 
                    id="contactEmail"
                    type="email"
                    value={localConfig.customContent.contactEmail}
                    onChange={(e) => updateCustomContent({ contactEmail: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="contactPhone">Téléphone</Label>
                  <Input 
                    id="contactPhone"
                    value={localConfig.customContent.contactPhone}
                    onChange={(e) => updateCustomContent({ contactPhone: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
