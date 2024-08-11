import { Component, inject } from '@angular/core';
import { GithubStatsService } from '../shared/services/github-stats.service';
import { FormsModule } from '@angular/forms';
import { GithubUserProfile } from '../shared/constants/github-user.interface';
import { UserDetailsComponent } from '../components/user-details/user-details.component';
import { LanguageStatsComponent } from '../components/language-stats/language-stats.component';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    FormsModule,
    UserDetailsComponent,
    LanguageStatsComponent,
    InputTextModule,
    ButtonModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  private githubStatsService = inject(GithubStatsService);

  username!: string;
  userProfile!: GithubUserProfile;
  repoData: Array<any> = [];

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
    });
  }
}