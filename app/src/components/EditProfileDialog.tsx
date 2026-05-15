import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Globe, Github, Twitter, Linkedin } from "lucide-react";
import { updateProfile, type Profile } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

interface Props {
  profile: Profile;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export function EditProfileDialog({ profile, open, onOpenChange }: Props) {
  const { token } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState(profile.display_name || "");
  const [bio, setBio] = useState(profile.bio || "");
  const [jobTitle, setJobTitle] = useState(profile.job_title || "");
  const [location, setLocation] = useState(profile.location || "");
  const [website, setWebsite] = useState(profile.website || "");
  const [github, setGithub] = useState(profile.github || "");
  const [twitter, setTwitter] = useState(profile.twitter || "");
  const [linkedin, setLinkedin] = useState(profile.linkedin || "");
  const [skills, setSkills] = useState<string[]>(profile.skills || []);
  const [skill, setSkill] = useState("");
  const [loading, setLoading] = useState(false);

  const addSkill = () => {
    const s = skill.trim();
    if (!s || skills.includes(s) || skills.length >= 10) return;
    setSkills([...skills, s]);
    setSkill("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setLoading(true);
    try {
      await updateProfile(
        profile.id,
        {
          display_name: displayName.trim().slice(0, 60) || null,
          bio: bio.trim().slice(0, 500) || null,
          job_title: jobTitle.trim().slice(0, 100) || null,
          location: location.trim().slice(0, 100) || null,
          website: website.trim().slice(0, 255) || null,
          github: github.trim().slice(0, 100) || null,
          twitter: twitter.trim().slice(0, 100) || null,
          linkedin: linkedin.trim().slice(0, 100) || null,
          skills,
        },
        token,
      );
      toast.success("Profil mis à jour ✨");
      qc.invalidateQueries();
      onOpenChange(false);
      navigate({ to: "/u/$username", params: { username: profile.username } });
    } catch {
      toast.error("Erreur de mise à jour");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass max-w-lg">
        <DialogHeader>
          <DialogTitle>Éditer mon profil</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nom affiché</Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={60}
            />
          </div>
          <div className="space-y-2">
            <Label>Métier / Titre</Label>
            <Input
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              maxLength={100}
              placeholder="Développeur Full Stack, Designer UI/UX..."
            />
          </div>
          <div className="space-y-2">
            <Label>Localisation</Label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              maxLength={100}
              placeholder="Paris, France"
            />
          </div>
          <div className="space-y-2">
            <Label>Bio</Label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={500}
              rows={4}
              placeholder="Parle de toi en quelques mots…"
            />
            <p className="text-right text-xs text-muted-foreground">{bio.length}/500</p>
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Site web
            </Label>
            <Input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              maxLength={255}
              placeholder="https://monsite.com"
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Github className="h-4 w-4" />
              GitHub
            </Label>
            <Input
              value={github}
              onChange={(e) => setGithub(e.target.value)}
              maxLength={100}
              placeholder="username"
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Twitter className="h-4 w-4" />
              Twitter / X
            </Label>
            <Input
              value={twitter}
              onChange={(e) => setTwitter(e.target.value)}
              maxLength={100}
              placeholder="@username"
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Linkedin className="h-4 w-4" />
              LinkedIn
            </Label>
            <Input
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
              maxLength={100}
              placeholder="username ou URL"
            />
          </div>
          <div className="space-y-2">
            <Label>Compétences</Label>
            <div className="flex gap-2">
              <Input
                value={skill}
                onChange={(e) => setSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSkill();
                  }
                }}
                placeholder="React, UI/UX, Marketing…"
                maxLength={30}
              />
              <Button type="button" variant="glass" onClick={addSkill}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {skills.map((s) => (
                  <Badge
                    key={s}
                    variant="outline"
                    className="cursor-pointer border-neon/30 bg-neon/10 text-neon"
                    onClick={() => setSkills(skills.filter((x) => x !== s))}
                  >
                    {s}
                    <X className="ml-1 h-3 w-3" />
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
            {loading ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
