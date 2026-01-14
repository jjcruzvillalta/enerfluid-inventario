import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type DetailSectionProps = {
  title: string;
  children: ReactNode;
  className?: string;
};

export function DetailSection({ title, children, className }: DetailSectionProps) {
  return (
    <div className={cn("rounded-2xl border border-line bg-mist/40 p-4", className)}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">{title}</p>
      <div className="mt-3 space-y-3">{children}</div>
    </div>
  );
}
