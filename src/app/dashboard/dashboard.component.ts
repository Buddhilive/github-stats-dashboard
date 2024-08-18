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
  userProfile!: GithubUserProfile | undefined;
  repoData: Array<any> = [];

  fetchUserInfo() {
    if (sessionStorage.getItem(`github-stats-${this.username}`)) {
      this.userProfile = JSON.parse(sessionStorage.getItem(`github-stats-${this.username}`)!);
      this.username = this.userProfile?.username ? this.userProfile?.username : '';
    } else {
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
        sessionStorage.setItem(`github-stats-${this.username}`, JSON.stringify(this.userProfile));
      });
    }
    this.fetchAllRepos();
  }

  fetchAllRepos() {
    if (sessionStorage.getItem(`github-stats-repos-${this.username}`)) {
      this.repoData = JSON.parse(sessionStorage.getItem(`github-stats-repos-${this.username}`)!);
    } else {
      this.githubStatsService.getAllRepos(this.username).subscribe((data: any) => {
        this.repoData = data.filter((item: any) => !item.fork);
        sessionStorage.setItem(`github-stats-repos-${this.username}`, JSON.stringify(this.repoData));
      });
    }
  }

  newProfile() {
    this.userProfile = undefined;
    this.username = '';
  }
}