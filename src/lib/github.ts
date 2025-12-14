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

      totalCommits += data.totalCommitContributions;
      totalPRs += data.totalPullRequestContributions;

      // Calculate Total from components to be safe/consistent
      // Reference: https://github.com/DenverCoder1/github-readme-streak-stats/blob/main/src/stats.php#L329-L336
      const yearTotal =
        data.totalCommitContributions +
        data.totalPullRequestContributions +
        data.totalIssueContributions +
        data.totalRepositoryContributions +
        data.restrictedContributionsCount;

      console.log(
        `Debug Year ${year}: CalendarTotal=${data.contributionCalendar.totalContributions}, Commits=${data.totalCommitContributions}, Restricted=${data.restrictedContributionsCount}, Sum=${yearTotal}`
      );

      lifetimeTotalContributions += yearTotal;

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

    // Sort ASC by date for easier iteration
    allDays.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    console.log(
      `Debug: CreatedAt=${createdAt.toISOString()}, Years=${years.length}`
    );
    console.log(
      `Debug: Total Lifetime Calculated=${lifetimeTotalContributions}`
    );
    if (allDays.length > 0) {
      console.log(`Debug: First Day: ${JSON.stringify(allDays[0])}`);
    }

    // Calculate Streaks
    // Logic based on: https://github.com/DenverCoder1/github-readme-streak-stats/blob/main/src/stats.php

    // 1. UTC Dates for Today/Yesterday
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0]; // UTC YYYY-MM-DD
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0]; // UTC YYYY-MM-DD

    // 2. Current Streak
    // Loop backwards from the end of sorted days
    let currentStreak = 0;
    let foundStart = false;

    // Reverse iteration to find streak start (Today or Yesterday)
    for (let i = allDays.length - 1; i >= 0; i--) {
      const day = allDays[i];
      const dayDate = day.date; // already YYYY-MM-DD from API

      // If we haven't found the start yet:
      if (!foundStart) {
        if (dayDate === todayStr) {
          // If today has contributions, streak starts here
          if (day.contributionCount > 0) {
            currentStreak++;
            foundStart = true;
          }
        } else if (dayDate === yesterdayStr) {
          // If today didn't catch it (0 contribs or not in list), check yesterday.
          // If yesterday has contributions, streak starts/continues here.
          if (day.contributionCount > 0) {
            currentStreak++;
            foundStart = true;
          }
        } else if (dayDate < yesterdayStr) {
          // If we went past yesterday without finding a start, streak is 0.
          break;
        }
      } else {
        // Once start is found, continue counting backwards as long as consecutive days have contributions
        const prevDay = allDays[i + 1]; // because we are iterating backwards, i+1 is the "future" day we just checked
        // Check for continuity
        const d1 = new Date(dayDate);
        const d2 = new Date(prevDay.date);
        const diffTime = Math.abs(d2.getTime() - d1.getTime());
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          if (day.contributionCount > 0) {
            currentStreak++;
          } else {
            console.log(`Debug: Streak broke at ${dayDate} (0 contributions)`);
            break; // Streak broken by 0 contribution day
          }
        } else if (diffDays === 0) {
          // Duplicate day? (Shouldn't happen with map)
          continue;
        } else {
          console.log(
            `Debug: Streak broke at ${dayDate} (Gap of ${diffDays} days from ${prevDay.date})`
          );
          // Gap > 1 day
          break;
        }
      }
    }

    // 3. Longest Streak
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
            // Continuity broken (gap > 1 day)
            // Note: If gap is exactly 1 day (diffDays=1), it's contiguous.
            // If diffDays > 1, then there were missing days (which are implicitly 0 contributions) OR we just skipped 0-contrib days if they weren't in list?
            // Wait, allDays came from contributionCalendar which includes ALL days, even 0s?
            // Yes, GitHub API returns all days.
            // So if we have a gap > 1 day, it effectively means missing data or 0s (but 0s would be in the loop).
            // Actually, if we hit a 0 contribution day, we go to else block.
            // So this `diffDays` check is just for sanity or missing data cases.

            // However, we must reset if diffDays > 1
            tempStreak = 1; // Restart streak at current day
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
