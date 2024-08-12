import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    HttpModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    /* ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'client/browser'),
      exclude: ['api/*']
    }) */
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
