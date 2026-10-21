import {existsSync,writeFileSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
if(!existsSync('.env')){const password=randomBytes(18).toString('base64url');writeFileSync('.env',`DATABASE_URL="file:./dev.db"\nAPP_URL="http://localhost:3000"\nSESSION_COOKIE_SECURE="false"\nSEED_PASSWORD="${password}"\nSEED_EMAIL_DOMAIN="example.com"\n`);console.log('Ambiente local criado; senha inicial em .env (não versionado).');}
