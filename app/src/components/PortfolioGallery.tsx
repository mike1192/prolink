import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PortfolioGalleryProps {
  images: string[];
  isOwner?: boolean;
  onAddImage?: () => void;
  onRemoveImage?: (index: number) => void;
}

export function PortfolioGallery({
  images,
  isOwner = false,
  onAddImage,
  onRemoveImage,
}: PortfolioGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (images.length === 0 && !isOwner) return null;

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {images.map((image, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className="relative group aspect-square rounded-xl overflow-hidden cursor-pointer bg-muted"
            onClick={() => setSelectedIndex(index)}
          >
            <img
              src={image}
              alt={`Portfolio ${index + 1}`}
              className="w-full h-full object-cover transition-transform group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
              {isOwner && onRemoveImage && (
                <Button
                  variant="destructive"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveImage(index);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </motion.div>
        ))}

        {isOwner && onAddImage && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-primary flex items-center justify-center transition-colors"
            onClick={onAddImage}
          >
            <div className="text-center">
              <ImageIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Ajouter</span>
            </div>
          </motion.button>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setSelectedIndex(null)}
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-white hover:bg-white/20"
              onClick={() => setSelectedIndex(null)}
            >
              <X className="h-6 w-6" />
            </Button>

            {selectedIndex > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 text-white hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedIndex(selectedIndex - 1);
                }}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
            )}

            {selectedIndex < images.length - 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 text-white hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedIndex(selectedIndex + 1);
                }}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            )}

            <img
              src={images[selectedIndex]}
              alt={`Portfolio ${selectedIndex + 1}`}
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
              <Badge variant="secondary">
                {selectedIndex + 1} / {images.length}
              </Badge>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
