type LegendItem = { label: string; color: string };

type CustomerLegendProps = {
  items?: LegendItem[];
};

export const CustomerLegend = ({ items }: CustomerLegendProps) => {
  if (!items?.length) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-600">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
};
