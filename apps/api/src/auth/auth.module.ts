import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './roles.guard.js';

@Global()
@Module({
  providers: [
    RolesGuard,
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
  exports: [RolesGuard],
})
export class AuthModule {}
