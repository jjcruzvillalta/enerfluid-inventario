"use client";

import { Bell, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";

type CrmHeaderProps = {
  greeting: string;
  unreadCount: number;
  onNotifications: () => void;
  onPortal: () => void;
};

export function CrmHeader({ greeting, unreadCount, onNotifications, onPortal }: CrmHeaderProps) {
  return (
    <Card className="glass-panel">
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-slate-500">Hola, {greeting}</p>
          <h2 className="text-xl font-semibold text-ink">Enerfluid CRM</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="relative" onClick={onNotifications}>
            <Bell className="mr-2 h-4 w-4" />
            Notificaciones
            {unreadCount > 0 ? (
              <span className="ml-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent px-2 text-[10px] text-white">
                {unreadCount}
              </span>
            ) : null}
          </Button>
          <Button variant="outline" onClick={onPortal}>
            <Home className="mr-2 h-4 w-4" />
            Portal
          </Button>
        </div>
      </CardHeader>
    </Card>
  );
}
