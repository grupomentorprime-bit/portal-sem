"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/identity/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <Button type="button" variant="ghost" size="sm" onClick={handleLogout} className="h-auto p-0 text-xs underline">
      Salir
    </Button>
  );
}
