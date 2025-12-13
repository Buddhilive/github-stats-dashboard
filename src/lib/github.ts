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
}

export async function getGithubStats(username: string) {
  if (!GITHUB_TOKEN) {
    throw new Error("GITHUB_TOKEN is not set");
  }

  try {
    // 1. Get user creation date and initial data
    const initialQuery = `
      query UserMeta {
        viewer {
          login
          createdAt
          repositories(first: 100, ownerAffiliations: [OWNER, ORGANIZATION_MEMBER, COLLABORATOR], orderBy: {field: UPDATED_AT, direction: DESC}) {
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
          repositoriesContributedTo(first: 100, includeUserRepositories: true, orderBy: {field: UPDATED_AT, direction: DESC}) {
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

    const initialRes: any = await octokit.graphql(initialQuery);
    const createdAt = new Date(initialRes.viewer.createdAt);
    const currentYear = new Date().getFullYear();
    const creationYear = createdAt.getFullYear();

    // 2. Generate queries for each year to get lifetime stats
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

    // 3. Aggregate Data
    let totalCommits = 0;
    let totalPRs = 0;
    let totalContributionsYear = 0; // Request was "Total contribution for current year"
    let lifetimeTotalContributions = 0; // NEW: Lifetime total

    // Map for deduplication (Date -> Max Contribution Count)
    const dayMap = new Map<string, any>();
    const yearLanguageMap = new Map<string, { count: number; color: string }>();

    years.forEach((year) => {
      const data = statsRes.viewer[`year${year}`];
      if (!data) return;

      console.log(
        `Debug Year ${year}: CalendarTotal=${data.contributionCalendar.totalContributions}, Commits=${data.totalCommitContributions}, Restricted=${data.restrictedContributionsCount}`
      );

      totalCommits += data.totalCommitContributions;
      totalPRs += data.totalPullRequestContributions;

      // Calculate Total from components to be safe/consistent
      lifetimeTotalContributions +=
        data.totalCommitContributions +
        data.totalPullRequestContributions +
        data.totalIssueContributions +
        data.totalRepositoryContributions +
        data.restrictedContributionsCount;

      // Calendar aggregation for streaks
      const weeks = data.contributionCalendar.weeks;
      const yearDays = weeks.flatMap((w: any) => w.contributionDays);

      // Merge into map, preferring MAX count.
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

      // Current Year specifics
      if (year === currentYear) {
        totalContributionsYear = data.contributionCalendar.totalContributions;

        // Year Languages
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

    // Convert map back to array and sort
    let allDays = Array.from(dayMap.values());

    // Sort desc by date
    allDays.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    let currentStreak = 0;
    let bestStreak = 0;

    // Use local date string to match GitHub's "YYYY-MM-DD"
    const today = new Date();
    const todayStr = today.toLocaleDateString("en-CA");
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toLocaleDateString("en-CA");

    // Debug
    console.log(`Debug Streak: Today=${todayStr}, Yesterday=${yesterdayStr}`);

    // Find start of streak
    // We scan the sorted list (Desc).
    // The first entry might be Today, Yesterday, or earlier.

    let startIndex = -1;
    for (let i = 0; i < allDays.length; i++) {
      const d = allDays[i];
      if (d.date === todayStr) {
        if (d.contributionCount > 0) {
          startIndex = i;
          break;
        }
      } else if (d.date === yesterdayStr) {
        if (d.contributionCount > 0) {
          startIndex = i;
          break;
        }
      } else {
        // If we passed both Today and Yesterday without finding a match,
        // and assuming list is sorted (it is), streak is 0.
        // BUT, if today is Monday, previous might be Sunday...
        // If array is dense (no missing days), we just stop.
        if (d.date < yesterdayStr) break;
      }
    }

    if (startIndex !== -1) {
      currentStreak = 1;
      // Iterate backwards in time (forward in array)
      for (let i = startIndex + 1; i < allDays.length; i++) {
        const prevDay = allDays[i - 1];
        const currDay = allDays[i];

        // Check day diff
        const d1 = new Date(prevDay.date);
        const d2 = new Date(currDay.date);
        const diffTime = Math.abs(d1.getTime() - d2.getTime());
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          if (currDay.contributionCount > 0) {
            currentStreak++;
          } else {
            break;
          }
        } else if (diffDays === 0) {
          // Duplicate day? Should be handled by Map, but safe to ignore
          continue;
        } else {
          // Gap > 1 day
          break;
        }
      }
    }

    // Best Streak (Iterate all days sorted ASC to find longest sequence)
    // Sort Asc for simple iteration
    const sortedAsc = [...allDays].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    let tempStreak = 0;
    // Iterate and ensure continuity by date
    // Note: sortedAsc might have gaps if API missing days (unlikely for Calendar but possible)
    // So better to check date diff.

    for (let i = 0; i < sortedAsc.length; i++) {
      const day = sortedAsc[i];
      if (day.contributionCount > 0) {
        // Check if contiguous with previous
        if (tempStreak === 0) {
          tempStreak = 1;
        } else {
          const prevDay = sortedAsc[i - 1];
          const dayDate = new Date(day.date);
          const prevDate = new Date(prevDay.date);
          const diffTime = Math.abs(dayDate.getTime() - prevDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays === 1) {
            tempStreak++;
          } else {
            // Gap detected (even if both have contributions, if gap > 1 day, streak resets)
            // But wait, if diffDays > 1, the days IN BETWEEN had 0 contributions (since we filtered list? No, we didn't filter out 0s from allDays, we just merged years).
            // Actually logic above: `allDays` contains ALL days from calendar (which includes 0s).
            // So `sortedAsc` is contiguous.
            tempStreak++;
          }
        }
        if (tempStreak > bestStreak) bestStreak = tempStreak;
      } else {
        tempStreak = 0;
      }
    }

    // Languages (Global - from initial query which already gets detailed repos)
    const languageMap = new Map<string, { size: number; color: string }>();
    const processRepos = (nodes: any[]) => {
      nodes.forEach((repo: any) => {
        if (!repo || !repo.languages) return;
        repo.languages.edges.forEach((edge: any) => {
          const name = edge.node.name;
          if (name === "Jupyter Notebook") return;
          const size = edge.size;
          const color = edge.node.color;
          const current = languageMap.get(name) || { size: 0, color };
          languageMap.set(name, { size: current.size + size, color });
        });
      });
    };

    if (initialRes.viewer.repositories?.nodes)
      processRepos(initialRes.viewer.repositories.nodes);
    if (initialRes.viewer.repositoriesContributedTo?.nodes)
      processRepos(initialRes.viewer.repositoriesContributedTo.nodes);

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
      .slice(0, 10);

    const topLanguagesYear = Array.from(yearLanguageMap.entries())
      .map(([name, { count, color }]) => ({ name, count, color }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    return {
      totalContributions: totalContributionsYear, // Explicitly current year as per req
      lifetimeTotalContributions, // NEW: Lifetime
      totalCommits, // Lifetime as per user correction
      totalPRs, // Lifetime
      currentStreak,
      bestStreak,
      languages,
      topLanguagesYear,
    };
  } catch (error) {
    console.error("Error fetching GitHub stats:", error);
    throw error;
  }
}
