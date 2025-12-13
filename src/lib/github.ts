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

  const query = `
    query UserStats($login: String!) {
      user(login: $login) {
        contributionsCollection {
          totalCommitContributions
          totalPullRequestContributions
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                contributionCount
                date
              }
            }
          }
          commitContributionsByRepository(maxRepositories: 100) {
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
        repositories(first: 100, ownerAffiliations: OWNER, orderBy: {field: UPDATED_AT, direction: DESC}) {
          nodes {
            name
            isFork
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
        repositoriesContributedTo(first: 100, includeUserRepositories: false, orderBy: {field: UPDATED_AT, direction: DESC}) {
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

  try {
    const response: any = await octokit.graphql(query, {
      login: username,
    });

    const user = response.user;
    const collection = user.contributionsCollection;
    const calendar = collection.contributionCalendar;

    // 1. Streaks and Total Contributions
    const weeks = calendar.weeks;
    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;

    // Flatten days
    const days = weeks.flatMap((w: any) => w.contributionDays);

    // Calculate streaks
    // Sort days by date just in case, though API returns sorted
    // Iterate to find streaks
    const today = new Date().toISOString().split("T")[0];

    // Improve streak calc: check if today or yesterday has contrib to keep current streak alive
    let ongoingStreak = 0;
    let isCurrentStreakAlive = false;

    // Iterate backwards for current streak
    for (let i = days.length - 1; i >= 0; i--) {
      const day = days[i];
      if (day.contributionCount > 0) {
        ongoingStreak++;
        isCurrentStreakAlive = true;
      } else {
        // If it's today and 0, streak might still be valid if yesterday was active
        if (day.date === today && ongoingStreak === 0) {
          continue; // Check yesterday
        }
        break;
      }
    }
    currentStreak = ongoingStreak;

    // Best streak calculation
    for (const day of days) {
      if (day.contributionCount > 0) {
        tempStreak++;
        if (tempStreak > bestStreak) {
          bestStreak = tempStreak;
        }
      } else {
        tempStreak = 0;
      }
    }

    // 2. Language Stats (Global)
    const languageMap = new Map<string, { size: number; color: string }>();

    const processRepos = (nodes: any[]) => {
      nodes.forEach((repo: any) => {
        if (!repo.languages) return;
        repo.languages.edges.forEach((edge: any) => {
          const name = edge.node.name;
          if (name === "Jupyter Notebook") return; // Exclude as requested
          const size = edge.size;
          const color = edge.node.color;

          const current = languageMap.get(name) || { size: 0, color };
          languageMap.set(name, { size: current.size + size, color });
        });
      });
    };

    if (user.repositories?.nodes) processRepos(user.repositories.nodes);
    if (user.repositoriesContributedTo?.nodes)
      processRepos(user.repositoriesContributedTo.nodes);

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
        size, // keep size for sorting
      }))
      .sort((a, b) => b.size - a.size)
      .slice(0, 10); // Top 10

    // 3. Top 3 Languages for Current Year
    // Use contribute to repos data
    const yearLanguageMap = new Map<string, { count: number; color: string }>();
    const contributedRepos = collection.commitContributionsByRepository;

    contributedRepos.forEach((item: any) => {
      const repo = item.repository;
      const contribCount = item.contributions.totalCount; // Weight by contributions? Or just presence?
      // Let's weight by contribution count * repo language distribution?
      // Simple approach: Just look at languages in these repos and sum their sizes, weighted by commit count?
      // Or just count occurrences?
      // Plan: "Top 3 languages contributed for current year"
      // I'll take the languages of the repos I contributed to this year, and sum up their sizes.
      // This assumes if I contributed to a repo, I worked with its main languages.

      if (repo.languages) {
        repo.languages.edges.forEach((edge: any) => {
          const name = edge.node.name;
          if (name === "Jupyter Notebook") return;
          const size = edge.size;
          const color = edge.node.color;

          // Weighting size by log of contributions or just raw size?
          // Just raw size of the active repos is a fair proxy for "what tech stack I worked on".
          const current = yearLanguageMap.get(name) || { count: 0, color };
          yearLanguageMap.set(name, { count: current.count + size, color });
        });
      }
    });

    const topLanguagesYear = Array.from(yearLanguageMap.entries())
      .map(([name, { count, color }]) => ({ name, count, color }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    return {
      totalContributions: calendar.totalContributions,
      totalCommits: collection.totalCommitContributions,
      totalPRs: collection.totalPullRequestContributions,
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
