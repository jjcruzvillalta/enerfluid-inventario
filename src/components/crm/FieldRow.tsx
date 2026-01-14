import type { ReactNode } from "react";

type FieldRowProps = {
  label: string;
  value?: ReactNode;
  children?: ReactNode;
  editing?: boolean;
};

export function FieldRow({ label, value, children, editing }: FieldRowProps) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <div className="mt-1 text-sm text-slate-700">{editing ? children : value || "-"}</div>
    </div>
  );
}
