import { getGithubStats } from "@/lib/github";
import { StatsCard } from "@/components/StatsCard";
import { LanguageList } from "@/components/LanguageList";
import { CommitActivity } from "@/components/CommitActivity";
import {
  Flame,
  Trophy,
  GitCommit,
  Calendar,
  Activity,
  AlertCircle,
} from "lucide-react";

export const revalidate = 3600; // Revalidate every hour

export default async function Home() {
  try {
    const stats = await getGithubStats("Buddhilive");

    return (
      <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-8 flex flex-col items-center justify-center font-sans">
        <div className="w-full max-w-4xl space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
              GitHub Stats Dashboard
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400">
              @Buddhilive's Open Source Contribution Analysis
            </p>
          </div>

          {/* Section 1: Streaks & Commits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatsCard
              title="Current Streak"
              value={`${stats.currentStreak} Days`}
              icon={Flame}
              subValue="Keep it burning!"
              className="border-orange-200 dark:border-orange-900/30 bg-orange-50/50 dark:bg-orange-900/10"
            />
            <StatsCard
              title="Best Streak"
              value={`${stats.bestStreak} Days`}
              icon={Trophy}
              subValue="Personal Record"
              className="border-yellow-200 dark:border-yellow-900/30 bg-yellow-50/50 dark:bg-yellow-900/10"
            />
            <StatsCard
              title="Total Contributions"
              value={stats.lifetimeTotalContributions.toLocaleString()}
              icon={GitCommit}
              subValue={`${new Date(
                stats.firstContributionDate
              ).toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              })} - ${new Date().toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              })}`}
              className="border-blue-200 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-900/10"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Section 2: Top Languages */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2 text-zinc-800 dark:text-zinc-100">
                <Activity className="w-5 h-5 text-indigo-500" />
                Top Languages
              </h2>
              <LanguageList
                languages={stats.languages}
                limit={10}
                type="percentage"
              />
            </div>

            {/* Section 3: Current Year Snapshot */}
            <div className="space-y-4">
              {/* Total Contributions Card */}
              <div className="bg-linear-to-br from-indigo-500 to-purple-600 rounded-xl p-6 text-white shadow-md">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-indigo-100 text-sm font-medium">
                      This Year
                    </p>
                    <h2 className="text-3xl font-bold mt-1">
                      {stats.totalContributions.toLocaleString()}
                    </h2>
                    <p className="text-indigo-200 text-xs mt-1">
                      Total Contributions
                    </p>
                  </div>
                  <Calendar className="w-8 h-8 text-indigo-300 opacity-80" />
                </div>
              </div>

              {/* Top 3 Languages this year */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm flex-1">
                <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-4 uppercase tracking-wider">
                  Top Languages (Current Year)
                </h3>
                <LanguageList languages={stats.topLanguagesYear} type="count" />
              </div>

              {/* Commit Activity Widget */}
              <div className="h-48">
                <CommitActivity weeklyActivity={stats.weeklyActivity} />
              </div>
            </div>
          </div>

          <div className="text-center text-xs text-zinc-400 dark:text-zinc-600 pt-8">
            Copyright &#169; {new Date().getFullYear()} Buddhilive Academy. All
            rights reserved.
          </div>
        </div>
      </main>
    );
  } catch (error: any) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950">
        <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-red-200 dark:border-red-900 rounded-xl p-8 text-center shadow-lg">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">
            Failed to load stats
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">
            {error.message ||
              "An unexpected error occurred while fetching GitHub data."}
          </p>
          <p className="text-xs text-zinc-400">
            Please check your internet connection or GITHUB_TOKEN.
          </p>
        </div>
      </main>
    );
  }
}
