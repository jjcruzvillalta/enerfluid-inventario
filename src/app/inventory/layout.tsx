"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useInventory } from "@/context/InventoryContext";
import { useAuth } from "@/context/AuthContext";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { InventoryProvider } from "@/context/InventoryContext";
import { AppBrand } from "@/components/common/AppBrand";
import { InventoryNav } from "@/components/inventory/InventoryNav";
import { InventorySidebar } from "@/components/inventory/InventorySidebar";
import { InventoryHeader } from "@/components/inventory/InventoryHeader";
import { InventoryLayoutSkeleton } from "@/components/inventory/InventoryLayoutSkeleton";

export default function InventoryLayout({ children }) {
    return (
        <InventoryProvider>
            <InventoryLayoutContent>{children}</InventoryLayoutContent>
        </InventoryProvider>
    );
}

function InventoryLayoutContent({ children }) {
    const { loading, loadStatus, loadAllFromSupabase, initialized } = useInventory();
    const { user, loading: authLoading, canAccess, logout } = useAuth();
    const router = useRouter();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const userGreeting = useMemo(() => {
        const name = String(user?.displayName || user?.username || "");
        return name || "-";
    }, [user]);

    if (authLoading || !initialized) return <InventoryLayoutSkeleton />;
    if (!user) return <div className="flex h-screen items-center justify-center">Inicia sesion...</div>;
    if (!canAccess("inventory", "standard")) {
        return <div className="flex h-screen items-center justify-center">Sin acceso a Inventario</div>;
    }

    const handleLogout = async () => {
        await logout();
        router.push("/login");
    };

    return (
        <div className="min-h-screen text-ink flex overflow-x-hidden bg-gradient-to-br from-white via-cloud to-mist">
            <InventorySidebar user={user} onLogout={handleLogout} />

            <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
                <SheetContent side="left" className="w-72 px-6 py-8">
                    <AppBrand appName="Inventario" compact />
                    <InventoryNav className="mt-10" onNavigate={() => setDrawerOpen(false)} />
                </SheetContent>
            </Sheet>

            <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden">
                <div className="mx-auto flex w-full min-w-0 max-w-screen-2xl flex-col gap-6 px-4 py-6 md:px-8 lg:px-10">
                    <InventoryHeader
                        greeting={userGreeting}
                        loading={loading}
                        loadStatus={loadStatus}
                        onRefresh={() => loadAllFromSupabase({ force: true })}
                        onPortal={() => router.push("/")}
                        onOpenMenu={() => setDrawerOpen(true)}
                    />

                    {children}
                </div>
            </main>
        </div>
    );
}
