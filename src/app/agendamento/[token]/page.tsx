'use client';
import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, ArrowLeft } from 'lucide-react';
type Booking = {
  name: string;
  phone: string;
  serviceNames: string;
  serviceIds: string[];
  barberId: string;
  barberName: string;
  startsAt: string;
  status: string;
  total: number;
};
export default function Manage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [a, setA] = useState<Booking | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    fetch(`/api/bookings/${token}`)
      .then(async (r) => {
        const v = await r.json();
        if (!r.ok) throw new Error(v.error);
        setA(v);
      })
      .catch((e) => setError(e.message));
  }, [token]);
  async function cancel() {
    if (!confirm('Deseja cancelar este agendamento?')) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/bookings/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      });
      const v = await r.json();
      if (!r.ok) throw new Error(v.error);
      setA((old) => (old ? { ...old, status: 'CANCELLED' } : old));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Tente novamente.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <main id="main" className="manage-page">
      <Link href="/" className="text-button">
        <ArrowLeft size={18} />
        Voltar ao site
      </Link>
      <div className="success-check">
        <Check />
      </div>
      <p className="eyebrow">SEU HORÁRIO</p>
      <h1>{a?.status === 'CANCELLED' ? 'Agendamento cancelado.' : 'Seu momento está marcado.'}</h1>
      {a && (
        <div className="summary-card">
          <h2>{a.serviceNames}</h2>
          <strong>
            {new Date(a.startsAt).toLocaleString('pt-BR', {
              timeZone: 'America/Bahia',
              dateStyle: 'long',
              timeStyle: 'short',
            })}
          </strong>
          <p>Com {a.barberName}</p>
          <p>{a.name}</p>
          <b>
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
              a.total / 100,
            )}
          </b>
          <p>
            Status:{' '}
            {
              {
                CONFIRMED: 'Confirmado',
                PENDING: 'Pendente',
                COMPLETED: 'Concluído',
                CANCELLED: 'Cancelado',
                NO_SHOW: 'Não compareceu',
              }[a.status]
            }
          </p>
          {['CONFIRMED', 'PENDING'].includes(a.status) && (
            <div className="button-row">
              <Link
                className="button"
                href={`/agendar?service=${a.serviceIds[0]}&barber=${a.barberId}&reschedule=${token}`}
              >
                Reagendar
              </Link>
              <button disabled={busy} className="button outline" onClick={cancel}>
                {busy ? 'Cancelando…' : 'Cancelar horário'}
              </button>
            </div>
          )}
        </div>
      )}
      <p className="form-error" role="status">
        {error}
      </p>
    </main>
  );
}
