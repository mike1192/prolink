import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { 
  Palette, 
  Type, 
  Layout, 
  Save, 
  RotateCcw, 
  Eye, 
  Monitor,
  Smartphone,
  Tablet,
  RefreshCw,
  Upload,
  X,
  AlertTriangle
} from "lucide-react";
import { motion } from "framer-motion";
import { 
  useBrandingConfig, 
  useUpdateBrandingConfig, 
  useResetBrandingConfig,
  useBrandingPreview,
  useBrandingValidation,
  type BrandingConfig 
} from "@/hooks/useBranding";

const defaultConfig: BrandingConfig = {
  name: "ProjectLink",
  tagline: "The home for makers shipping the future.",
  tabTitle: "ProjectLink - Connect, Create, Collaborate",
  logoUrl: null,
  primaryColor: "#3b82f6",
  accentColor: "#10b981",
  sections: {
    hero: { enabled: true, order: 1 },
    problemSolution: { enabled: true, order: 2 },
    features: { enabled: true, order: 3 },
    howItWorks: { enabled: true, order: 4 },
    community: { enabled: true, order: 5 },
    about: { enabled: true, order: 6 },
    contact: { enabled: true, order: 7 }
  },
  customContent: {
    heroTitle: "Connect with makers, build the future",
    heroSubtitle: "Join thousands of creators, developers, and innovators collaborating on groundbreaking projects.",
    heroCtaText: "Start Building Today",
    aboutTitle: "About ProjectLink",
    aboutDescription: "We're building the future of collaborative innovation.",
    contactEmail: "hello@projectlink.com",
    contactPhone: "+1 (555) 123-4567"
  }
};

