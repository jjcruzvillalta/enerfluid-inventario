import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef(({ className, type = "text", ...props }, ref) => (
  <input
    ref={ref}
    type={type}
    className={cn(
      "flex h-10 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/40",
      className
    )}
    {...props}
  />
));
Input.displayName = "Input";

export { Input };
