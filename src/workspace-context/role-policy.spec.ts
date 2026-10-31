import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { Roles } from './roles.decorator';
import { ProductsController } from '../products/products.controller';
import { SalesController } from '../sales/sales.controller';
import { ClientsController } from '../clients/clients.controller';
import { MovementsController } from '../movements/movements.controller';

// STAFF sells, records movements and manages client details; catalog changes,
// sale cancellations and archiving are reserved to OWNER/ADMIN
const reflector = new Reflector();
const rolesOf = (controller: { prototype: object }, handler: string) =>
  reflector.get(Roles, (controller.prototype as Record<string, () => void>)[handler]);

describe('workspace role policy', () => {
  it.each([
    [ProductsController, 'create'],
    [ProductsController, 'importProducts'],
    [ProductsController, 'update'],
    [ProductsController, 'remove'],
    [ProductsController, 'restore'],
    [SalesController, 'remove'],
    [ClientsController, 'remove'],
    [ClientsController, 'restore'],
  ])('%p.%s is limited to OWNER and ADMIN', (controller, handler) => {
    expect(rolesOf(controller, handler)).toEqual([Role.OWNER, Role.ADMIN]);
  });

  it.each([
    [ProductsController, 'findAll'],
    [SalesController, 'create'],
    [ClientsController, 'create'],
    [ClientsController, 'update'],
    [MovementsController, 'create'],
  ])('%p.%s stays open to STAFF', (controller, handler) => {
    expect(rolesOf(controller, handler)).toBeUndefined();
  });
});
