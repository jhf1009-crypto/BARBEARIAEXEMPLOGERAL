import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { requireUser, audit } from '@/lib/auth';
import { AppError, createBooking } from '@/lib/booking';
import { body, fail, sameOrigin } from '@/lib/http';
import { schemas, bookingSchema, statusSchema } from '@/lib/validation';
import { settings, defaults } from '@/lib/settings';
import { dashboardStats } from '@/lib/dashboard';
import { revalidateTag } from 'next/cache';
type Row = Record<string, unknown>;
type Delegate = {
  findMany(args?: Row): Promise<Row[]>;
  count(args?: Row): Promise<number>;
  create(args: Row): Promise<Row>;
  update(args: Row): Promise<Row>;
  delete(args: Row): Promise<Row>;
};
const delegates: Record<string, Delegate> = {
  services: db.service,
  barbers: db.barber,
  customers: db.customer,
  blocks: db.block,
  gallery: db.gallery,
  reviews: db.review,
  users: db.user,
} as unknown as Record<string, Delegate>;
const csv = (rows: Row[]) => {
  if (!rows.length) return '\uFEFF';
  const keys = Object.keys(rows[0]);
  const cell = (v: unknown) => {
    let s = String(v ?? '');
    if (/^[=+@\-\t\r]/.test(s)) s = `'${s}`;
    return `"${s.replace(/"/g, '""')}"`;
  };
  return (
    '\uFEFF' +
    [keys, ...rows.map((r) => keys.map((k) => r[k]))].map((r) => r.map(cell).join(';')).join('\r\n')
  );
};
export async function GET(req: NextRequest, { params }: { params: Promise<{ module: string }> }) {
  try {
    const u = await requireUser(undefined, true);
    const { module } = await params;
    if (u.mustChangePassword && module !== 'account')
      throw new AppError('Troque sua senha inicial.', 428);
    const q = z
      .object({
        page: z.coerce.number().int().min(1).max(10000).default(1),
        search: z.string().max(100).default(''),
        status: statusSchema.optional(),
        from: z.iso.datetime().optional(),
        to: z.iso.datetime().optional(),
        export: z.enum(['csv']).optional(),
      })
      .parse(Object.fromEntries(req.nextUrl.searchParams));
    if (module === 'account') {
      const sessions = await db.session.findMany({
        where: { userId: u.id },
        select: { id: true, createdAt: true, expiresAt: true, agent: true },
      });
      return NextResponse.json({
        name: u.name,
        role: u.role,
        email: u.email,
        mustChangePassword: u.mustChangePassword,
        hasTotp: !!u.totpSecret,
        sessions,
      });
    }
    if (
      u.role === 'BARBER' &&
      !['dashboard', 'appointments', 'notifications', 'calendar'].includes(module)
    )
      throw new AppError('Acesso restrito à própria agenda.', 403);
    const where = {
      ...(u.role === 'BARBER' ? { barberId: u.barberId ?? 'NONE' } : {}),
      ...(q.status ? { status: q.status } : {}),
      ...(q.from || q.to
        ? {
            startsAt: {
              ...(q.from ? { gte: new Date(q.from) } : {}),
              ...(q.to ? { lte: new Date(q.to) } : {}),
            },
          }
        : {}),
      ...(q.search ? { customer: { name: { contains: q.search } } } : {}),
    };
    if (['appointments', 'dashboard', 'finance', 'notifications', 'calendar'].includes(module)) {
      const rows = await db.appointment.findMany({
        where,
        include: { customer: true },
        orderBy: { startsAt: module === 'dashboard' ? 'asc' : 'desc' },
        take: q.export ? 10000 : ['dashboard', 'finance', 'calendar'].includes(module) ? 1000 : 25,
        skip: module === 'appointments' ? (q.page - 1) * 25 : 0,
      });
      const barbers = await db.barber.findMany({
        where: u.role === 'BARBER' ? { id: u.barberId ?? 'NONE' } : {},
      });
      const history = await db.audit.findMany({
        where: { target: { in: rows.map((r) => r.id) } },
        orderBy: { createdAt: 'desc' },
        take: 500,
      });
      const safe = rows.map(({ tokenHash: _, tokenExpiresAt: __, ...r }) => ({
        ...r,
        barberName: barbers.find((b) => b.id === r.barberId)?.name,
        history: history.filter((h) => h.target === r.id),
      }));
      if (q.export) {
        if (u.role === 'BARBER') throw new AppError('Exportação restrita.', 403);
        return new NextResponse(
          csv(
            safe.map((r) => ({
              id: r.id,
              cliente: r.customer.name,
              telefone: r.customer.phone,
              servico: r.serviceNames,
              barbeiro: r.barberName,
              inicio: r.startsAt.toISOString(),
              status: r.status,
              valor: (r.total / 100).toFixed(2),
              pagamento: r.payment,
              comissao: (
                (r.total * (barbers.find((b) => b.id === r.barberId)?.commission ?? 0)) /
                10000
              ).toFixed(2),
            })),
          ),
          {
            headers: {
              'Content-Type': 'text/csv; charset=utf-8',
              'Content-Disposition': 'attachment; filename="relatorio.csv"',
            },
          },
        );
      }
      return NextResponse.json({
        rows: safe,
        total: await db.appointment.count({ where }),
        barbers,
        stats:
          module === 'dashboard'
            ? await dashboardStats(u.role === 'BARBER' ? (u.barberId ?? 'NONE') : undefined)
            : undefined,
      });
    }
    if (module === 'settings') return NextResponse.json({ settings: await settings() });
    if (module === 'audit') {
      if (u.role !== 'ADMIN') throw new AppError('Acesso restrito.', 403);
      return NextResponse.json({
        rows: await db.audit.findMany({
          orderBy: { createdAt: 'desc' },
          take: 25,
          skip: (q.page - 1) * 25,
        }),
        total: await db.audit.count(),
      });
    }
    if (module === 'users' && u.role !== 'ADMIN') throw new AppError('Acesso restrito.', 403);
    const delegate = delegates[module];
    if (!delegate) throw new AppError('Módulo não encontrado.', 404);
    const filter = q.search
      ? {
          [module === 'gallery' ? 'caption' : module === 'reviews' ? 'name' : 'name']: {
            contains: q.search,
          },
        }
      : {};
    let rows = await delegate.findMany({
      where: filter,
      ...(['gallery', 'services'].includes(module) ? { orderBy: { order: 'asc' } } : {}),
      take: q.export ? 10000 : 25,
      skip: q.export ? 0 : (q.page - 1) * 25,
    });
    if (module === 'users') rows = rows.map(({ password: _, totpSecret: __, ...r }) => r);
    if (module === 'customers')
      rows = await Promise.all(
        rows.map(async (r) => {
          const visits = await db.appointment.findMany({
            where: { customerId: String(r.id), status: 'COMPLETED' },
            orderBy: { startsAt: 'desc' },
          });
          return {
            ...r,
            visits: visits.length,
            spent: visits.reduce((s, v) => s + v.total, 0),
            lastVisit: visits[0]?.startsAt ?? null,
          };
        }),
      );
    if (q.export)
      return new NextResponse(csv(rows), {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="clientes.csv"',
        },
      });
    return NextResponse.json({ rows, total: await delegate.count({ where: filter }) });
  } catch (e) {
    return fail(e);
  }
}
export async function POST(req: NextRequest, { params }: { params: Promise<{ module: string }> }) {
  try {
    sameOrigin(req);
    const u = await requireUser();
    const { module } = await params;
    const envelope = z
      .object({
        action: z.enum(['create', 'update', 'delete', 'anonymize', 'bulk']),
        id: z.string().max(100).optional(),
        data: z.record(z.string(), z.unknown()).default({}),
      })
      .parse(await body(req));
    const { action, id, data } = envelope;
    if (module === 'appointments') {
      if (action === 'create') {
        const input = bookingSchema.parse(data);
        if (u.role === 'BARBER' && input.barberId !== u.barberId)
          throw new AppError('Escolha sua própria agenda.', 403);
        return NextResponse.json(await createBooking(input, undefined, u.id));
      }
      if (action === 'bulk') {
        if (u.role === 'BARBER') throw new AppError('Ação restrita.', 403);
        const v = z.object({ ids: z.array(z.string()).max(100), status: statusSchema }).parse(data);
        if (!['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(v.status))
          throw new AppError('Confirme individualmente para validar disponibilidade.');
        await db.$transaction(async (tx) => {
          await tx.appointment.updateMany({
            where: { id: { in: v.ids } },
            data: { status: v.status },
          });
          if (v.status === 'CANCELLED')
            await tx.reservation.deleteMany({ where: { appointmentId: { in: v.ids } } });
        });
        await audit(u.id, 'BULK_STATUS', v.ids.join(','));
        return NextResponse.json({ ok: true });
      }
      const a = await db.appointment.findUnique({ where: { id } });
      if (!a) throw new AppError('Agendamento não encontrado.', 404);
      if (u.role === 'BARBER' && a.barberId !== u.barberId)
        throw new AppError('Acesso restrito.', 403);
      const v = z
        .object({
          status: statusSchema.optional(),
          internalNotes: z.string().max(2000).optional(),
          payment: z.enum(['PIX', 'CASH', 'CARD']).optional(),
          startsAt: z.iso.datetime().optional(),
        })
        .parse(data);
      if (v.startsAt) {
        const c = await db.customer.findUniqueOrThrow({ where: { id: a.customerId } });
        const r = await createBooking(
          {
            serviceIds: JSON.parse(a.serviceIds),
            barberId: a.barberId,
            startsAt: v.startsAt,
            name: c.name,
            phone: c.phone,
            notes: a.notes,
            consent: true,
            website: '',
          },
          a.id,
          u.id,
        );
        return NextResponse.json(r);
      }
      if (
        ['CANCELLED', 'NO_SHOW'].includes(a.status) &&
        v.status &&
        ['PENDING', 'CONFIRMED'].includes(v.status)
      )
        throw new AppError('Crie um novo agendamento para validar o horário.');
      await db.$transaction(async (tx) => {
        await tx.appointment.update({
          where: { id: a.id },
          data: { status: v.status, internalNotes: v.internalNotes, payment: v.payment },
        });
        if (v.status === 'CANCELLED')
          await tx.reservation.deleteMany({ where: { appointmentId: a.id } });
      });
      await audit(u.id, 'APPOINTMENT_UPDATE', a.id);
      return NextResponse.json({ ok: true });
    }
    if (u.role === 'BARBER') throw new AppError('Acesso restrito.', 403);
    if (module === 'settings') {
      if (u.role !== 'ADMIN') throw new AppError('Acesso restrito ao dono.', 403);
      const v = z
        .object({
          minBookingMinutes: z.coerce.number().int().min(0).max(10080),
          minCancelMinutes: z.coerce.number().int().min(0).max(10080),
          slotStep: z.coerce.number().int().min(5).max(60),
          maxFutureBookings: z.coerce.number().int().min(1).max(20),
          maxAdvanceDays: z.coerce.number().int().min(1).max(365),
          bufferMinutes: z.coerce.number().int().min(0).max(60),
          businessName: z.string().min(2).max(100),
          phone: z.string().regex(/^\d{10,15}$/),
          address: z.string().max(300),
          hours: z.string().max(200),
          headline: z.string().max(100),
          description: z.string().max(300),
          accent: z.string().regex(/^#[a-fA-F0-9]{6}$/),
          logo: z.string().regex(/^(|\/(images|uploads)\/[\w.-]+)$/),
          instagram: z.url().refine((v) => v.startsWith('https://')),
          seoTitle: z.string().max(150),
          seoDescription: z.string().max(300),
          whatsappMessage: z.string().max(1000),
        })
        .parse({ ...defaults, ...data });
      await db.$transaction(
        Object.entries(v).map(([key, value]) =>
          db.setting.upsert({
            where: { key },
            create: { key, value: JSON.stringify(value) },
            update: { value: JSON.stringify(value) },
          }),
        ),
      );
      await audit(u.id, 'SETTINGS', 'business');
      revalidateTag('public-catalog', { expire: 0 });
      return NextResponse.json({ ok: true });
    }
    if (module === 'users' && u.role !== 'ADMIN') throw new AppError('Acesso restrito.', 403);
    const delegate = delegates[module];
    const schema = schemas[module as keyof typeof schemas];
    if (!delegate || !schema) throw new AppError('Módulo não encontrado.', 404);
    let savedId = id;
    if (action === 'delete') {
      if (!id) throw new AppError('ID obrigatório.');
      if (module === 'users' && id === u.id)
        throw new AppError('Você não pode excluir sua própria conta.');
      if (module === 'barbers' && (await db.appointment.count({ where: { barberId: id } })))
        throw new AppError('Este profissional possui histórico. Desative-o em vez de excluir.');
      await delegate.delete({ where: { id } });
    } else if (action === 'anonymize' && module === 'customers') {
      if (!id) throw new AppError('ID obrigatório.');
      await db.$transaction([
        db.customer.update({
          where: { id },
          data: { name: 'Cliente removido', phone: `removed-${id}`, notes: '', tags: '' },
        }),
        db.appointment.updateMany({
          where: { customerId: id },
          data: { notes: '', internalNotes: '' },
        }),
      ]);
    } else {
      const v = schema.parse(data) as Row;
      if (module === 'users') {
        if (v.role === 'BARBER' && !v.barberId) throw new AppError('Vincule um barbeiro.');
        if (v.password) v.password = await bcrypt.hash(String(v.password), 12);
        if (action === 'create' && !v.password) throw new AppError('Senha inicial obrigatória.');
        if (id === u.id && v.role !== 'ADMIN')
          throw new AppError('Você não pode remover sua permissão de dono.');
      }
      if (action === 'create') savedId = String((await delegate.create({ data: v })).id);
      else {
        if (!id) throw new AppError('ID obrigatório.');
        await delegate.update({ where: { id }, data: v });
      }
    }
    await audit(u.id, `${module.toUpperCase()}_${action.toUpperCase()}`, savedId ?? 'new');
    revalidateTag('public-catalog', { expire: 0 });
    return NextResponse.json({ ok: true, id: savedId });
  } catch (e) {
    return fail(e);
  }
}
