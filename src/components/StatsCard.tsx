import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  subValue?: string;
  className?: string;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  subValue,
  className,
}: StatsCardProps) {
  return (
    <div
      className={cn(
        "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm transition-all hover:shadow-md",
        className
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          {title}
        </h3>
        {Icon && <Icon className="w-5 h-5 text-zinc-400 dark:text-zinc-500" />}
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          {value}
        </span>
        {subValue && (
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {subValue}
          </span>
        )}
      </div>
    </div>
  );
}
