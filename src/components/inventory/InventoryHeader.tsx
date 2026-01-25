"use client";

import { Clock, Home, Menu, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";

type InventoryHeaderProps = {
  greeting: string;
  loading: boolean;
  loadStatus: string;
  onRefresh: () => void;
  onPortal: () => void;
  onOpenMenu: () => void;
};

export function InventoryHeader({
  greeting,
  loading,
  loadStatus,
  onRefresh,
  onPortal,
  onOpenMenu,
}: InventoryHeaderProps) {
  return (
    <Card className="glass-panel">
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={onOpenMenu}>
            <Menu className="h-5 w-5" />
          </Button>
          <div>
            <p className="text-sm text-slate-500">Hola, {greeting}</p>
            <h2 className="text-xl font-semibold text-ink">Panel de Analisis de Inventario</h2>
          </div>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 md:w-auto md:gap-3">
          <div
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs whitespace-nowrap",
              loading ? "border-accent/30 text-accent" : "border-line text-slate-500"
            )}
          >
            {loading ? <Clock className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            {loading ? "Cargando" : loadStatus}
          </div>
          <Button variant="outline" className="w-full sm:w-auto" onClick={onRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualizar
          </Button>
          <Button variant="outline" className="w-full text-slate-500 sm:w-auto" onClick={onPortal}>
            <Home className="mr-2 h-4 w-4" />
            Portal
          </Button>
        </div>
      </CardHeader>
    </Card>
  );
}
