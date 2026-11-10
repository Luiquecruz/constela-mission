export interface SessionUser {
  userId: string;
  tenantId: string;
  role: 'admin' | 'member';
}

export interface RawOrderRecord {
  id: string;
  tenantId: string;
  total: number;
  status: 'paid' | 'pending' | 'shipped';
  internalNotes: string;
  supplierCost: number;
}

export interface OrderDto {
  id: string;
  total: number;
  status: 'paid' | 'pending' | 'shipped';
}

export interface DalDependencies {
  getSession: () => Promise<SessionUser | null>;
  db: {
    findOrders: (tenantId: string) => Promise<RawOrderRecord[]>;
  };
}

export function createRequestMemo<T extends (...args: any[]) => any>(fn: T): T {
  // TODO: Memoize calls to fn keyed by JSON.stringify(args) within this instance
  return fn;
}

export function createTenantDal({ db, getSession }: DalDependencies) {
  // TODO: Implement per-request memoized getCurrentUser() and getOrdersByTenant(tenantId)
  // that enforce auth, verify tenant ownership, and return safe OrderDto objects.
  const getCurrentUser = async (): Promise<SessionUser> => {
    throw new Error('Not implemented');
  };

  const getOrdersByTenant = async (_tenantId: string): Promise<OrderDto[]> => {
    return [];
  };

  return {
    getCurrentUser,
    getOrdersByTenant,
  };
}
