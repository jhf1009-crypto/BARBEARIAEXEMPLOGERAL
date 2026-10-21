import { db } from './db';
import { site } from '../site.config';
export const defaults = {
  minBookingMinutes: 60,
  minCancelMinutes: 120,
  slotStep: 15,
  maxFutureBookings: 5,
  maxAdvanceDays: 60,
  bufferMinutes: 5,
  businessName: site.fullName,
  phone: site.phone,
  address: site.address,
  hours: site.hours,
  headline: site.headline,
  description: site.description,
  accent: site.colors.accent,
  logo: site.logo,
  instagram: site.instagram,
  seoTitle: site.seo.title,
  seoDescription: site.seo.description,
  whatsappMessage: site.whatsappMessage,
};
export async function settings() {
  const rows = await db.setting.findMany();
  return {
    ...defaults,
    ...Object.fromEntries(rows.map((r) => [r.key, JSON.parse(r.value)])),
  } as typeof defaults;
}
