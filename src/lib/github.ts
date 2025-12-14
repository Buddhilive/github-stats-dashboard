import { Octokit } from "octokit";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

// Initialize Octokit
const octokit = new Octokit({
  auth: GITHUB_TOKEN,
});

export interface LanguageParam {
  name: string;
  size: number;
  color: string;
}

export interface Stats {
  totalContributions: number;
  lifetimeTotalContributions: number;
  totalCommits: number;
  totalPRs: number;
  currentStreak: number;
  bestStreak: number;
  languages: { name: string; percentage: number; color: string }[];
  topLanguagesYear: { name: string; count: number; color: string }[]; // Using count as proxy for activity
  weeklyActivity: { week: number; count: number }[];
  firstContributionDate: string;
}

export async function getGithubStats(username: string) {
  if (!GITHUB_TOKEN) {
    throw new Error("GITHUB_TOKEN is not set");
  }

  try {
    // 1. Get user creation date
    const userQuery = `
      query UserMeta {
        viewer {
          login
          createdAt
        }
      }
    `;
    const userRes: any = await octokit.graphql(userQuery);
    const createdAt = new Date(userRes.viewer.createdAt);

    // 2. Fetch ALL repositories for language stats (Pagination)
    // github-readme-stats logic: owned repos, not forks.
    const languageMap = new Map<string, { size: number; color: string }>();
    let hasNextPage = true;
    let cursor: string | null = null;

    while (hasNextPage) {
      const reposQuery = `
        query Repos($after: String) {
          viewer {
            repositories(first: 100, ownerAffiliations: [OWNER], isFork: false, orderBy: {field: UPDATED_AT, direction: DESC}, after: $after) {
              pageInfo {
                hasNextPage
                endCursor
              }
              nodes {
                name
                languages(first: 10, orderBy: {field: SIZE, direction: DESC}) {
                  edges {
                    size
                    node {
                      name
                      color
                    }
                  }
                }
              }
            }
          }
        }
      `;

      const reposRes: any = await octokit.graphql(reposQuery, {
        after: cursor,
      });
      const reposData = reposRes.viewer.repositories;

      if (reposData.nodes) {
        reposData.nodes.forEach((repo: any) => {
          if (!repo || !repo.languages) return;
          repo.languages.edges.forEach((edge: any) => {
            const name = edge.node.name;
            if (name === "Jupyter Notebook") return; // Optional exclusion commonly used
            const size = edge.size;
            const color = edge.node.color;
            const current = languageMap.get(name) || { size: 0, color };
            languageMap.set(name, { size: current.size + size, color });
          });
        });
      }

      hasNextPage = reposData.pageInfo.hasNextPage;
      cursor = reposData.pageInfo.endCursor;
    }

    // 3. Generate queries for each year to get lifetime stats (Contributions)
    // We keep this logic as it provides the contribution graph and total stats
    const currentYear = new Date().getFullYear();
    const creationYear = createdAt.getFullYear();
    let statsQueryBody = "";
    const years = [];

    for (let y = creationYear; y <= currentYear; y++) {
      years.push(y);
      const from = `${y}-01-01T00:00:00Z`;
      const to = `${y}-12-31T23:59:59Z`;
      statsQueryBody += `
        year${y}: contributionsCollection(from: "${from}", to: "${to}") {
          totalCommitContributions
          totalPullRequestContributions
          totalIssueContributions
          totalRepositoryContributions
          restrictedContributionsCount
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                contributionCount
                date
              }
            }
          }
          commitContributionsByRepository(maxRepositories: 50) {
            repository {
              name
              languages(first: 5, orderBy: {field: SIZE, direction: DESC}) {
                edges {
                  size
                  node {
                    name
                    color
                  }
                }
              }
            }
            contributions {
              totalCount
            }
          }
        }
      `;
    }

    const statsQuery = `
      query UserLifetimeStats {
        viewer {
          ${statsQueryBody}
        }
      }
    `;

    const statsRes: any = await octokit.graphql(statsQuery);

    // 4. Aggregate Contribution Data
    let totalCommits = 0;
    let totalPRs = 0;
    let totalContributionsYear = 0;
    let lifetimeTotalContributions = 0;

    const dayMap = new Map<string, any>();
    const yearLanguageMap = new Map<string, { count: number; color: string }>(); // For "Top Languages this Year" (optional, kept for now)
    let weeklyActivity: { week: number; count: number }[] = [];

    // Process yearly contribution data
    years.forEach((year) => {
      const data = statsRes.viewer[`year${year}`];
      if (!data) return;

      totalCommits += data.totalCommitContributions;
      totalPRs += data.totalPullRequestContributions;

      const yearTotal =
        data.totalCommitContributions +
        data.totalPullRequestContributions +
        data.totalIssueContributions +
        data.totalRepositoryContributions +
        data.restrictedContributionsCount;

      lifetimeTotalContributions += yearTotal;

      const weeks = data.contributionCalendar.weeks;
      const yearDays = weeks.flatMap((w: any) => w.contributionDays);

      yearDays.forEach((day: any) => {
        const existing = dayMap.get(day.date);
        if (!existing) {
          dayMap.set(day.date, day);
        } else {
          if (day.contributionCount > existing.contributionCount) {
            dayMap.set(day.date, day);
          }
        }
      });

      if (year === currentYear) {
        totalContributionsYear = data.contributionCalendar.totalContributions;

        // Process Weekly Activity for the current year (or last 52 weeks if expanded logic needed)
        // For simpler "Last 12 Months" effectively, we can just grab the weekly aggregated data from the API
        // But the API returns weeks for the calendar year.
        // Let's just map the weeks directly for now to show the "Contribution Graph" style
        weeklyActivity = weeks.map((w: any, index: number) => ({
          week: index,
          count: w.contributionDays.reduce(
            (acc: number, d: any) => acc + d.contributionCount,
            0
          ),
        }));

        // Year Languages (kept from previous logic as a separate "Top Languages Year" metric if needed)
        const contributedRepos = data.commitContributionsByRepository;
        contributedRepos.forEach((item: any) => {
          const repo = item.repository;
          if (repo && repo.languages) {
            repo.languages.edges.forEach((edge: any) => {
              const name = edge.node.name;
              if (name === "Jupyter Notebook") return;
              const size = edge.size;
              const color = edge.node.color;
              const current = yearLanguageMap.get(name) || { count: 0, color };
              yearLanguageMap.set(name, { count: current.count + size, color });
            });
          }
        });
      }
    });

    let allDays = Array.from(dayMap.values());
    allDays.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Calculate Streaks
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    // Current Streak
    let currentStreak = 0;
    let foundStart = false;

    for (let i = allDays.length - 1; i >= 0; i--) {
      const day = allDays[i];
      const dayDate = day.date;

      if (!foundStart) {
        if (dayDate === todayStr) {
          if (day.contributionCount > 0) {
            currentStreak++;
            foundStart = true;
          }
        } else if (dayDate === yesterdayStr) {
          if (day.contributionCount > 0) {
            currentStreak++;
            foundStart = true;
          }
        } else if (dayDate < yesterdayStr) {
          break;
        }
      } else {
        const prevDay = allDays[i + 1];
        const d1 = new Date(dayDate);
        const d2 = new Date(prevDay.date);
        const diffTime = Math.abs(d2.getTime() - d1.getTime());
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          if (day.contributionCount > 0) {
            currentStreak++;
          } else {
            break;
          }
        } else if (diffDays === 0) {
          continue;
        } else {
          break;
        }
      }
    }

    // Best Streak
    let bestStreak = 0;
    let tempStreak = 0;
    for (let i = 0; i < allDays.length; i++) {
      const day = allDays[i];
      if (day.contributionCount > 0) {
        if (tempStreak === 0) {
          tempStreak = 1;
        } else {
          const prevDay = allDays[i - 1];
          const d1 = new Date(prevDay.date);
          const d2 = new Date(day.date);
          const diffTime = Math.abs(d2.getTime() - d1.getTime());
          const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays === 1) {
            tempStreak++;
          } else {
            tempStreak = 1;
          }
        }
        if (tempStreak > bestStreak) bestStreak = tempStreak;
      } else {
        tempStreak = 0;
      }
    }

    // Process Languages (Global - from our new Pagination loop)
    const totalSize = Array.from(languageMap.values()).reduce(
      (acc, val) => acc + val.size,
      0
    );
    const languages = Array.from(languageMap.entries())
      .map(([name, { size, color }]) => ({
        name,
        percentage:
          totalSize > 0 ? parseFloat(((size / totalSize) * 100).toFixed(2)) : 0,
        color,
        size,
      }))
      .sort((a, b) => b.size - a.size)
      .slice(0, 10); // Check if we want more, but 10 is standard

    const topLanguagesYear = Array.from(yearLanguageMap.entries())
      .map(([name, { count, color }]) => ({ name, count, color }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    return {
      totalContributions: totalContributionsYear,
      lifetimeTotalContributions,
      totalCommits,
      totalPRs,
      currentStreak,
      bestStreak,
      languages,
      topLanguagesYear,
      weeklyActivity,
      firstContributionDate:
        allDays.find((d) => d.contributionCount > 0)?.date ||
        createdAt.toISOString(),
    };
  } catch (error) {
    console.error("Error fetching GitHub stats:", error);
    throw error;
  }
}
