import { db } from '../src/lib/db';
await db.rateLimit.deleteMany();
await db.$disconnect();
console.log('Limites temporários de teste limpos. Nenhum cliente ou agendamento removido.');
