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
}
