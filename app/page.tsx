import { AppShell } from "@/components/layout/AppShell";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";

export default function Home() {
  return (
    <ProtectedRoute>
      <AppShell />
    </ProtectedRoute>
  );
}
