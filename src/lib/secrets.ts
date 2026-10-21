import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { AppError } from './booking';
function key() {
  const value = process.env.TOTP_ENCRYPTION_KEY;
  if (!value || !/^[a-fA-F0-9]{64}$/.test(value))
    throw new AppError('Configure a chave de proteção do autenticador no servidor.', 503);
  return Buffer.from(value, 'hex');
}
export function encryptSecret(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return [iv.toString('hex'), cipher.getAuthTag().toString('hex'), encrypted.toString('hex')].join(
    '.',
  );
}
export function decryptSecret(value: string) {
  const [iv, tag, data] = value.split('.');
  if (!iv || !tag || !data)
    throw new AppError('Autenticador indisponível. Contate o administrador.', 503);
  const decipher = createDecipheriv('aes-256-gcm', key(), Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(tag, 'hex'));
  return Buffer.concat([decipher.update(Buffer.from(data, 'hex')), decipher.final()]).toString(
    'utf8',
  );
}
