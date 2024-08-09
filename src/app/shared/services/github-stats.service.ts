import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GithubStatsService {
  private HTTP_CLIENT = inject(HttpClient);
  private BASE_URL = 'api/';

  getUserInfo(username: string) {
    return this.HTTP_CLIENT.get(this.BASE_URL + username);
  }

  getUserRepos(username: string) {
    return this.HTTP_CLIENT.get(this.BASE_URL);
  }

  getRepoLanguagesStats(languagesUrl: string) {
    return this.HTTP_CLIENT.get(languagesUrl);
  }
}
