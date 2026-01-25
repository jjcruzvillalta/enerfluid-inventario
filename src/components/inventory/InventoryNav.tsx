"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Settings, UploadCloud, Warehouse } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/inventory/upload", label: "Carga de archivos", icon: UploadCloud },
  { href: "/inventory/analysis", label: "Analisis", icon: BarChart3 },
  { href: "/inventory/replenishment", label: "Reposicion", icon: Warehouse },
  { href: "/inventory/settings", label: "Configuracion", icon: Settings },
];

type InventoryNavProps = {
  onNavigate?: () => void;
  className?: string;
};

export function InventoryNav({ onNavigate, className }: InventoryNavProps) {
  const pathname = usePathname();
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition",
              isActive
                ? "border-accent/20 bg-accentSoft text-accent shadow-sm"
                : "border-transparent bg-transparent text-slate-600 hover:bg-accentSoft/60"
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
