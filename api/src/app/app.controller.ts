import { Controller, Get, Param } from '@nestjs/common';

import { AppService } from './app.service';
import { AxiosResponse } from 'axios';
import { lastValueFrom } from 'rxjs';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/:username')
  async getData(@Param('username') username: string): Promise<AxiosResponse<any>> {
    return await lastValueFrom(this.appService.getUserInfo(username));
  }

  @Get('repos/:username')
  async getUserRepos(@Param('username') username: string): Promise<AxiosResponse<any>> {
    return await lastValueFrom(this.appService.getUserRepos(username));
  }

  @Get('lang/:repourl')
  async getRepoLanguageData(@Param('repourl') repoUrl: string): Promise<AxiosResponse<any>> {
    return await lastValueFrom(this.appService.getRepoLanguagesStats(repoUrl));
  }
}
