"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppBrand } from "@/components/common/AppBrand";
import { InventoryNav } from "@/components/inventory/InventoryNav";

type InventorySidebarProps = {
  user: { displayName?: string | null; username?: string | null } | null;
  onLogout: () => void;
};

export function InventorySidebar({ user, onLogout }: InventorySidebarProps) {
  const initial = (user?.displayName || user?.username || "-")[0]?.toUpperCase();
  return (
    <aside className="hidden lg:flex w-72 flex-col border-r border-line bg-white px-6 py-8 shadow-soft lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
      <AppBrand appName="Inventario" />
      <InventoryNav className="mt-10" />
      <div className="mt-auto border-t pt-6">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs">
            {initial}
          </div>
          <div className="text-xs overflow-hidden">
            <p className="font-medium text-slate-700 truncate">{user?.displayName || user?.username}</p>
            <p className="text-slate-400">Sesion activa</p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="w-full gap-2 text-slate-500" onClick={onLogout}>
          <LogOut className="h-4 w-4" />
          Cerrar sesion
        </Button>
      </div>
    </aside>
  );
}
