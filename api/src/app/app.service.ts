import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { map, Observable } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { AxiosResponse } from 'axios';
@Injectable()
export class AppService {
  private BASE_URL = 'https://api.github.com/';
  private headers = {};

  constructor(
    private httpClient: HttpService,
    private _configService: ConfigService) {
    this.headers = {
      Authorization: 'token ' + _configService.get('GITHUB_AUTH_TOKEN')
    }
  }

  getUserInfo(username: string): Observable<any> {
    return this.httpClient.get(this.BASE_URL + 'users/' + username, {
      headers: this.headers
    }).pipe(
      map((response: AxiosResponse) => response.data)
    );
  }
}
