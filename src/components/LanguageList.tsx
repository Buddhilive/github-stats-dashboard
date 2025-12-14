import { cn } from "@/lib/utils";

interface Language {
  name: string;
  percentage?: number;
  count?: number; // for "top 3 contributed" which might use count/size
  color: string;
}

interface LanguageListProps {
  languages: Language[];
  type?: "percentage" | "count"; // Display format
  limit?: number;
  className?: string;
}

export function LanguageList({
  languages,
  type = "percentage",
  limit,
  className,
}: LanguageListProps) {
  const displayLangs = limit ? languages.slice(0, limit) : languages;

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {displayLangs.map((lang) => {
        // If type is percentage, use percentage directly.
        // If count/size, we might want to normalize, but for now just show the name and color.
        // Or if it's "top 3", user just wants the names?
        // Let's assume we display progress bar for percentage type only.

        return (
          <div key={lang.name} className="flex items-center gap-3">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: lang.color }}
            />
            <div className="flex-1 flex flex-col gap-1">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  {lang.name}
                </span>
                {type === "percentage" && (
                  <span className="text-zinc-500 dark:text-zinc-400">
                    {lang.percentage}%
                  </span>
                )}
              </div>
              {type === "percentage" && (
                <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${lang.percentage}%`,
                      backgroundColor: lang.color,
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
