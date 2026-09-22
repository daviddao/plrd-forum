import { NotFoundContent } from "@/components/NotFoundContent";

export const metadata = { title: "Page Not Found" };

/** `notFound()` thrown inside the shell already has the chrome from the group layout. */
export default function NotFound() {
  return <NotFoundContent />;
}
