import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DrizzleModule } from '@/database/drizzle.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { MeasurementsModule } from './measurements/measurements.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DrizzleModule,
    UsersModule,
    AuthModule,
    MeasurementsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
