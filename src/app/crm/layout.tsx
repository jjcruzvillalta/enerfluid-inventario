"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/context/AuthContext";
import { NotificationsDialog } from "@/components/crm/NotificationsDialog";
import { NoteDialog } from "@/components/crm/NoteDialog";
import { AppBrand } from "@/components/common/AppBrand";
import { CrmNav } from "@/components/crm/CrmNav";
import { CrmSidebar } from "@/components/crm/CrmSidebar";
import { CrmHeader } from "@/components/crm/CrmHeader";
import { CrmLayoutSkeleton } from "@/components/crm/CrmLayoutSkeleton";
import { LogOut, Menu } from "lucide-react";

export default function CrmLayout({ children }) {
  const router = useRouter();
  const { user, loading, canAccess, logout } = useAuth();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteId, setNoteId] = useState<string | null>(null);
  const greeting = useMemo(() => user?.displayName || user?.username || "-", [user]);

  const loadNotifications = async () => {
    const res = await fetch("/api/crm/notifications", { cache: "no-store", credentials: "include" });
    if (!res.ok) return;
    const data = await res.json();
    const unread = (data?.notifications || []).filter((item: any) => item.is_read === false).length;
    setUnreadCount(unread);
  };

  const openNoteDetail = (id?: string | null) => {
    if (!id) return;
    setNoteId(id);
    setNoteOpen(true);
  };

  useEffect(() => {
    if (!user) return;
    loadNotifications();
  }, [user]);

  useEffect(() => {
    if (!notificationsOpen) {
      loadNotifications();
    }
  }, [notificationsOpen]);

  if (loading) return <CrmLayoutSkeleton />;
  if (!user) return <div className="flex h-screen items-center justify-center">Inicia sesion...</div>;
  if (!canAccess("crm", "standard")) {
    return <div className="flex h-screen items-center justify-center">Sin acceso a CRM</div>;
  }

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <div className="min-h-screen h-screen text-ink flex overflow-hidden bg-gradient-to-br from-white via-cloud to-mist">
      <CrmSidebar greeting={greeting} onLogout={handleLogout} />

      <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden">
        <div className="mx-auto flex w-full min-w-0 max-w-screen-2xl flex-col gap-6 px-4 py-6 md:px-8 lg:px-10">
          <CrmHeader
            greeting={greeting}
            unreadCount={unreadCount}
            onNotifications={() => setNotificationsOpen(true)}
            onPortal={() => router.push("/")}
          />
          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <div className="flex items-center justify-between rounded-2xl border border-line bg-white px-4 py-3 shadow-soft lg:hidden">
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-4 w-4" />
                  <span className="sr-only">Abrir menu</span>
                </Button>
              </SheetTrigger>
              <div className="text-sm font-semibold text-slate-700">Enerfluid CRM</div>
            </div>
            <SheetContent side="left" className="flex flex-col gap-4">
              <AppBrand appName="CRM" compact />
              <CrmNav className="flex flex-col gap-2" onNavigate={() => setMobileNavOpen(false)} />
              <div className="mt-auto border-t pt-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs">
                    {greeting[0]?.toUpperCase()}
                  </div>
                  <div className="text-xs overflow-hidden">
                    <p className="font-medium text-slate-700 truncate">{greeting}</p>
                    <p className="text-slate-400">Sesion activa</p>
                  </div>
                </div>
                <SheetClose asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 text-slate-500"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4" />
                    Cerrar sesion
                  </Button>
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>
          {children}
        </div>
      </main>

      <NotificationsDialog
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        onNavigate={({ entity, noteId: nextNoteId }) => {
          const routes: Record<string, string> = {
            client: "/crm/clients",
            contact: "/crm/contacts",
            opportunity: "/crm/opportunities",
            activity: "/crm/activities",
          };
          if (entity) {
            const target = routes[entity.type] || "/crm/analysis";
            router.push(target);
          }
          openNoteDetail(nextNoteId);
          setNotificationsOpen(false);
        }}
      />
      <NoteDialog open={noteOpen} noteId={noteId} onClose={() => setNoteOpen(false)} onSaved={loadNotifications} />
    </div>
  );
}
