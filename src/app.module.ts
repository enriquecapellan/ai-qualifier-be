import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './db/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { ICPModule } from './modules/icp/icp.module';
import { QualificationModule } from './modules/prospects/prospects.module';
import { WebSocketModule } from './modules/websocket/websocket.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    AuthModule,
    CompaniesModule,
    ICPModule,
    QualificationModule,
    WebSocketModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
