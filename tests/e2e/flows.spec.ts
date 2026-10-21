import { test, expect } from './fixtures';
import { readFileSync } from 'node:fs';
import { loadAllImages } from './helpers';
const password = readFileSync('.env', 'utf8').match(/SEED_PASSWORD="([^"]+)"/)?.[1] ?? '';
test('public booking, secure consultation, reschedule and cancel', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await loadAllImages(page);
  await page.screenshot({
    path: `output/playwright/${info.project.name}-home.png`,
    fullPage: true,
  });
  await page.getByRole('link', { name: 'Agendar meu horário' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: /Corte masculino/ }).click();
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page.getByRole('button', { name: 'Sem preferência' }).click();
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await expect(page.locator('.date-choice:not(:disabled)').first()).toContainText(/horários/, {
    timeout: 30000,
  });
  await page.locator('.date-choice:not(:disabled)').nth(2).click();
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page.locator('.slot').first().click();
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page.getByLabel('Seu nome').fill(`Cliente E2E ${info.project.name}`);
  await page.getByLabel('WhatsApp com DDD').fill(`719${String(Date.now()).slice(-8)}`);
  await page.getByText('Autorizo o uso').click();
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar agendamento' }).click();
  await expect(page.getByText('Seu horário está reservado.')).toBeVisible();
  await page.screenshot({ path: `output/playwright/${info.project.name}-success.png` });
  await page.getByRole('link', { name: 'Ver, reagendar ou cancelar' }).click();
  await expect(page.getByText('Seu momento está marcado.')).toBeVisible();
  const token = page.url().split('/').at(-1)!;
  await page.getByRole('link', { name: 'Reagendar', exact: true }).click();
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await expect(page.locator('.date-choice:not(:disabled)').last()).toContainText(/horários/, {
    timeout: 30000,
  });
  await page.locator('.date-choice:not(:disabled)').last().click();
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page.locator('.slot').first().click();
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page.getByLabel('Seu nome').fill('Cliente Reagendado');
  await page.getByLabel('WhatsApp com DDD').fill('71999998888');
  await page.getByText('Autorizo o uso').click();
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar agendamento' }).click();
  await expect(page.getByText('Seu horário está reservado.')).toBeVisible();
  await page.getByRole('link', { name: 'Ver, reagendar ou cancelar' }).click();
  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: 'Cancelar horário' }).click();
  await expect(page.getByText('Agendamento cancelado.')).toBeVisible();
  await page.goto(`/agendamento/${token}`);
  await expect(page.getByText('Agendamento cancelado.')).toBeVisible();
  expect(errors).toEqual([]);
});
test('admin authentication, modules and service CRUD', async ({ page }, info) => {
  await page.goto('/admin');
  await expect(page).toHaveURL(/login/);
  await page.getByLabel('E-mail', { exact: true }).fill('admin@example.com');
  await page.getByLabel('Senha', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Entrar no painel' }).click();
  await page.waitForURL('**/admin');
  if (await page.getByText('Por segurança, troque').isVisible()) {
    await page.getByLabel('Senha atual', { exact: true }).fill(password);
    await page.getByLabel('Nova senha', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Salvar senha' }).click();
  }
  async function module(label: string) {
    if (info.project.name.startsWith('mobile'))
      await page.getByLabel('Outros módulos').selectOption({ label });
    else
      await page
        .getByRole('navigation', { name: 'Módulos administrativos' })
        .getByRole('button', { name: label, exact: true })
        .click();
    await expect(page.getByText('Carregando seus dados…')).not.toBeVisible();
  }
  for (const label of [
    'Visão geral',
    'Agenda',
    'Agendamentos',
    'Serviços',
    'Equipe',
    'Clientes',
    'Bloqueios',
    'Galeria',
    'Avaliações',
    'Financeiro',
    'Configurações',
    'Notificações',
    'Usuários',
    'Auditoria',
    'Minha conta',
  ]) {
    await module(label);
    await page.screenshot({
      path: `output/playwright/${info.project.name}-admin-${label
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s/g, '-')}.png`,
    });
  }
  await module('Serviços');
  await page.getByRole('button', { name: 'Adicionar serviço' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Nome', { exact: true }).fill(`Serviço QA ${info.project.name}`);
  await dialog.getByRole('button', { name: 'Salvar alterações' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Alterações salvas.' })).toBeVisible();
  await page.getByLabel('Buscar registros').fill(`Serviço QA ${info.project.name}`);
  const row = page.getByRole('row').filter({ hasText: `Serviço QA ${info.project.name}` });
  await row.getByRole('button', { name: 'Editar', exact: true }).click();
  await dialog.getByLabel('Preço em centavos').fill('6000');
  await dialog.getByRole('button', { name: 'Salvar alterações' }).click();
  await expect(row).toContainText('60');
  page.once('dialog', (d) => d.accept());
  await row.getByRole('button', { name: 'Excluir', exact: true }).click();
  await expect(page.getByText('Nenhum registro por aqui.')).toBeVisible();
});
