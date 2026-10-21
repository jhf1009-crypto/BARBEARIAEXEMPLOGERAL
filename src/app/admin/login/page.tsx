'use client';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, LockKeyhole } from 'lucide-react';
function Login() {
  const router = useRouter(),
    q = useSearchParams();
  const reset = q.get('reset');
  const [forgot, setForgot] = useState(false),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const form = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const action = reset ? 'reset' : forgot ? 'forgot' : 'login';
      const r = await fetch(`/api/auth/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, token: reset }),
      });
      const v = await r.json();
      if (!r.ok) throw new Error(v.error);
      if (action === 'login') {
        router.push('/admin');
        router.refresh();
      } else setError(action === 'reset' ? 'Senha atualizada. Volte para entrar.' : v.message);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Tente novamente.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <main id="main" className="login-page">
      <Link href="/" className="text-button">
        <ArrowLeft size={18} />
        Voltar ao site
      </Link>
      <div className="login-brand">G.</div>
      <p className="eyebrow">GERAL / ÁREA DA EQUIPE</p>
      <h1>
        {reset
          ? 'Uma nova senha.'
          : forgot
            ? 'Vamos recuperar seu acesso.'
            : 'Bom ter você de volta.'}
      </h1>
      <p className="muted">Sua agenda e o cuidado com o negócio, em um só lugar.</p>
      <form onSubmit={submit}>
        {!reset && (
          <label>
            E-mail
            <input name="email" type="email" autoComplete="username" required />
          </label>
        )}
        {(!forgot || reset) && (
          <label>
            {reset ? 'Nova senha (mínimo 12 caracteres)' : 'Senha'}
            <input
              name="password"
              type="password"
              minLength={reset ? 12 : 1}
              maxLength={128}
              autoComplete={reset ? 'new-password' : 'current-password'}
              required
            />
          </label>
        )}
        {!forgot && !reset && (
          <label>
            Código do autenticador <span className="muted">(se ativado)</span>
            <input name="code" inputMode="numeric" maxLength={6} autoComplete="one-time-code" />
          </label>
        )}
        <p className="form-error" role="status">
          {error}
        </p>
        <button className="button" disabled={busy}>
          <LockKeyhole size={18} />
          {busy
            ? 'Aguarde…'
            : reset
              ? 'Salvar nova senha'
              : forgot
                ? 'Enviar instruções'
                : 'Entrar no painel'}
          <ArrowRight size={18} />
        </button>
      </form>
      <button
        className="text-button"
        onClick={() => {
          if (reset) router.push('/admin/login');
          else setForgot((v) => !v);
          setError('');
        }}
      >
        {forgot || reset ? 'Voltar para o login' : 'Esqueci minha senha'}
      </button>
    </main>
  );
}
export default function Page() {
  return (
    <Suspense>
      <Login />
    </Suspense>
  );
}
