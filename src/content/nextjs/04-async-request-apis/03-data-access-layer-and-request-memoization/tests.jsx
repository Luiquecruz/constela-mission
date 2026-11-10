test('deduplicates getSession and db.findOrders across multiple calls in the same request DAL', async () => {
  const getSession = fn(async () => ({
    userId: 'u-1',
    tenantId: 'acme',
    role: 'admin',
  }));
  const findOrders = fn(async (tenantId) => [
    {
      id: 'ord-101',
      tenantId,
      total: 250,
      status: 'paid',
      internalNotes: 'VIP discount applied',
      supplierCost: 110,
    },
  ]);

  const dal = mod.createTenantDal({
    getSession,
    db: { findOrders },
  });

  const [u1, ordersA, ordersB] = await Promise.all([
    dal.getCurrentUser(),
    dal.getOrdersByTenant('acme'),
    dal.getOrdersByTenant('acme'),
  ]);

  expect(u1.tenantId).toBe('acme');
  expect(getSession.mock.calls.length).toBe(1);
  expect(findOrders.mock.calls.length).toBe(1);
  expect(ordersA).toEqual(ordersB);
});

test('strips sensitive fields (internalNotes, supplierCost) from returned OrderDto items', async () => {
  const dal = mod.createTenantDal({
    getSession: async () => ({ userId: 'u-2', tenantId: 'globex', role: 'member' }),
    db: {
      findOrders: async () => [
        {
          id: 'ord-202',
          tenantId: 'globex',
          total: 499,
          status: 'shipped',
          internalNotes: 'Margin warning',
          supplierCost: 320,
        },
      ],
    },
  });

  const orders = await dal.getOrdersByTenant('globex');
  expect(orders).toEqual([
    {
      id: 'ord-202',
      total: 499,
      status: 'shipped',
    },
  ]);
  expect('internalNotes' in orders[0]).toBe(false);
  expect('supplierCost' in orders[0]).toBe(false);
});

test('enforces authentication and tenant authorization checks', async () => {
  const unauthDal = mod.createTenantDal({
    getSession: async () => null,
    db: { findOrders: async () => [] },
  });

  let unauthError = null;
  try {
    await unauthDal.getOrdersByTenant('acme');
  } catch (err) {
    unauthError = err;
  }
  expect(unauthError).toBeTruthy();
  expect(unauthError.message).toMatch(/Unauthorized/);

  const findOrders = fn(async () => []);
  const wrongTenantDal = mod.createTenantDal({
    getSession: async () => ({ userId: 'u-3', tenantId: 'acme', role: 'member' }),
    db: { findOrders },
  });

  let forbiddenError = null;
  try {
    await wrongTenantDal.getOrdersByTenant('competitor-tenant');
  } catch (err) {
    forbiddenError = err;
  }
  expect(forbiddenError).toBeTruthy();
  expect(forbiddenError.message).toMatch(/Forbidden: tenant mismatch/);
  expect(findOrders.mock.calls.length).toBe(0);
});

test('isolates memoization caches between separate request DAL instances', async () => {
  const request1Dal = mod.createTenantDal({
    getSession: async () => ({ userId: 'alice', tenantId: 'tenant-a', role: 'admin' }),
    db: {
      findOrders: async () => [
        { id: 'a-1', tenantId: 'tenant-a', total: 100, status: 'paid', internalNotes: 'x', supplierCost: 50 },
      ],
    },
  });

  const request2Dal = mod.createTenantDal({
    getSession: async () => ({ userId: 'bob', tenantId: 'tenant-b', role: 'member' }),
    db: {
      findOrders: async () => [
        { id: 'b-1', tenantId: 'tenant-b', total: 900, status: 'pending', internalNotes: 'y', supplierCost: 400 },
      ],
    },
  });

  const user1 = await request1Dal.getCurrentUser();
  const user2 = await request2Dal.getCurrentUser();

  expect(user1.userId).toBe('alice');
  expect(user2.userId).toBe('bob');
});
