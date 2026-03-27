import { requireSuperadminOrRedirect } from "@/lib/auth/requireSuperadmin";
import { AdminShell } from "./AdminShell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireSuperadminOrRedirect();
  return <AdminShell>{children}</AdminShell>;
}
