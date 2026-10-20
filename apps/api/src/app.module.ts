import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module.js';
import { AuditModule } from './audit/audit.module.js';
import { TriageModule } from './triage/triage.module.js';
import { RequestsModule } from './requests/requests.module.js';
import { WorkflowModule } from './workflow/workflow.module.js';
import { RequestEntity } from './entities/request.entity.js';
import { ProposalEntity } from './entities/proposal.entity.js';
import { AuditEventEntity } from './entities/audit-event.entity.js';
import { MergeLinkEntity } from './entities/merge-link.entity.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.get<string>('DATABASE_HOST', 'localhost'),
        port: Number(config.get<string>('DATABASE_PORT', '5432')),
        username: config.get<string>('DATABASE_USER', 'triage'),
        password: config.get<string>('DATABASE_PASSWORD', 'triage'),
        database: config.get<string>('DATABASE_NAME', 'ai_triage'),
        entities: [
          RequestEntity,
          ProposalEntity,
          AuditEventEntity,
          MergeLinkEntity,
        ],
        synchronize: true,
      }),
    }),
    AuthModule,
    AuditModule,
    TriageModule,
    RequestsModule,
    WorkflowModule,
  ],
})
export class AppModule {}
