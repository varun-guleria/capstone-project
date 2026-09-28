import { cn } from "../../lib/utils,js";

export function Progress({ value = 0, className, ...props }) {
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-indigo-100", className)} {...props}>
      <div className="h-full bg-indigo-600 transition-all" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}
