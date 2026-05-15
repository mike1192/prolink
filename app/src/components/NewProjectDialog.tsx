import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Upload } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { createProject } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const TYPES = ["Side-project", "Startup", "Open Source", "Recherche", "Étudiant", "Bénévolat"];

export function NewProjectDialog({ trigger }: { trigger?: React.ReactNode }) {
  const { user, token, openLogin } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState(TYPES[0]);
  const [skill, setSkill] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const addSkill = () => {
    const s = skill.trim();
    if (!s || skills.includes(s) || skills.length >= 8) return;
    setSkills([...skills, s]);
    setSkill("");
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = 3 - images.length - imageFiles.length;
    if (remainingSlots <= 0) {
      toast.error("Maximum 3 images autorisées");
      return;
    }

    const filesToAdd = Array.from(files).slice(0, remainingSlots);
    const newFiles = [...imageFiles, ...filesToAdd];
    const newPreviews = filesToAdd.map((file) => URL.createObjectURL(file));
    setImages([...images, ...newPreviews]);
    setImageFiles(newFiles);

    if (filesToAdd.length < files.length) {
      toast.warning(`Seules ${remainingSlots} image(s) ont été ajoutées (max 3)`);
    }
  };

  const removeImage = (index: number) => {
    if (images[index] && images[index].startsWith("blob:")) {
      URL.revokeObjectURL(images[index]);
    }
    setImages(images.filter((_, i) => i !== index));
    setImageFiles(imageFiles.filter((_, i) => i !== index));
  };

  const uploadImages = async (): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    for (const file of imageFiles) {
      const formData = new FormData();
      formData.append("image", file);
      try {
        const response = await fetch("http://localhost:3000/api/upload", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });
        if (!response.ok) throw new Error("Erreur upload");
        const data = await response.json();
        uploadedUrls.push(data.url);
      } catch (error) {
        console.error("Erreur upload image:", error);
        toast.error(`Erreur lors de l'upload de ${file.name}`);
      }
    }
    return uploadedUrls;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !token) return openLogin();
    if (title.trim().length < 3) return toast.error("Titre trop court");
    if (description.trim().length < 10) return toast.error("Description trop courte");
    setLoading(true);
    try {
      // Upload images first
      let finalImages: string[] = [];
      if (imageFiles.length > 0) {
        finalImages = await uploadImages();
      }

      await createProject(
        {
          title: title.trim().slice(0, 120),
          description: description.trim().slice(0, 1000),
          skills_needed: skills,
          project_type: type,
          images: finalImages.length > 0 ? finalImages : undefined,
        },
        token,
      );
      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: ["userProjects", user.id] });
      toast.success("Projet publié ! 🚀");
      setOpen(false);
      setTitle("");
      setDescription("");
      setSkills([]);
      setImages([]);
      setImageFiles([]);
    } catch {
      toast.error("Impossible de publier le projet");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (o && !user) {
          openLogin();
          return;
        }
        setOpen(o);
      }}
    >
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="hero" size="lg" className="text-sm sm:text-base px-4 sm:px-6">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Publier un projet</span>
            <span className="sm:hidden">Publier</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="glass max-w-lg w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Nouveau projet ✨</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titre</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Une app pour matcher les développeurs..."
              maxLength={120}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="desc">Description</Label>
            <Textarea
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explique ton projet, ton objectif, ce que tu cherches…"
              maxLength={1000}
              rows={4}
              required
            />
            <p className="text-right text-xs text-muted-foreground">{description.length}/1000</p>
          </div>

          <div className="space-y-2">
            <Label>Type</Label>
            <div className="flex flex-wrap gap-2">
              {TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`rounded-full border px-3 py-1 text-xs transition-all ${
                    type === t
                      ? "gradient-bg-primary border-transparent text-primary-foreground"
                      : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Compétences recherchées</Label>
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
                placeholder="React, Design, Marketing…"
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
                    className="cursor-pointer border-primary/30 bg-primary/10 text-primary"
                    onClick={() => setSkills(skills.filter((x) => x !== s))}
                  >
                    {s}
                    <X className="ml-1 h-3 w-3" />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Images (max 3)</Label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                  id="new-image-upload"
                  disabled={images.length >= 3}
                />
                <label
                  htmlFor="new-image-upload"
                  className={`cursor-pointer p-2 rounded-lg transition-colors ${
                    images.length >= 3
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-primary/10 hover:text-primary"
                  }`}
                >
                  <Upload className="h-5 w-5" />
                </label>
              </div>
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {images.map((img, index) => (
                  <div
                    key={index}
                    className="relative group aspect-square rounded-lg overflow-hidden border border-border/50"
                  >
                    <img
                      src={img}
                      alt={`Image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 p-1.5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {images.length > 0 && (
              <p className="text-xs text-muted-foreground">{images.length}/3 images</p>
            )}
          </div>

          <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
            {loading ? "Publication…" : "Publier 🚀"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
