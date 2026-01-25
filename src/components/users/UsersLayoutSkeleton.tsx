"use client";

import { Skeleton } from "@/components/common/Skeleton";
import { Card, CardHeader } from "@/components/ui/card";

export function UsersLayoutSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-cloud to-mist text-ink">
      <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-6 px-4 py-6 md:px-8 lg:px-10">
        <Card className="glass-panel">
          <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-48" />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Skeleton className="h-10 w-28 rounded-xl" />
              <Skeleton className="h-10 w-32 rounded-xl" />
            </div>
          </CardHeader>
        </Card>
        <div className="grid gap-6">
          {Array.from({ length: 2 }).map((_, index) => (
            <Card key={`users-skel-${index}`} className="p-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="mt-3 h-32 w-full rounded-2xl" />
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
