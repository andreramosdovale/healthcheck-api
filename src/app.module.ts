import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DrizzleModule } from '@/database/drizzle.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { MeasurementsModule } from './measurements/measurements.module';
import { EvolutionModule } from './evolution/evolution.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DrizzleModule,
    UsersModule,
    AuthModule,
    MeasurementsModule,
    EvolutionModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
