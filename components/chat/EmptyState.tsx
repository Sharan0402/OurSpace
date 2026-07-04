import { Heart } from "lucide-react";

export function EmptyState() {
  return (
    <div className="flex h-full animate-fade-in-up flex-col items-center justify-center gap-4 px-8 text-center">
      <div className="animate-float">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/[0.04] ring-1 ring-white/10">
          <Heart className="h-8 w-8 fill-primary/30 text-primary" />
        </div>
      </div>
      <div className="space-y-1.5">
        <h3 className="text-xl font-semibold">Your space is ready</h3>
        <p className="mx-auto max-w-xs text-sm leading-relaxed text-muted-foreground">
          This is the beginning of your private little world. Say hello 💛
        </p>
      </div>
    </div>
  );
}
