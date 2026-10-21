import { PrismaClient } from '../src/generated/prisma/index.js';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { hash } from '../src/lib/booking';
import { dayKey, localDate, reservedMinutes } from '../src/lib/schedule';
const db = new PrismaClient();
async function main() {
  if (await db.user.count())
    throw new Error('Banco já contém usuários. Use demo:reset para recomeçar.');
  const password = process.env.SEED_PASSWORD || randomBytes(18).toString('base64url');
  const domain = process.env.SEED_EMAIL_DOMAIN || 'example.com';
  const hashed = await bcrypt.hash(password, 12);
  const names = ['Rafael Costa', 'Lucas Santos', 'André Oliveira'];
  const barbers = [];
  for (let i = 0; i < 3; i++) {
    const schedule = Object.fromEntries(
      [1, 2, 3, 4, 5, 6].map((d) => [
        d,
        [
          [540 + i * 30, 720],
          [780, d === 6 ? 1080 : 1200],
        ],
      ]),
    );
    barbers.push(
      await db.barber.create({
        data: {
          name: names[i],
          bio: [
            'Mais de 10 anos dando forma a histórias e estilos.',
            'Especialista em degradês e acabamentos precisos.',
            'Tradição na navalha, atenção em cada detalhe.',
          ][i],
          specialty: ['Clássicos e tesoura', 'Degradê e estilo urbano', 'Barba e visagismo'][i],
          commission: 40 + i * 5,
          image: `/images/barber-${i + 1}.webp`,
          schedule: JSON.stringify(schedule),
        },
      }),
    );
  }
  for (const [name, email, role, barberId] of [
    ['Administrador', `admin@${domain}`, 'ADMIN', null],
    ['Gerente', `gerente@${domain}`, 'MANAGER', null],
    [names[0], `barbeiro@${domain}`, 'BARBER', barbers[0].id],
  ] as const)
    await db.user.create({
      data: { name, email, role, barberId, password: hashed, mustChangePassword: true },
    });
  const services = [];
  const specs = [
    ['Corte masculino', 5500, 40, 'Cabelo'],
    ['Barba completa', 4000, 30, 'Barba'],
    ['Corte + barba', 8500, 65, 'Combos'],
    ['Corte na máquina', 3500, 25, 'Cabelo'],
    ['Sobrancelha', 1500, 10, 'Acabamento'],
    ['Pigmentação', 4500, 35, 'Tratamento'],
    ['Hidratação', 3000, 25, 'Tratamento'],
    ['Corte infantil', 4500, 35, 'Cabelo'],
    ['Barba express', 2500, 20, 'Barba'],
  ];
  for (let i = 0; i < specs.length; i++) {
    const [name, price, duration, category] = specs[i];
    services.push(
      await db.service.create({
        data: {
          name: String(name),
          price: Number(price),
          duration: Number(duration),
          category: String(category),
          description: [
            'Precisão no corte, finalização do seu jeito.',
            'Toalha quente e acabamento com navalha.',
            'A experiência completa, do cabelo à barba.',
          ][i % 3],
          image: `/images/service-${i + 1}.webp`,
          order: i,
        },
      }),
    );
  }
  const first = [
    'João',
    'Pedro',
    'Gabriel',
    'Matheus',
    'Bruno',
    'Felipe',
    'Thiago',
    'Diego',
    'Gustavo',
    'Henrique',
    'Daniel',
    'Vinícius',
    'Eduardo',
    'Caio',
    'Renato',
    'Marcelo',
    'Roberto',
    'Fernando',
    'Arthur',
    'Igor',
    'Leandro',
    'Paulo',
    'Alexandre',
    'Samuel',
  ];
  const customers = [];
  for (let i = 0; i < 24; i++)
    customers.push(
      await db.customer.create({
        data: {
          name: `${first[i]} ${['Silva', 'Santos', 'Almeida', 'Costa'][i % 4]}`,
          phone: `7198${String(i + 1000000).padStart(7, '0')}`,
          tags: i % 7 === 0 ? 'VIP' : '',
          notes: i % 6 === 0 ? 'Prefere atendimento pela manhã.' : '',
        },
      }),
    );
  for (let i = 0; i < 84; i++) {
    const offset = Math.floor(i / 3) - 17;
    const day = dayKey(new Date(Date.now() + offset * 86400000));
    if (new Date(`${day}T12:00:00-03:00`).getUTCDay() === 0) continue;
    const b = barbers[i % 3],
      s = services[i % services.length];
    const start = localDate(day, 570 + (i % 3) * 90);
    const end = new Date(start.getTime() + s.duration * 60000);
    const status =
      start < new Date()
        ? ['COMPLETED', 'COMPLETED', 'NO_SHOW', 'CANCELLED'][i % 4]
        : ['CONFIRMED', 'PENDING', 'CONFIRMED'][i % 3];
    const a = await db.appointment.create({
      data: {
        tokenHash: hash(randomBytes(32).toString('base64url')),
        tokenExpiresAt: new Date(end.getTime() + 30 * 86400000),
        customerId: customers[i % 24].id,
        barberId: b.id,
        serviceIds: JSON.stringify([s.id]),
        serviceNames: s.name,
        startsAt: start,
        endsAt: end,
        duration: s.duration,
        total: s.price,
        status,
        payment: ['PIX', 'CARD', 'CASH'][i % 3],
      },
    });
    if (status !== 'CANCELLED')
      await db.reservation.createMany({
        data: reservedMinutes(start, new Date(end.getTime() + 5 * 60000)).map((minute) => ({
          barberId: b.id,
          minute,
          appointmentId: a.id,
        })),
      });
  }
  await db.block.create({
    data: {
      name: 'Formação da equipe',
      startsAt: localDate(dayKey(new Date(Date.now() + 4 * 86400000)), 540),
      endsAt: localDate(dayKey(new Date(Date.now() + 4 * 86400000)), 720),
    },
  });
  await db.block.create({
    data: {
      name: 'Férias de Lucas',
      barberId: barbers[1].id,
      startsAt: localDate(dayKey(new Date(Date.now() + 14 * 86400000))),
      endsAt: localDate(dayKey(new Date(Date.now() + 18 * 86400000))),
    },
  });
  for (let i = 0; i < 6; i++)
    await db.gallery.create({
      data: {
        caption: [
          'Precisão no corte à tesoura',
          'Degradê com acabamento limpo',
          'Textura e movimento',
          'Corte feito com atenção',
          'Barba alinhada com cuidado',
          'Um acabamento que transforma',
        ][i],
        image: `/images/gallery-${i + 1}.webp`,
        order: i,
      },
    });
  for (const [name, text] of [
    ['Pedro S.', 'O corte ficou exatamente como eu queria. Atendimento sem pressa e no horário.'],
    ['Gabriel A.', 'Virou meu lugar de sempre. A barba com toalha quente é outro nível.'],
    ['Bruno C.', 'Agendei pelo celular em um minuto. Ambiente incrível e equipe muito boa.'],
    ['Felipe M.', 'Capricho no acabamento e uma conversa boa. Recomendo demais.'],
  ])
    await db.review.create({ data: { name, text, rating: 5 } });
  console.info(
    `Seed concluído. Contas: admin@${domain}, gerente@${domain}, barbeiro@${domain}. Senha inicial (troca obrigatória): ${password}`,
  );
}
main().finally(() => db.$disconnect());
