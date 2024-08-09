import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GithubStatsService {
  private HTTP_CLIENT = inject(HttpClient);
  private BASE_URL = 'https://api.github.com/';

  getUserInfo(username: string) {
    return this.HTTP_CLIENT.get(this.BASE_URL + 'users/' + username);
  }

  getUserRepos(username: string) {
    const headers = new HttpHeaders({
      Authorization: 'token ' + 'ghp_7jJw5j2sHnOqXs6WqK0Qs7p0iA8xjO9vOJ6v'
    });
    return this.HTTP_CLIENT.get(this.BASE_URL + 'users/' + username + '/repos?per_page=100');
  }
}
