import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { AppService } from './app.service';
import { AxiosResponse } from 'axios';
import { lastValueFrom } from 'rxjs';
import { RepoDetailsDTO } from './dto/repo-details.dto';

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

  @Post('lang')
  async getRepoLanguageData(@Body() repoDetails: RepoDetailsDTO): Promise<AxiosResponse<any>> {
    return await lastValueFrom(this.appService.getRepoLanguagesStats(repoDetails.language_url));
  }
}
