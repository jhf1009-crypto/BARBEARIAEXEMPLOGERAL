'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ChevronRight, Clock3, X, Scissors } from 'lucide-react';
import { bookingSchema } from '@/lib/validation';
import { site } from '@/site.config';
type Service = { id: string; name: string; duration: number; price: number; image: string };
type Barber = { id: string; name: string; image: string; specialty: string };
type Slot = { startsAt: string; barberId: string; barberName: string };
const money = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v / 100);
const dateKey = (d: Date) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bahia',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
const time = (v: string) =>
  new Date(v).toLocaleTimeString('pt-BR', {
    timeZone: 'America/Bahia',
    hour: '2-digit',
    minute: '2-digit',
  });
const formatPhone = (v: string) =>
  v
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{1,4})$/, '$1-$2');
export default function BookingSheet({
  initialService,
  initialBarber,
  onClose,
  standalone = false,
  rescheduleToken,
  manual = false,
}: {
  initialService?: string;
  initialBarber?: string;
  onClose: () => void;
  standalone?: boolean;
  rescheduleToken?: string;
  manual?: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const dragY = useRef(0);
  const swipeX = useRef(0);
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [selected, setSelected] = useState<string[]>(initialService ? [initialService] : []);
  const [barber, setBarber] = useState(initialBarber ?? '');
  const [step, setStep] = useState(0);
  const [day, setDay] = useState(dateKey(new Date()));
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [remember, setRemember] = useState(false);
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ token: string; startsAt: string } | null>(null);
  const [turnstile, setTurnstile] = useState('');
  const [dayCounts, setDayCounts] = useState<Record<string, number>>({});
  const manualQuery = manual ? '&manual=1' : '';
  useEffect(() => {
    if (!rescheduleToken) return;
    fetch(`/api/bookings/${rescheduleToken}`)
      .then(async (r) => {
        const v = await r.json();
        if (!r.ok) throw new Error(v.error);
        setSelected(v.serviceIds);
        setBarber(v.barberId);
        setName(v.name);
        setPhone(formatPhone(v.phone));
      })
      .catch((e) => setError(e.message));
  }, [rescheduleToken]);
  const dates = Array.from({ length: 21 }, (_, i) => new Date(Date.now() + i * 86400000));
  const picked = services.filter((s) => selected.includes(s.id));
  const total = picked.reduce((v, s) => v + s.price, 0);
  const duration = picked.reduce((v, s) => v + s.duration, 0);
  useEffect(() => {
    if (!standalone) dialog.current?.showModal();
    const old = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    fetch('/api/catalog')
      .then((r) => r.json())
      .then((v) => {
        setServices(v.services);
        setBarbers(v.barbers);
      })
      .catch(() => setError('Não foi possível carregar os serviços. Atualize a página.'));
    try {
      const saved = localStorage.getItem('booking-customer');
      if (saved) {
        const v = JSON.parse(saved);
        if (typeof v.name === 'string' && typeof v.phone === 'string') {
          setName(v.name);
          setPhone(v.phone);
          setRemember(true);
        }
      }
    } catch {
      /* Optional capability or polling error; the primary flow remains usable. */
    }
    return () => {
      document.body.style.overflow = old;
    };
  }, [standalone]);
  useEffect(() => {
    content.current?.focus();
    if (content.current && !matchMedia('(prefers-reduced-motion: reduce)').matches)
      content.current.animate(
        [
          { opacity: 0, transform: 'translateX(18px)' },
          { opacity: 1, transform: 'translateX(0)' },
        ],
        { duration: 220, easing: 'ease-out' },
      );
  }, [step]);
  useEffect(() => {
    if (step !== 3 || !selected.length) return;
    let active = true;
    setLoading(true);
    setError('');
    fetch(
      `/api/availability?day=${day}&services=${selected.join(',')}${barber ? `&barber=${barber}` : ''}${manualQuery}`,
    )
      .then(async (r) => {
        const v = await r.json();
        if (!r.ok) throw new Error(v.error);
        if (active) {
          setSlots(v.slots);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (active) {
          setError(e.message);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [step, day, selected, barber, manualQuery]);
  useEffect(() => {
    if (step !== 2 || !selected.length) return;
    let active = true;
    Promise.all(
      Array.from({ length: 21 }, (_, i) => dateKey(new Date(Date.now() + i * 86400000))).map(
        async (d) => {
          const r = await fetch(
            `/api/availability?day=${d}&services=${selected.join(',')}${barber ? `&barber=${barber}` : ''}${manualQuery}`,
          );
          const v = await r.json();
          return [d, r.ok ? v.slots.length : 0] as const;
        },
      ),
    ).then((entries) => {
      if (active) setDayCounts(Object.fromEntries(entries));
    });
    return () => {
      active = false;
    };
  }, [step, selected, barber, manualQuery]);
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (!key || step !== 4) return;
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.onload = () => {
      const t = (window as unknown as { turnstile: { render: (el: string, opts: object) => void } })
        .turnstile;
      t.render('#turnstile', { sitekey: key, callback: (v: string) => setTurnstile(v) });
    };
    document.head.appendChild(script);
    return () => script.remove();
  }, [step]);
  function next() {
    setError('');
    if (step === 0 && !selected.length) return setError('Escolha pelo menos um serviço.');
    if (step === 2 && (dayCounts[day] ?? 0) === 0)
      return setError('Escolha um dia com horários disponíveis.');
    if (step === 3 && !slot) return setError('Escolha um horário disponível.');
    if (step === 4) {
      const v = bookingSchema.safeParse({
        serviceIds: selected,
        barberId: barber || undefined,
        startsAt: slot?.startsAt,
        name,
        phone,
        notes,
        consent,
        website,
      });
      if (!v.success) return setError(v.error.issues.map((i) => i.message).join(' · '));
    }
    navigator.vibrate?.(8);
    setStep((v) => Math.min(v + 1, 5));
  }
  async function confirm() {
    if (!slot) return;
    setLoading(true);
    setError('');
    try {
      const url = rescheduleToken
        ? `/api/bookings/${rescheduleToken}`
        : manual
          ? '/api/admin/appointments'
          : '/api/bookings';
      const payload = rescheduleToken
        ? { action: 'reschedule', startsAt: slot.startsAt, barberId: slot.barberId }
        : {
            serviceIds: selected,
            barberId: slot.barberId,
            startsAt: slot.startsAt,
            name,
            phone: phone.replace(/\D/g, ''),
            notes,
            consent,
            website,
            turnstile,
          };
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          manual && !rescheduleToken ? { action: 'create', data: payload } : payload,
        ),
      });
      const v = await r.json();
      if (!r.ok) {
        if (r.status === 409) {
          setSlot(null);
          setStep(3);
        }
        throw new Error(v.error);
      }
      if (remember) localStorage.setItem('booking-customer', JSON.stringify({ name, phone }));
      else localStorage.removeItem('booking-customer');
      setSuccess(v);
      navigator.vibrate?.([15, 40, 15]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Tente novamente.');
    } finally {
      setLoading(false);
    }
  }
  const uniqueSlots = slots.filter(
    (s, i, a) => a.findIndex((t) => t.startsAt === s.startsAt) === i,
  );
  const titles = [
    'O que vamos fazer?',
    'Com quem você prefere?',
    'Qual é o melhor dia?',
    'Agora, o seu horário.',
    'Como podemos te chamar?',
    'Tudo certo para confirmar?',
  ];
  function ics() {
    if (!success) return;
    const stamp = (v: Date) => v.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const data = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Geral//Agenda//PT',
      'BEGIN:VEVENT',
      `UID:${success.token}@barbearia`,
      `DTSTAMP:${stamp(new Date())}`,
      `DTSTART:${stamp(new Date(success.startsAt))}`,
      `DTEND:${stamp(new Date(new Date(success.startsAt).getTime() + duration * 60000))}`,
      `SUMMARY:${site.fullName} - ${picked.map((v) => v.name).join(' + ')}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');
    const url = URL.createObjectURL(new Blob([data], { type: 'text/calendar' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'meu-horario.ics';
    a.click();
    URL.revokeObjectURL(url);
  }
  const inner = (
    <>
      {!standalone && (
        <div
          className="sheet-grip"
          role="button"
          tabIndex={0}
          aria-label="Arraste para fechar ou pressione Enter"
          onKeyDown={(e) => {
            if (e.key === 'Enter') onClose();
          }}
          onPointerDown={(e) => {
            dragY.current = e.clientY;
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (e.currentTarget.hasPointerCapture(e.pointerId) && dialog.current)
              dialog.current.style.transform = `translateY(${Math.max(0, e.clientY - dragY.current)}px)`;
          }}
          onPointerUp={(e) => {
            const delta = e.clientY - dragY.current;
            if (delta > 120) onClose();
            else if (dialog.current) {
              dialog.current.animate(
                [
                  { transform: `translateY(${Math.max(0, delta)}px)` },
                  { transform: 'translateY(0)' },
                ],
                { duration: 320, easing: 'cubic-bezier(.2,.8,.2,1)' },
              );
              dialog.current.style.transform = '';
            }
          }}
        >
          <span />
        </div>
      )}
      <div className="sheet-top">
        <button
          className="text-button"
          onClick={() => {
            if (success || step === 0) onClose();
            else {
              setStep((v) => v - 1);
              setError('');
            }
          }}
        >
          <ArrowLeft size={18} />
          Voltar
        </button>
        <span className="eyebrow">{site.name} / AGENDAMENTO</span>
        <button className="icon-button" onClick={onClose} aria-label="Fechar agendamento">
          <X size={20} />
        </button>
      </div>
      {!success && (
        <div className="step-progress" aria-label={`Etapa ${step + 1} de 6`}>
          {titles.map((_, i) => (
            <span className={i <= step ? 'done' : ''} key={i} />
          ))}
        </div>
      )}
      {success ? (
        <div className="success-view">
          <div className="confetti" aria-hidden="true">
            {Array.from({ length: 12 }, (_, i) => (
              <span
                key={i}
                style={
                  {
                    '--dx': `${Math.cos((i * Math.PI) / 6) * 130}px`,
                    '--dy': `${Math.sin((i * Math.PI) / 6) * 100 - 60}px`,
                    '--turn': `${i * 70}deg`,
                    '--delay': `${(i % 3) * 40}ms`,
                  } as React.CSSProperties
                }
              />
            ))}
          </div>
          <div className="success-check">
            <Check size={48} />
          </div>
          <p className="eyebrow">NOS VEMOS EM BREVE</p>
          <h2>Seu horário está reservado.</h2>
          <p>
            {name.split(' ')[0]}, estamos te esperando em
            <br />
            <strong>
              {new Date(success.startsAt).toLocaleDateString('pt-BR', {
                timeZone: 'America/Bahia',
                day: 'numeric',
                month: 'long',
              })}{' '}
              às {time(success.startsAt)}
            </strong>
            .
          </p>
          <div className="summary-card">
            <strong>{picked.map((s) => s.name).join(' + ')}</strong>
            <span>
              {slot?.barberName} · {duration} min
            </span>
            <b>{money(total)}</b>
          </div>
          <a href={`/agendamento/${success.token}`} className="button">
            Ver, reagendar ou cancelar <ChevronRight size={18} />
          </a>
          <div className="button-row">
            <button className="button outline" onClick={ics}>
              Adicionar ao calendário
            </button>
            <a
              className="button outline"
              href={`https://wa.me/${site.phone}?text=${encodeURIComponent(`Olá! Agendei ${picked.map((s) => s.name).join(' + ')} em ${new Date(success.startsAt).toLocaleString('pt-BR', { timeZone: 'America/Bahia' })}. Meu link: ${location.origin}/agendamento/${success.token}`)}`}
            >
              Enviar no WhatsApp
            </a>
            <button
              className="text-button"
              onClick={async () => {
                const url = `${location.origin}/agendamento/${success.token}`;
                try {
                  if (navigator.share) await navigator.share({ title: 'Meu agendamento', url });
                  else {
                    await navigator.clipboard.writeText(url);
                    setError('Link copiado.');
                  }
                } catch {
                  /* Optional capability or polling error; the primary flow remains usable. */
                }
              }}
            >
              Compartilhar
            </button>
          </div>
          <p className="muted">Guarde seu link para gerenciar o horário.</p>
        </div>
      ) : (
        <>
          <div
            ref={content}
            tabIndex={-1}
            className="sheet-content"
            onTouchStart={(e) => {
              swipeX.current = e.touches[0].clientX;
            }}
            onTouchEnd={(e) => {
              const delta = e.changedTouches[0].clientX - swipeX.current;
              if (delta > 100 && step > 0) setStep((v) => v - 1);
            }}
          >
            <p className="eyebrow">PASSO {String(step + 1).padStart(2, '0')} DE 06</p>
            <h2>{titles[step]}</h2>
            <p className="muted">
              {
                [
                  'Você pode combinar serviços.',
                  'Todos os nossos profissionais cuidam de cada detalhe.',
                  'Horários da Bahia. Deslize para escolher.',
                  'Os horários abaixo estão disponíveis agora.',
                  'Só o necessário para cuidar do seu agendamento.',
                  'Confira os detalhes. Depois, é só chegar.',
                ][step]
              }
            </p>
            {step === 0 && (
              <div className="choice-list">
                {!services.length ? (
                  <div className="skeleton">Carregando serviços…</div>
                ) : (
                  services.map((s) => (
                    <button
                      key={s.id}
                      className={`choice ${selected.includes(s.id) ? 'selected' : ''}`}
                      aria-pressed={selected.includes(s.id)}
                      onClick={() => {
                        setSelected((v) =>
                          v.includes(s.id) ? v.filter((x) => x !== s.id) : [...v, s.id],
                        );
                        setSlot(null);
                        setDayCounts({});
                      }}
                    >
                      <img src={s.image} alt="" width="64" height="64" />
                      <span>
                        <strong>{s.name}</strong>
                        <small>
                          <Clock3 size={13} />
                          {s.duration} min
                        </small>
                      </span>
                      <b>{money(s.price)}</b>
                      <span className="choice-check">
                        {selected.includes(s.id) ? <Check size={16} /> : '+'}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
            {step === 1 && (
              <div className="choice-list">
                <button
                  className={`choice ${!barber ? 'selected' : ''}`}
                  onClick={() => {
                    setBarber('');
                    setSlot(null);
                    setDayCounts({});
                  }}
                >
                  <Scissors />
                  <span>
                    <strong>Sem preferência</strong>
                    <small>O primeiro horário disponível</small>
                  </span>
                  {!barber && <Check />}
                </button>
                {barbers.map((b) => (
                  <button
                    key={b.id}
                    className={`choice ${barber === b.id ? 'selected' : ''}`}
                    onClick={() => {
                      setBarber(b.id);
                      setSlot(null);
                      setDayCounts({});
                    }}
                  >
                    <img src={b.image} alt="" width="64" height="64" />
                    <span>
                      <strong>{b.name}</strong>
                      <small>{b.specialty}</small>
                    </span>
                    {barber === b.id && <Check />}
                  </button>
                ))}
              </div>
            )}
            {step === 2 && (
              <>
                <div className="date-strip">
                  {dates.map((d) => {
                    const key = dateKey(d);
                    return (
                      <button
                        key={key}
                        disabled={dayCounts[key] === 0}
                        className={`date-choice ${day === key ? 'selected' : ''}`}
                        onClick={() => {
                          setDay(key);
                          setSlot(null);
                        }}
                      >
                        <span>
                          {d.toLocaleDateString('pt-BR', {
                            timeZone: 'America/Bahia',
                            weekday: 'short',
                          })}
                        </span>
                        <strong>
                          {d.toLocaleDateString('pt-BR', {
                            timeZone: 'America/Bahia',
                            day: '2-digit',
                          })}
                        </strong>
                        <small>
                          {d.toLocaleDateString('pt-BR', {
                            timeZone: 'America/Bahia',
                            month: 'short',
                          })}
                        </small>
                        <small>
                          {dayCounts[key] === undefined
                            ? '…'
                            : dayCounts[key] === 0
                              ? 'Lotado/fechado'
                              : `${dayCounts[key]} horários`}
                        </small>
                      </button>
                    );
                  })}
                </div>
                <p className="hint">Dias fechados ou sem disponibilidade ficam desabilitados.</p>
              </>
            )}
            {step === 3 &&
              (loading ? (
                <div className="skeleton">Buscando horários disponíveis…</div>
              ) : uniqueSlots.length ? (
                <div className="slot-grid">
                  {uniqueSlots.map((s) => (
                    <button
                      key={s.startsAt}
                      className={`slot ${slot?.startsAt === s.startsAt ? 'selected' : ''}`}
                      onClick={() => setSlot(s)}
                      aria-pressed={slot?.startsAt === s.startsAt}
                    >
                      {time(s.startsAt)}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  Sem horários para este dia.{' '}
                  <button className="text-button" onClick={() => setStep(2)}>
                    Escolher outro dia
                  </button>
                </div>
              ))}
            {step === 4 && (
              <div className="customer-form">
                <label>
                  Seu nome
                  <input
                    autoComplete="name"
                    value={name}
                    maxLength={100}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Nome e sobrenome"
                  />
                </label>
                <label>
                  WhatsApp com DDD
                  <input
                    type="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                    required
                    placeholder="(71) 99999-9999"
                  />
                </label>
                <label>
                  Alguma observação? <span className="muted">(opcional)</span>
                  <textarea
                    value={notes}
                    maxLength={500}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Algo que devemos saber?"
                  />
                </label>
                <label className="honeypot" aria-hidden="true">
                  Website
                  <input
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    tabIndex={-1}
                    autoComplete="off"
                  />
                </label>
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  Lembrar meus dados neste aparelho
                </label>
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                  />
                  Autorizo o uso dos meus dados para o agendamento, conforme a{' '}
                  <a href="/privacidade" target="_blank" rel="noreferrer">
                    política de privacidade
                  </a>
                  .
                </label>
                <div id="turnstile" />
              </div>
            )}
            {step === 5 && (
              <div className="summary-card">
                <p className="eyebrow">SEU MOMENTO ESTÁ QUASE MARCADO</p>
                <h3>{picked.map((s) => s.name).join(' + ')}</h3>
                <span>{slot?.barberName}</span>
                <strong>
                  {new Date(slot?.startsAt ?? '').toLocaleDateString('pt-BR', {
                    timeZone: 'America/Bahia',
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}{' '}
                  · {slot && time(slot.startsAt)}
                </strong>
                <span>
                  {name} · {phone}
                </span>
                <span>{duration} minutos</span>
                <div className="summary-total">
                  <span>Total a pagar no local</span>
                  <b>{money(total)}</b>
                </div>
                <p className="hint">
                  Você recebe um link seguro para gerenciar seu horário. Nenhum pagamento
                  antecipado.
                </p>
              </div>
            )}
          </div>
          <div className="sheet-bottom">
            <p role="status" aria-live="polite" className="form-error">
              {error}
            </p>
            <div>
              <span className="booking-total">
                {selected.length ? `${duration} min · ${money(total)}` : 'Seu estilo começa aqui'}
              </span>
              <button className="button" disabled={loading} onClick={step === 5 ? confirm : next}>
                {loading ? 'Aguarde…' : step === 5 ? 'Confirmar agendamento' : 'Continuar'}
                {!loading && <ArrowRight size={19} />}
              </button>
            </div>
          </div>
        </>
      )}
      {success && <p role="status">{error}</p>}
    </>
  );
  return standalone ? (
    <main id="main" className="standalone-sheet">
      {inner}
    </main>
  ) : (
    <dialog
      ref={dialog}
      className="booking-dialog"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === dialog.current) onClose();
      }}
    >
      {inner}
    </dialog>
  );
}
