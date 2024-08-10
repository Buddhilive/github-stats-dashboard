import { Component, inject } from '@angular/core';
import { GithubStatsService } from '../shared/services/github-stats.service';
import { FormsModule } from '@angular/forms';
import { GithubUserProfile } from '../shared/constants/github-user.interface';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    FormsModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  private githubStatsService = inject(GithubStatsService);

  username!: string;
  userProfile!: GithubUserProfile;

  fetchUserInfo() {
    this.githubStatsService.getUserInfo(this.username).subscribe((data: any) => {
      this.userProfile = {
        username: this.username,
        avatar_url: data.avatar_url,
        bio: data.bio,
        name: data.name,
        location: data.location
      };
      sessionStorage.setItem('github-stats-username', JSON.stringify(this.userProfile));
      sessionStorage.setItem('github-stats-username2', JSON.stringify(data));
    });
  }
}