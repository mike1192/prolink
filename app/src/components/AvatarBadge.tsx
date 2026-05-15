interface AvatarBadgeProps {
  name: string | null | undefined;
  size?: "sm" | "md" | "lg" | "xl";
  url?: string | null;
}

const sizes = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
  xl: "h-24 w-24 text-2xl",
};

function colorFor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;
  return `linear-gradient(135deg, oklch(0.65 0.22 ${hue}), oklch(0.55 0.27 ${(hue + 60) % 360}))`;
}

export function AvatarBadge({ name, size = "md", url }: AvatarBadgeProps) {
  const safe = name || "?";
  const initials = safe
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (url) {
    return (
      <img
        src={url}
        alt={safe}
        className={`${sizes[size]} rounded-full object-cover ring-2 ring-border`}
      />
    );
  }

  return (
    <div
      className={`${sizes[size]} flex shrink-0 items-center justify-center rounded-full font-semibold text-white ring-2 ring-border`}
      style={{ background: colorFor(safe) }}
      aria-label={safe}
    >
      {initials || "?"}
    </div>
  );
}
