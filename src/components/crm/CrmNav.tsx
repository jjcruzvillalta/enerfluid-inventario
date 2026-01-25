"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Activity,
  BarChart3,
  Briefcase,
  Contact,
  Settings,
  Users,
} from "lucide-react";

const navItems = [
  { href: "/crm/analysis", label: "Analisis", icon: BarChart3 },
  { href: "/crm/clients", label: "Clientes", icon: Users },
  { href: "/crm/contacts", label: "Contactos", icon: Contact },
  { href: "/crm/opportunities", label: "Oportunidades", icon: Briefcase },
  { href: "/crm/activities", label: "Actividades", icon: Activity },
  { href: "/crm/settings", label: "Configuracion", icon: Settings },
];

type CrmNavProps = {
  onNavigate?: () => void;
  className?: string;
};

export function CrmNav({ onNavigate, className }: CrmNavProps) {
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
