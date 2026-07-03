import { Heart } from "lucide-react";

export function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/30 to-accent/30">
        <Heart className="h-7 w-7 text-primary" />
      </div>
      <h3 className="text-lg font-semibold">Your space is ready</h3>
      <p className="max-w-xs text-sm text-muted-foreground">
        This is the beginning of your private little world. Say hello 💛
      </p>
    </div>
  );
}
