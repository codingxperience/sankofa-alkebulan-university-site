import {
  applyDecorators,
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  Injectable,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { forbidden, unauthorized } from '../common/http/errors';
import type { Actor } from '../audit/audit.service';
import type { Permission } from './permissions';
import { SessionsService, type StaffPrincipal } from './sessions.service';

const REQUIRED_PERMISSIONS = Symbol('required-permissions');

type StaffRequest = Request & { staff?: StaffPrincipal };

@Injectable()
export class StaffGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly sessions: SessionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<StaffRequest>();
    const staff = await this.sessions.authenticate(req);
    if (!staff) {
      throw unauthorized('Your session has ended. Please sign in again.', 'session_required');
    }
    req.staff = staff;

    const required = this.reflector.getAllAndOverride<Permission[] | undefined>(REQUIRED_PERMISSIONS, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (required?.some((permission) => !staff.permissions.has(permission))) {
      throw forbidden('Your role does not include this part of the console.', 'permission_denied');
    }
    return true;
  }
}

/**
 * Restricts a controller or route to signed-in staff holding every listed
 * permission. With no permissions listed, any signed-in staff member passes.
 */
export const StaffOnly = (...permissions: Permission[]) =>
  applyDecorators(SetMetadata(REQUIRED_PERMISSIONS, permissions), UseGuards(StaffGuard));

export const CurrentStaff = createParamDecorator((_data: unknown, context: ExecutionContext): StaffPrincipal => {
  const staff = context.switchToHttp().getRequest<StaffRequest>().staff;
  if (!staff) {
    throw unauthorized();
  }
  return staff;
});

export const actorOf = (staff: StaffPrincipal): Actor => ({ id: staff.id, label: staff.name });
