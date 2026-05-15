import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Image, Upload } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

interface Project {
  id: string;
  title: string;
  description: string;
  skills_needed: string[];
  project_type: string | null;
  images?: string[];
}

interface Props {
  project: Project | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSuccess: () => void;
}

export function EditProjectDialog({ project, open, onOpenChange, onSuccess }: Props) {
  const { token } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skill, setSkill] = useState("");
  const [projectType, setProjectType] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  // Initialize form when project changes
  useEffect(() => {
    if (project) {
      setTitle(project.title);
      setDescription(project.description);
      setSkills(project.skills_needed || []);
      setProjectType(project.project_type || "");
      setImages(project.images || []);
      setNewImageFiles([]);
    }
  }, [project]);

  const addSkill = () => {
    const s = skill.trim();
    if (!s || skills.includes(s) || skills.length >= 10) return;
    setSkills([...skills, s]);
    setSkill("");
  };

  const removeSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !project) return;

    if (!title.trim()) {
      toast.error("Le titre est requis");
      return;
    }

    setLoading(true);
    try {
      console.log("📤 Début modification...", {
        projectId: project.id,
        title: title.trim(),
        skillsCount: skills.length,
        imagesCount: images.length,
        newFilesCount: newImageFiles.length,
      });

      // Upload new images first
      let finalImages = [...images.filter((img) => !img.startsWith("blob:"))]; // Keep only existing images

      if (newImageFiles.length > 0) {
        console.log("📸 Upload de", newImageFiles.length, "nouvelle(s) image(s)");
        const uploadedUrls = await uploadImages();
        console.log("✅ Images uploadées:", uploadedUrls);
        finalImages = [...finalImages, ...uploadedUrls];
      }

      const payload = {
        title: title.trim(),
        description: description.trim(),
        skills_needed: skills,
        project_type: projectType || null,
        images: finalImages.length > 0 ? finalImages : null,
      };

      console.log("📦 Payload envoyé:", payload);

      const response = await fetch(`http://localhost:3000/api/projects/${project.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      console.log("📡 Réponse status:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error("❌ Erreur API:", errorData);
        throw new Error(errorData?.error || "Erreur lors de la modification");
      }

      const result = await response.json();
      console.log("✅ Projet modifié avec succès:", result);

      toast.success("Projet mis à jour ✨");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("❌ Erreur:", error);
      toast.error((error as Error).message || "Erreur de mise à jour");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSkill();
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const existingImagesCount = images.filter((img) => !img.startsWith("blob:")).length;
    const remainingSlots = 3 - existingImagesCount - newImageFiles.length;
    if (remainingSlots <= 0) {
      toast.error("Maximum 3 images autorisées");
      return;
    }

    const filesToAdd = Array.from(files).slice(0, remainingSlots);
    const newFiles = [...newImageFiles, ...filesToAdd];

    // Create preview URLs
    const newPreviews = filesToAdd.map((file) => URL.createObjectURL(file));
    setImages([...images, ...newPreviews]);
    setNewImageFiles(newFiles);

    if (filesToAdd.length < files.length) {
      toast.warning(`Seules ${remainingSlots} image(s) ont été ajoutées (max 3)`);
    }
  };

  const removeImage = (index: number) => {
    // Revoke URL to avoid memory leaks
    if (images[index] && images[index].startsWith("blob:")) {
      URL.revokeObjectURL(images[index]);
    }
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);

    // Also remove from newImageFiles if it was a blob
    if (images[index] && images[index].startsWith("blob:")) {
      const blobIndex = images.slice(0, index).filter((img) => img.startsWith("blob:")).length;
      setNewImageFiles(newImageFiles.filter((_, i) => i !== blobIndex));
    }
  };

  const uploadImages = async (): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (const file of newImageFiles) {
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

        if (!response.ok) {
          throw new Error("Erreur upload");
        }

        const data = await response.json();
        uploadedUrls.push(data.url);
      } catch (error) {
        console.error("Erreur upload image:", error);
        toast.error(`Erreur lors de l'upload de ${file.name}`);
      }
    }

    return uploadedUrls;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass max-w-lg">
        <DialogHeader>
          <DialogTitle>Modifier le projet</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label>Titre du projet</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              placeholder="Nom de votre projet"
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
              rows={5}
              placeholder="Décrivez votre projet en détail..."
            />
            <p className="text-right text-xs text-muted-foreground">{description.length}/1000</p>
          </div>

          <div className="space-y-2">
            <Label>Type de projet</Label>
            <Input
              value={projectType}
              onChange={(e) => setProjectType(e.target.value)}
              maxLength={50}
              placeholder="ex: Open Source, Startup, Freelance..."
            />
          </div>

          <div className="space-y-2">
            <Label>Compétences recherchées</Label>
            <div className="flex gap-2">
              <Input
                value={skill}
                onChange={(e) => setSkill(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ajouter une compétence"
                maxLength={30}
              />
              <Button
                type="button"
                size="sm"
                onClick={addSkill}
                disabled={!skill.trim() || skills.length >= 10}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {skills.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {skills.map((s, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="border-primary/30 bg-primary/10 text-primary gap-1"
                  >
                    {s}
                    <button
                      type="button"
                      onClick={() => removeSkill(index)}
                      className="ml-1 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">{skills.length}/10 compétences</p>
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
                  id="image-upload"
                  disabled={images.length >= 3}
                />
                <label
                  htmlFor="image-upload"
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

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1 glass"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="flex-1 gradient-bg-primary glow"
              disabled={loading || !title.trim()}
            >
              {loading ? "Modification..." : "Enregistrer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
