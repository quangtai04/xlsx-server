import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScriptsModule } from './modules/scripts/scripts.module';
import { MongooseModule } from '@nestjs/mongoose';
import { AppMiddleware } from './middleware/app.middleware';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './jwt/constants';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        uri: config.get<string>('MONGO_URI'),
        dbName: config.get<string>('MONGO_DB'),
        auth: {
          username: config.get<string>('MONGO_USER'),
          password: config.get<string>('MONGO_PASS'),
        },
      }),
      inject: [ConfigService],
    }),
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '7200s' },
    }),
    ScheduleModule.forRoot(),
    ScriptsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  constructor() {}
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AppMiddleware).forRoutes('');
  }
}
