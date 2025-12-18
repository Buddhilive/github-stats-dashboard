# GitHub Stats Dashboard

A sleek, modern dashboard to showcase your GitHub statistics, including streaks, total contributions, and language usage.

![Dashboard Preview](https://githubstats.buddhilive.com/)

## 🚀 Getting Started

This project is designed to be easily personalizable. Follow these steps to set up your own dashboard.

### 1. Prerequisites

- A GitHub account.
- A **GitHub Personal Access Token (Classic)**.
  - Go to [GitHub Token Settings](https://github.com/settings/tokens).
  - Generate a new token (classic) with `read:user` and `repo` scopes.

### 2. Setup

Clone the repository and install dependencies:

```bash
git clone https://github.com/Buddhilive/github-stats-dashboard.git
cd github-stats-dashboard
npm install
# or
pnpm install
```

### 3. Environment Variables

Create a `.env.local` file in the root directory and add your GitHub credentials:

```env
GITHUB_TOKEN=your_personal_access_token_here
GITHUB_USERNAME=your_github_username_here
```

| Variable          | Description                                  |
| :---------------- | :------------------------------------------- |
| `GITHUB_TOKEN`    | Your GitHub Personal Access Token (Classic). |
| `GITHUB_USERNAME` | Your GitHub username (e.g., `Buddhilive`).   |

### 4. Running Locally

Start the development server:

```bash
npm run dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see your stats!

## 🛠️ Features

- **Contribution Analysis**: Lifetime and yearly contribution tracking.
- **Streak Tracker**: Current and best commit streaks.
- **Language Breakdown**: Analysis of your most used programming languages.
- **Weekly Activity**: Visual graph of your contribution frequency.
- **Responsive Design**: Dark and light mode support with a premium aesthetic.

## 📦 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Data Fetching**: [Octokit](https://github.com/octokit/octokit.js) & GitHub GraphQL API

## 🛡️ License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Created by [Buddhilive Academy](https://buddhilive.com).
