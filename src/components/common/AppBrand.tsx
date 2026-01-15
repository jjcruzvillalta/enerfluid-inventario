"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

type AppBrandProps = {
    appName: string;
    subtitle?: string;
    className?: string;
    compact?: boolean;
};

export function AppBrand({ appName, subtitle = "Enerfluid Apps", className, compact = false }: AppBrandProps) {
    return (
        <div className={cn("flex items-center gap-3", className)}>
            <div
                className={cn(
                    "overflow-hidden rounded-lg border border-slate-200 bg-white shadow-soft",
                    compact ? "h-9 w-9" : "h-10 w-10"
                )}
            >
                <Image
                    src="/enerfluid-icon-192.png"
                    alt="Enerfluid"
                    width={40}
                    height={40}
                    className="h-full w-full object-cover"
                />
            </div>
            <div>
                <p
                    className={cn(
                        "text-xs font-semibold uppercase tracking-[0.2em] text-slate-400",
                        compact && "text-[10px]"
                    )}
                >
                    {subtitle}
                </p>
                <p className={cn("text-sm font-semibold text-slate-700", compact && "text-xs")}>{appName}</p>
            </div>
        </div>
    );
}
