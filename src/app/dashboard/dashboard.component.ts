import { Component, inject } from '@angular/core';
import { GithubStatsService } from '../shared/services/github-stats.service';
import { FormsModule } from '@angular/forms';
import { GithubUserProfile } from '../shared/constants/github-user.interface';
import { catchError, forkJoin } from 'rxjs';
import { ChartModule } from 'primeng/chart';
import { UserDetailsComponent } from '../components/user-details/user-details.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    FormsModule,
    ChartModule,
    UserDetailsComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  private githubStatsService = inject(GithubStatsService);

  username!: string;
  userProfile!: GithubUserProfile;
  repoData: Array<any> = [];
  chartData: any;

  fetchUserInfo() {
    this.githubStatsService.getUserInfo(this.username).subscribe((data: any) => {
      this.userProfile = {
        username: this.username,
        avatar_url: data.avatar_url,
        bio: data.bio,
        name: data.name,
        location: data.location,
        public_repos: data.public_repos,
        public_gists: data.public_gists,
        followers: data.followers,
        following: data.following,
        created_at: data.created_at
      };
      sessionStorage.setItem('github-stats-username', JSON.stringify(this.userProfile));
      sessionStorage.setItem('github-stats-username2', JSON.stringify(data));
      this.fetchAllRepos();
    });
  }

  fetchAllRepos() {
    this.githubStatsService.getAllRepos(this.username).subscribe((data: any) => {
      this.repoData = data;
      localStorage.setItem('github-stats-repos', JSON.stringify(data));
      this.fetchLanguageStats();
    });
  }

  fetchLanguageStats() {
    this.repoData = JSON.parse(localStorage.getItem('github-stats-repos')!);
    const languageStatsObservables = this.repoData.map((repo: any) =>
      this.githubStatsService.getRepoLanguageStats(repo.languages_url).pipe(
        catchError((error) => {
          console.error(`Failed to fetch language stats for repo: ${repo.name}`, error);
          return [];
        })
      )
    );

    forkJoin(languageStatsObservables).subscribe(
      (repoLanguageData: Array<any>) => {
        localStorage.setItem('github-stats-repos-lan', JSON.stringify(repoLanguageData));
        const allLangSummary = this.sumByKeyAndTotal(repoLanguageData);
        localStorage.setItem('github-stats-lan-summary', JSON.stringify(allLangSummary));
      },
      (error) => console.error('An error occurred while fetching language stats', error)
    );
  }

  private sumByKeyAndTotal(data: Array<any>) {
    const groupedData: Object = data.reduce((acc, curr) => {
      Object.entries(curr).forEach(([key, value]) => {
        acc[key] = (acc[key] || 0) + value;
      });
      return acc;
    }, {});

    const totalSum = Object.values(groupedData).reduce((acc, val) => acc + val, 0);
    this.chartData = this.formatDataForChart(groupedData);

    return { groupedData, totalSum };
  }

  private formatDataForChart(groupedData: Object) {
    const labels = Object.keys(groupedData);
    const data = Object.values(groupedData);

    return {
      labels,
      datasets: [{
        label: 'Data',
        data,
        backgroundColor: Array.from({ length: labels.length }, () => `rgb(${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)})`)
      }]
    };
  }

}