export default function Branding() {
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [hasChanges, setHasChanges] = useState(false);
  const [localConfig, setLocalConfig] = useState<BrandingConfig | null>(null);

  // Hooks pour la gestion du branding
  const { data: config, isLoading, error } = useBrandingConfig();
  const updateMutation = useUpdateBrandingConfig();
  const resetMutation = useResetBrandingConfig();
  const { openPreview } = useBrandingPreview();
  const { validateConfig } = useBrandingValidation();

  // Utiliser la config locale ou celle du serveur
  const currentConfig = localConfig || config || defaultConfig;

  // Initialiser la config locale quand les données arrivent
  useEffect(() => {
    if (config && !localConfig) {
      setLocalConfig(config);
    }
  }, [config, localConfig]);

  const updateConfig = (path: string, value: unknown) => {
    if (!localConfig) return;

    setLocalConfig(prev => {
      if (!prev) return prev;
      const newConfig = { ...prev };
      const keys = path.split('.');
      let current: Record<string, unknown> = newConfig;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newConfig;
    });
    setHasChanges(true);
  };

  const saveConfig = async () => {
    if (!localConfig) return;

    // Valider la configuration avant de sauvegarder
    const validation = validateConfig(localConfig);
    if (!validation.isValid) {
      toast.error(`Erreurs de validation: ${validation.errors.join(', ')}`);
      return;
    }

    try {
      await updateMutation.mutateAsync(localConfig);
      setHasChanges(false);
    } catch (error) {
      // L'erreur est déjà gérée par le hook
    }
  };

  const resetToDefault = async () => {
    try {
      const result = await resetMutation.mutateAsync();
      setLocalConfig(result.config);
      setHasChanges(false);
    } catch (error) {
      // L'erreur est déjà gérée par le hook
    }
  };

  const toggleSection = (sectionKey: string) => {
    updateConfig(`sections.${sectionKey}.enabled`, !currentConfig.sections[sectionKey as keyof typeof currentConfig.sections].enabled);
  };

  const updateSectionOrder = (sectionKey: string, order: number) => {
    updateConfig(`sections.${sectionKey}.order`, order);
  };

  // Validation en temps réel
  const validation = validateConfig(currentConfig);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <Alert className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Erreur lors du chargement de la configuration: {error.message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Configuration du Branding</h1>
          <p className="text-muted-foreground">
            Personnalisez l'apparence et le contenu de votre plateforme
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {hasChanges && (
            <Badge variant="secondary" className="animate-pulse">
              Modifications non sauvegardées
            </Badge>
          )}
          
          <Button
            variant="outline"
            onClick={resetToDefault}
            disabled={updateMutation.isPending || resetMutation.isPending}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Réinitialiser
          </Button>
          
          <Button
            onClick={saveConfig}
            disabled={updateMutation.isPending || !hasChanges || !validation.isValid}
            className="min-w-[120px]"
          >
            {updateMutation.isPending ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {updateMutation.isPending ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Type className="h-4 w-4" />
            Général
          </TabsTrigger>
          <TabsTrigger value="colors" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Couleurs
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2">
            <Type className="h-4 w-4" />
            Contenu
          </TabsTrigger>
          <TabsTrigger value="sections" className="flex items-center gap-2">
            <Layout className="h-4 w-4" />
            Sections
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Aperçu
          </TabsTrigger>
        </TabsList>

        {/* Onglet Général */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="h-5 w-5" />
                Informations Générales
              </CardTitle>
              <CardDescription>
                Configurez les informations de base de votre plateforme
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom de la plateforme</Label>
                  <Input
                    id="name"
                    value={currentConfig.name}
                    onChange={(e) => updateConfig('name', e.target.value)}
                    placeholder="ProjectLink"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="tabTitle">Titre de l'onglet</Label>
                  <Input
                    id="tabTitle"
                    value={currentConfig.tabTitle}
                    onChange={(e) => updateConfig('tabTitle', e.target.value)}
                    placeholder="ProjectLink - Connect, Create, Collaborate"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tagline">Slogan</Label>
                <Input
                  id="tagline"
                  value={currentConfig.tagline}
                  onChange={(e) => updateConfig('tagline', e.target.value)}
                  placeholder="The home for makers shipping the future."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="logoUrl">URL du logo</Label>
                <div className="flex gap-2">
                  <Input
                    id="logoUrl"
                    value={currentConfig.logoUrl || ''}
                    onChange={(e) => updateConfig('logoUrl', e.target.value || null)}
                    placeholder="https://example.com/logo.png"
                  />
                  <Button variant="outline" size="icon">
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
                {currentConfig.logoUrl && (
                  <div className="flex items-center gap-2 p-2 border rounded">
                    <img 
                      src={currentConfig.logoUrl} 
                      alt="Logo preview" 
                      className="h-8 w-8 object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <span className="text-sm text-muted-foreground">Aperçu du logo</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => updateConfig('logoUrl', null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Couleurs */}
        <TabsContent value="colors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Palette de Couleurs
              </CardTitle>
              <CardDescription>
                Définissez les couleurs principales de votre plateforme
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="primaryColor">Couleur Principale</Label>
                  <div className="flex gap-3 items-center">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={currentConfig.primaryColor}
                      onChange={(e) => updateConfig('primaryColor', e.target.value)}
                      className="w-16 h-10 p-1 border rounded"
                    />
                    <Input
                      value={currentConfig.primaryColor}
                      onChange={(e) => updateConfig('primaryColor', e.target.value)}
                      placeholder="#3b82f6"
                      className="flex-1"
                    />
                  </div>
                  <div 
                    className="h-20 rounded-lg border-2 border-dashed border-gray-300"
                    style={{ backgroundColor: currentConfig.primaryColor }}
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="accentColor">Couleur d'Accent</Label>
                  <div className="flex gap-3 items-center">
                    <Input
                      id="accentColor"
                      type="color"
                      value={currentConfig.accentColor}
                      onChange={(e) => updateConfig('accentColor', e.target.value)}
                      className="w-16 h-10 p-1 border rounded"
                    />
                    <Input
                      value={currentConfig.accentColor}
                      onChange={(e) => updateConfig('accentColor', e.target.value)}
                      placeholder="#10b981"
                      className="flex-1"
                    />
                  </div>
                  <div 
                    className="h-20 rounded-lg border-2 border-dashed border-gray-300"
                    style={{ backgroundColor: currentConfig.accentColor }}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="font-medium">Aperçu de la Palette</h4>
                <div className="flex gap-2">
                  <div 
                    className="flex-1 h-12 rounded flex items-center justify-center text-white font-medium"
                    style={{ backgroundColor: currentConfig.primaryColor }}
                  >
                    Principale
                  </div>
                  <div 
                    className="flex-1 h-12 rounded flex items-center justify-center text-white font-medium"
                    style={{ backgroundColor: currentConfig.accentColor }}
                  >
                    Accent
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Contenu */}
        <TabsContent value="content" className="space-y-6">
          <div className="grid gap-6">
            {/* Section Hero */}
            <Card>
              <CardHeader>
                <CardTitle>Section Hero</CardTitle>
                <CardDescription>
                  Contenu de la section d'accueil principale
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="heroTitle">Titre Principal</Label>
                  <Input
                    id="heroTitle"
                    value={currentConfig.customContent.heroTitle}
                    onChange={(e) => updateConfig('customContent.heroTitle', e.target.value)}
                    placeholder="Connect with makers, build the future"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="heroSubtitle">Sous-titre</Label>
                  <Textarea
                    id="heroSubtitle"
                    value={currentConfig.customContent.heroSubtitle}
                    onChange={(e) => updateConfig('customContent.heroSubtitle', e.target.value)}
                    placeholder="Join thousands of creators, developers, and innovators..."
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="heroCtaText">Texte du Bouton CTA</Label>
                  <Input
                    id="heroCtaText"
                    value={currentConfig.customContent.heroCtaText}
                    onChange={(e) => updateConfig('customContent.heroCtaText', e.target.value)}
                    placeholder="Start Building Today"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Section About */}
            <Card>
              <CardHeader>
                <CardTitle>Section À Propos</CardTitle>
                <CardDescription>
                  Contenu de la section à propos de votre plateforme
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="aboutTitle">Titre</Label>
                  <Input
                    id="aboutTitle"
                    value={currentConfig.customContent.aboutTitle}
                    onChange={(e) => updateConfig('customContent.aboutTitle', e.target.value)}
                    placeholder="About ProjectLink"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="aboutDescription">Description</Label>
                  <Textarea
                    id="aboutDescription"
                    value={currentConfig.customContent.aboutDescription}
                    onChange={(e) => updateConfig('customContent.aboutDescription', e.target.value)}
                    placeholder="We're building the future of collaborative innovation."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Section Contact */}
            <Card>
              <CardHeader>
                <CardTitle>Section Contact</CardTitle>
                <CardDescription>
                  Informations de contact de votre plateforme
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Email de Contact</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={currentConfig.customContent.contactEmail}
                      onChange={(e) => updateConfig('customContent.contactEmail', e.target.value)}
                      placeholder="hello@projectlink.com"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">Téléphone</Label>
                    <Input
                      id="contactPhone"
                      value={currentConfig.customContent.contactPhone}
                      onChange={(e) => updateConfig('customContent.contactPhone', e.target.value)}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Onglet Sections */}
        <TabsContent value="sections" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layout className="h-5 w-5" />
                Gestion des Sections
              </CardTitle>
              <CardDescription>
                Activez/désactivez et réorganisez les sections de votre page d'accueil
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(currentConfig.sections).map(([key, section]) => (
                  <motion.div
                    key={key}
                    layout
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={section.enabled}
                        onCheckedChange={() => toggleSection(key)}
                      />
                      <div>
                        <h4 className="font-medium capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Ordre: {section.order}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant={section.enabled ? "default" : "secondary"}>
                        {section.enabled ? "Activée" : "Désactivée"}
                      </Badge>
                      
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateSectionOrder(key, Math.max(1, section.order - 1))}
                          disabled={section.order === 1}
                        >
                          ↑
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateSectionOrder(key, section.order + 1)}
                          disabled={section.order === Object.keys(currentConfig.sections).length}
                        >
                          ↓
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Aperçu */}
        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Aperçu en Temps Réel
              </CardTitle>
              <CardDescription>
                Visualisez les changements en temps réel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Sélecteur de device */}
                <div className="flex items-center gap-2">
                  <Button
                    variant={previewMode === 'desktop' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreviewMode('desktop')}
                  >
                    <Monitor className="h-4 w-4 mr-2" />
                    Desktop
                  </Button>
                  <Button
                    variant={previewMode === 'tablet' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreviewMode('tablet')}
                  >
                    <Tablet className="h-4 w-4 mr-2" />
                    Tablet
                  </Button>
                  <Button
                    variant={previewMode === 'mobile' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreviewMode('mobile')}
                  >
                    <Smartphone className="h-4 w-4 mr-2" />
                    Mobile
                  </Button>
                </div>

                {/* Aperçu */}
                <div className="border rounded-lg overflow-hidden">
                  <div 
                    className={`mx-auto transition-all duration-300 ${
                      previewMode === 'desktop' ? 'w-full' :
                      previewMode === 'tablet' ? 'w-3/4' : 'w-1/3'
                    }`}
                  >
                    <iframe
                      src="http://localhost:8080"
                      className="w-full h-96 border-0"
                      title="Aperçu de la plateforme"
                    />
                  </div>
                </div>

                <div className="text-center">
                  <Button
                    variant="outline"
                    onClick={() => window.open('http://localhost:8080', '_blank')}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Ouvrir dans un nouvel onglet
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}