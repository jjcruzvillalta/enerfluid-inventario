"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import {
  Activity,
  BarChart3,
  Briefcase,
  Contact,
  Home,
  LogOut,
  Settings,
  Users,
} from "lucide-react";

const NavButton = ({ href, icon: Icon, children }) => {
  const pathname = usePathname();
  const isActive = pathname === href;
  return (
    <Link
      href={href}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition",
        isActive
          ? "border-accent/20 bg-accentSoft text-accent shadow-sm"
          : "border-transparent bg-transparent text-slate-600 hover:bg-accentSoft/60"
      )}
    >
      {Icon ? <Icon className="h-4 w-4" /> : null}
      <span>{children}</span>
    </Link>
  );
};

export default function CrmLayout({ children }) {
  const router = useRouter();
  const { user, loading, canAccess, logout } = useAuth();
  const greeting = useMemo(() => user?.displayName || user?.username || "-", [user]);

  if (loading) return <div className="flex h-screen items-center justify-center">Cargando...</div>;
  if (!user) return <div className="flex h-screen items-center justify-center">Inicia sesion...</div>;
  if (!canAccess("crm", "standard")) {
    return <div className="flex h-screen items-center justify-center">Sin acceso a CRM</div>;
  }

  return (
    <div className="min-h-screen text-ink flex bg-gradient-to-br from-white via-cloud to-mist">
      <aside className="hidden lg:flex w-72 flex-col border-r border-line bg-white px-6 py-8 shadow-soft lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold">C</div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Enerfluid Apps</p>
            <p className="text-sm font-semibold text-slate-700">CRM</p>
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-3">
          <NavButton href="/crm/dashboard" icon={BarChart3}>
            Dashboard
          </NavButton>
          <NavButton href="/crm/clients" icon={Users}>
            Clientes
          </NavButton>
          <NavButton href="/crm/contacts" icon={Contact}>
            Contactos
          </NavButton>
          <NavButton href="/crm/opportunities" icon={Briefcase}>
            Oportunidades
          </NavButton>
          <NavButton href="/crm/activities" icon={Activity}>
            Actividades
          </NavButton>
          <NavButton href="/crm/settings" icon={Settings}>
            Configuracion
          </NavButton>
        </div>
        <div className="mt-auto border-t pt-6">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs">
              {greeting[0]?.toUpperCase()}
            </div>
            <div className="text-xs overflow-hidden">
              <p className="font-medium text-slate-700 truncate">{greeting}</p>
              <p className="text-slate-400">Sesion activa</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2 text-slate-500"
            onClick={async () => {
              await logout();
              router.push("/login");
            }}
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesion
          </Button>
        </div>
      </aside>

      <main className="flex-1">
        <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-6 px-4 py-6 md:px-8 lg:px-10">
          <Card className="glass-panel">
            <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm text-slate-500">Hola, {greeting}</p>
                <h2 className="text-xl font-semibold text-ink">Enerfluid CRM</h2>
              </div>
              <Button variant="outline" onClick={() => router.push("/")}>
                <Home className="mr-2 h-4 w-4" />
                Portal
              </Button>
            </CardHeader>
          </Card>
          {children}
        </div>
      </main>
    </div>
  );
}
