import { Component, inject } from '@angular/core';
import { GithubStatsService } from '../shared/services/github-stats.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  private githubStatsService = inject(GithubStatsService);
  fetchUserInfo(){
    this.githubStatsService.getUserInfo('buddhilive').subscribe(data => console.log(data));
  }
}
