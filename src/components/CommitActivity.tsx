"use client";

import { Activity } from "lucide-react";

interface CommitActivityProps {
  weeklyActivity: { week: number; count: number }[];
}

export function CommitActivity({ weeklyActivity }: CommitActivityProps) {
  // Find the max count to normalize bar heights
  const maxCount = Math.max(...weeklyActivity.map((w) => w.count), 1); // Avoid division by zero

  // Take the last 52 weeks if more exist, or fill up if fewer
  const weeksToShow = weeklyActivity.slice(-52);

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm h-full">
      <h2 className="text-lg font-semibold mb-6 flex items-center gap-2 text-zinc-800 dark:text-zinc-100">
        <Activity className="w-5 h-5 text-amber-500" />
        Commit Activity
        <span className="text-xs font-normal text-zinc-400 ml-auto">
          Last 12 Months
        </span>
      </h2>

      <div className="flex items-end justify-between gap-1 h-[calc(100%-3rem)] w-full">
        {weeksToShow.map((week, i) => {
          const heightPercent = (week.count / maxCount) * 100;
          return (
            <div
              key={i}
              className="group relative flex-1 min-w-[3px] rounded-sm bg-amber-100 dark:bg-amber-900/20 hover:bg-amber-500 dark:hover:bg-amber-500 transition-colors"
              style={{
                height: "100%", // Container height
                display: "flex",
                alignItems: "flex-end",
              }}
            >
              <div
                className="w-full rounded-sm bg-amber-500 dark:bg-amber-500/80 group-hover:bg-amber-600 dark:group-hover:bg-amber-400 transition-colors"
                style={{ height: `${Math.max(heightPercent, 5)}%` }} // Min height for visibility
              />

              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10 w-max">
                <div className="bg-zinc-800 text-white text-xs rounded py-1 px-2 shadow-lg">
                  {week.count} commits
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
