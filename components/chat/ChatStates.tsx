import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export function ChatLoading() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
      <Spinner className="h-6 w-6" />
      <p className="text-sm">Opening your space…</p>
    </div>
  );
}

export function ChatError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/20">
        <AlertCircle className="h-6 w-6 text-destructive" />
      </div>
      <div>
        <h3 className="font-semibold">Couldn&apos;t load messages</h3>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">{message}</p>
      </div>
      <Button variant="glass" onClick={onRetry}>
        <RefreshCw className="h-4 w-4" /> Try again
      </Button>
    </div>
  );
}
