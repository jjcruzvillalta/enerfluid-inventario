import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

type ChartWrapProps = {
  title: string;
  empty?: boolean;
  children: ReactNode;
};

export const ChartWrap = ({ title, empty, children }: ChartWrapProps) => (
  <Card className="p-4">
    <h4 className="text-sm font-semibold text-ink">{title}</h4>
    <div className="relative mt-3 h-60">
      {children}
      {empty ? (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-400">
          Sin datos para graficar.
        </div>
      ) : null}
    </div>
  </Card>
);
