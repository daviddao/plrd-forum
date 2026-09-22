import { AppShell } from "@/components/AppShell";
import { NotFoundContent } from "@/components/NotFoundContent";

export const metadata = { title: "Page Not Found" };

/** Unmatched URLs render in the root layout, so wrap in the shell explicitly. */
export default function NotFound() {
  return (
    <AppShell>
      <NotFoundContent />
    </AppShell>
  );
}
