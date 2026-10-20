import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../common/enums.js';
import { ROLES_KEY } from './roles.decorator.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
      role?: Role;
    }>();
    const header = request.headers['x-role'] ?? Role.Viewer;
    const role = header === Role.Manager ? Role.Manager : Role.Viewer;
    request.role = role;

    if (!required.includes(role)) {
      throw new ForbiddenException(
        `Role ${role} is not permitted for this action. Required: ${required.join(', ')}`,
      );
    }
    return true;
  }
}

export function resolveRole(header?: string): Role {
  return header === Role.Manager ? Role.Manager : Role.Viewer;
}
