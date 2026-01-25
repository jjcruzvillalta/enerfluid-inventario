"use client";

import { Skeleton } from "@/components/common/Skeleton";
import { Card, CardHeader } from "@/components/ui/card";

export function InventoryLayoutSkeleton() {
  return (
    <div className="min-h-screen text-ink flex overflow-x-hidden bg-gradient-to-br from-white via-cloud to-mist">
      <aside className="hidden lg:flex w-72 flex-col border-r border-line bg-white px-6 py-8 shadow-soft lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
        <Skeleton className="h-10 w-40" />
        <div className="mt-10 flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={`nav-${index}`} className="h-12 w-full rounded-2xl" />
          ))}
        </div>
        <div className="mt-auto border-t pt-6">
          <div className="flex items-center gap-3 mb-4 px-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <Skeleton className="h-9 w-full rounded-xl" />
        </div>
      </aside>

      <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden">
        <div className="mx-auto flex w-full min-w-0 max-w-screen-2xl flex-col gap-6 px-4 py-6 md:px-8 lg:px-10">
          <Card className="glass-panel">
            <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-6 w-64" />
              </div>
              <div className="flex w-full flex-wrap items-center gap-3 md:w-auto">
                <Skeleton className="h-8 w-24 rounded-full" />
                <Skeleton className="h-10 w-32 rounded-xl" />
                <Skeleton className="h-10 w-24 rounded-xl" />
              </div>
            </CardHeader>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Card key={`card-${index}`} className="p-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="mt-3 h-48 w-full rounded-2xl" />
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
