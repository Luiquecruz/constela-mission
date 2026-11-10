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
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

export function createTenantDal({ db, getSession }: DalDependencies) {
  const getCurrentUser = createRequestMemo(async (): Promise<SessionUser> => {
    const session = await getSession();
    if (!session) {
      throw new Error('Unauthorized');
    }
    return {
      userId: session.userId,
      tenantId: session.tenantId,
      role: session.role,
    };
  });

  const getOrdersByTenant = createRequestMemo(
    async (tenantId: string): Promise<OrderDto[]> => {
      const user = await getCurrentUser();
      if (user.tenantId !== tenantId) {
        throw new Error('Forbidden: tenant mismatch');
      }

      const rows = await db.findOrders(tenantId);
      return rows.map((row) => ({
        id: row.id,
        total: row.total,
        status: row.status,
      }));
    }
  );

  return {
    getCurrentUser,
    getOrdersByTenant,
  };
}
