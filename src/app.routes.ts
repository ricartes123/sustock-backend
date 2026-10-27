import { AUTH_ROUTES } from './auth/auth.routes';
import { CLIENTS_ROUTES } from './clients/clients.routes';
import { DASHBOARD_ROUTES } from './dashboard/dashboard.routes';
import { MOVEMENTS_ROUTES } from './movements/movements.routes';
import { PRODUCTS_ROUTES } from './products/products.routes';
import { SALES_ROUTES } from './sales/sales.routes';
import { TEAM_ROUTES } from './team/team.routes';
import { WORKSPACE_ROUTES } from './workspace/workspace.routes';

export const HEALTH_ROUTES = {
  ROOT: 'health',
};

export const APP_ROUTES = {
  HEALTH: HEALTH_ROUTES,
  AUTH: AUTH_ROUTES,
  CLIENTS: CLIENTS_ROUTES,
  DASHBOARD: DASHBOARD_ROUTES,
  MOVEMENTS: MOVEMENTS_ROUTES,
  PRODUCTS: PRODUCTS_ROUTES,
  SALES: SALES_ROUTES,
  TEAM: TEAM_ROUTES,
  WORKSPACE: WORKSPACE_ROUTES,
};
