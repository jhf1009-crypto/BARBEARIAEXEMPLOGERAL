'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { site } from '@/site.config';
import { schemas } from '@/lib/validation';
import { ScheduleEditor, BarberSelect } from './admin-fields';
import { DashboardExtras } from './dashboard-extras';
import {
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  Scissors,
  Users,
  UserRound,
  Image as ImageIcon,
  Star,
  Wallet,
  Settings,
  Bell,
  Shield,
  LogOut,
  Plus,
  Search,
  ArrowUpRight,
  Moon,
  Sun,
  Download,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  Activity,
} from 'lucide-react';
type Row = Record<string, unknown>;
type User = { name: string; role: string; mustChangePassword: boolean; barberId: string | null };
type Field = {
  key: string;
  label: string;
  type?: string;
  required?: boolean;
  help?: string;
  options?: [string, string][];
};
const fields: Record<string, Field[]> = {
  services: [
    { key: 'name', label: 'Nome', required: true },
    { key: 'description', label: 'Descrição', type: 'textarea' },
    {
      key: 'price',
      label: 'Preço em centavos',
      type: 'number',
      required: true,
      help: 'R$ 55,00 = 5500',
    },
    { key: 'duration', label: 'Duração (minutos)', type: 'number', required: true },
    { key: 'image', label: 'Foto', type: 'image' },
    { key: 'category', label: 'Categoria' },
    {
      key: 'barberIds',
      label: 'IDs dos barbeiros (JSON)',
      help: '[] permite todos os profissionais.',
    },
    { key: 'active', label: 'Ativo', type: 'checkbox' },
    { key: 'order', label: 'Ordem', type: 'number' },
  ],
  barbers: [
    { key: 'name', label: 'Nome', required: true },
    { key: 'bio', label: 'Biografia', type: 'textarea' },
    { key: 'specialty', label: 'Especialidade', required: true },
    { key: 'image', label: 'Foto', type: 'image' },
    { key: 'commission', label: 'Comissão (%)', type: 'number' },
    {
      key: 'schedule',
      label: 'Jornada semanal (JSON)',
      type: 'textarea',
      help: 'Dias: 0 domingo a 6 sábado. Minutos: 540=09h; 720=12h. Ex.: {"1":[[540,720],[780,1200]]}. Dias ausentes são folgas.',
    },
    { key: 'active', label: 'Ativo', type: 'checkbox' },
  ],
  customers: [
    { key: 'name', label: 'Nome', required: true },
    { key: 'phone', label: 'WhatsApp com DDD', type: 'tel', required: true },
    { key: 'notes', label: 'Observações', type: 'textarea' },
    { key: 'tags', label: 'Tags' },
  ],
  blocks: [
    { key: 'name', label: 'Motivo', required: true },
    {
      key: 'barberId',
      label: 'ID do barbeiro (vazio: todos)',
      help: 'Use para folgas, férias, feriados e intervalos.',
    },
    { key: 'startsAt', label: 'Início', type: 'datetime-local', required: true },
    { key: 'endsAt', label: 'Fim', type: 'datetime-local', required: true },
  ],
  gallery: [
    { key: 'caption', label: 'Legenda', required: true },
    { key: 'image', label: 'Imagem', type: 'image' },
    { key: 'order', label: 'Ordem', type: 'number' },
    { key: 'active', label: 'Publicar', type: 'checkbox' },
  ],
  reviews: [
    { key: 'name', label: 'Cliente', required: true },
    { key: 'text', label: 'Avaliação', type: 'textarea', required: true },
    { key: 'rating', label: 'Nota (1–5)', type: 'number' },
    { key: 'active', label: 'Aprovada / visível', type: 'checkbox' },
  ],
  users: [
    { key: 'name', label: 'Nome', required: true },
    { key: 'email', label: 'E-mail', type: 'email', required: true },
    {
      key: 'password',
      label: 'Senha inicial (mínimo 12 caracteres)',
      type: 'password',
      help: 'Deixe vazio ao editar para manter a senha.',
    },
    {
      key: 'role',
      label: 'Permissão',
      type: 'select',
      options: [
        ['ADMIN', 'Dono'],
        ['MANAGER', 'Gerente'],
        ['BARBER', 'Barbeiro'],
      ],
    },
    { key: 'barberId', label: 'ID do barbeiro vinculado' },
  ],
  settings: [
    { key: 'businessName', label: 'Nome da barbearia' },
    { key: 'phone', label: 'WhatsApp (país + DDD + número)' },
    { key: 'address', label: 'Endereço' },
    { key: 'hours', label: 'Horário de funcionamento' },
    { key: 'headline', label: 'Título principal' },
    { key: 'description', label: 'Subtítulo' },
    { key: 'accent', label: 'Cor de destaque', type: 'color' },
    { key: 'logo', label: 'Logo', type: 'image' },
    { key: 'instagram', label: 'Instagram', type: 'url' },
    { key: 'seoTitle', label: 'Título SEO' },
    { key: 'seoDescription', label: 'Descrição SEO', type: 'textarea' },
    { key: 'whatsappMessage', label: 'Mensagem padrão WhatsApp', type: 'textarea' },
    ...(
      [
        ['minBookingMinutes', 'Antecedência para agendar (min)'],
        ['minCancelMinutes', 'Antecedência para cancelar (min)'],
        ['slotStep', 'Intervalo entre horários (min)'],
        ['bufferMinutes', 'Pausa entre atendimentos (min)'],
        ['maxFutureBookings', 'Limite futuro por cliente'],
        ['maxAdvanceDays', 'Máximo de dias antecipados'],
      ] as const
    ).map(([key, label]) => ({ key, label, type: 'number' })),
  ],
  appointments: [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        ['PENDING', 'Pendente'],
        ['CONFIRMED', 'Confirmado'],
        ['COMPLETED', 'Concluído'],
        ['CANCELLED', 'Cancelado'],
        ['NO_SHOW', 'Não compareceu'],
      ],
    },
    { key: 'internalNotes', label: 'Observações internas', type: 'textarea' },
    {
      key: 'payment',
      label: 'Pagamento',
      type: 'select',
      options: [
        ['PIX', 'Pix'],
        ['CARD', 'Cartão'],
        ['CASH', 'Dinheiro'],
      ],
    },
  ],
};
const modules = [
  ['dashboard', 'Visão geral', LayoutDashboard],
  ['calendar', 'Agenda', CalendarDays],
  ['appointments', 'Agendamentos', ClipboardList],
  ['services', 'Serviços', Scissors],
  ['barbers', 'Equipe', Users],
  ['customers', 'Clientes', UserRound],
  ['blocks', 'Bloqueios', CalendarDays],
  ['gallery', 'Galeria', ImageIcon],
  ['reviews', 'Avaliações', Star],
  ['finance', 'Financeiro', Wallet],
  ['notifications', 'Notificações', Bell],
  ['settings', 'Configurações', Settings],
  ['users', 'Usuários', Shield],
  ['audit', 'Auditoria', Activity],
  ['account', 'Minha conta', UserRound],
] as const;
const labels: Record<string, string> = {
  name: 'Nome',
  caption: 'Legenda',
  text: 'Avaliação',
  price: 'Preço',
  duration: 'Duração',
  category: 'Categoria',
  specialty: 'Especialidade',
  commission: 'Comissão',
  phone: 'WhatsApp',
  tags: 'Tags',
  visits: 'Visitas',
  spent: 'Gasto total',
  lastVisit: 'Última visita',
  startsAt: 'Data / horário',
  endsAt: 'Fim',
  serviceNames: 'Serviço',
  barberName: 'Profissional',
  total: 'Valor',
  status: 'Status',
  payment: 'Pagamento',
  email: 'E-mail',
  role: 'Permissão',
  action: 'Ação',
  target: 'Registro',
  createdAt: 'Criado em',
  userId: 'Usuário',
  active: 'Ativo',
  order: 'Ordem',
  notes: 'Observações',
};
const statuses: Record<string, string> = {
  PENDING: 'Pendente',
  CONFIRMED: 'Confirmado',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
  NO_SHOW: 'Não compareceu',
};
const currency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v / 100);
const text = (v: unknown) => (typeof v === 'string' ? v : typeof v === 'number' ? String(v) : '');
async function api(url: string, data?: unknown) {
  const r = await fetch(
    url,
    data
      ? {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      : undefined,
  );
  const v = await r.json();
  if (!r.ok) throw new Error(v.error ?? 'Não foi possível concluir.');
  return v;
}
export default function AdminPanel({ user }: { user: User }) {
  const router = useRouter();
  const [module, setModule] = useState(user.mustChangePassword ? 'account' : 'dashboard');
  const [payload, setPayload] = useState<{
    rows?: Row[];
    total?: number;
    settings?: Row;
    [key: string]: unknown;
  }>({});
  const [loading, setLoading] = useState(true),
    [message, setMessage] = useState(''),
    [error, setError] = useState(''),
    [search, setSearch] = useState(''),
    [page, setPage] = useState(1),
    [status, setStatus] = useState(''),
    [from, setFrom] = useState(''),
    [to, setTo] = useState(''),
    [dark, setDark] = useState(true),
    [editor, setEditor] = useState<Row | null>(null),
    [saving, setSaving] = useState(false),
    [selected, setSelected] = useState<string[]>([]),
    [calendarMode, setCalendarMode] = useState('day'),
    [barberFilter, setBarberFilter] = useState(''),
    [sound, setSound] = useState(false);
  const modal = useRef<HTMLDialogElement>(null);
  const previousCount = useRef<number | null>(null);
  const [totpSecret, setTotpSecret] = useState('');
  const allowed = modules.filter(([key]) =>
    user.role === 'BARBER'
      ? ['dashboard', 'calendar', 'appointments', 'notifications', 'account'].includes(key)
      : user.role === 'MANAGER'
        ? !['users', 'audit', 'settings'].includes(key)
        : true,
  );
  const query = new URLSearchParams({
    page: String(page),
    search,
    ...(status ? { status } : {}),
    ...(from ? { from: new Date(`${from}T00:00:00-03:00`).toISOString() } : {}),
    ...(to ? { to: new Date(`${to}T23:59:59-03:00`).toISOString() } : {}),
  });
  const queryString = query.toString();
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await api(`/api/admin/${module}?${queryString}`);
      setPayload(result);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao carregar.';
      setError(msg);
      if (msg.includes('Entre para')) router.push('/admin/login');
    } finally {
      setLoading(false);
    }
  }, [module, queryString, router]);
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const v = await api('/api/admin/notifications');
        if (previousCount.current !== null && v.total > previousCount.current) {
          setMessage('Novo agendamento recebido.');
          if (sound) {
            const context = new AudioContext();
            const o = context.createOscillator();
            const g = context.createGain();
            g.gain.value = 0.05;
            o.connect(g);
            g.connect(context.destination);
            o.frequency.value = 660;
            o.start();
            o.stop(context.currentTime + 0.16);
            o.onended = () => void context.close();
          }
        }
        previousCount.current = v.total;
      } catch {
        /* Optional capability or polling error; the primary flow remains usable. */
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [sound]);
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(''), 5000);
    return () => clearTimeout(t);
  }, [message]);
  useEffect(() => {
    if (editor) modal.current?.showModal();
    else modal.current?.close();
  }, [editor]);
  function navigate(key: string) {
    setModule(key);
    setPage(1);
    setSearch('');
    setStatus('');
    setSelected([]);
    setError('');
  }
  async function mutate(action: string, id?: string, data: Row = {}) {
    setSaving(true);
    try {
      await api(`/api/admin/${module === 'calendar' ? 'appointments' : module}`, {
        action,
        id,
        data,
      });
      setEditor(null);
      setMessage('Alterações salvas.');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Tente novamente.');
    } finally {
      setSaving(false);
    }
  }
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const currentFields = fields[module === 'calendar' ? 'appointments' : module] ?? [];
    const data: Row = {};
    for (const f of currentFields) {
      const value = form.get(f.key);
      data[f.key] =
        f.type === 'checkbox'
          ? value === 'on'
          : f.type === 'number'
            ? Number(value)
            : f.type === 'datetime-local'
              ? new Date(String(value)).toISOString()
              : String(value ?? '');
    }
    if (module === 'users') {
      if (!data.password) delete data.password;
      data.barberId = data.barberId || null;
    }
    if (module === 'blocks') data.barberId = data.barberId || null;
    const schema = schemas[module as keyof typeof schemas];
    if (schema) {
      const result = schema.safeParse(data);
      if (!result.success) {
        setError(result.error.issues.map((v) => v.message).join(' · '));
        return;
      }
    }
    await mutate(editor?.id ? 'update' : 'create', text(editor?.id) || undefined, data);
  }
  function openCreate() {
    const blank: Row = {
      active: true,
      order: 0,
      image: '/images/service-1.webp',
      price: 5500,
      duration: 40,
      commission: 40,
      rating: 5,
      role: 'BARBER',
      barberIds: '[]',
      schedule: JSON.stringify(
        Object.fromEntries(
          [1, 2, 3, 4, 5, 6].map((d) => [
            d,
            [
              [540, 720],
              [780, 1200],
            ],
          ]),
        ),
      ),
    };
    setEditor(blank);
    setError('');
  }
  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSaving(true);
    try {
      const form = new FormData();
      form.set('file', file);
      const r = await fetch('/api/upload', { method: 'POST', body: form });
      const v = await r.json();
      if (!r.ok) throw new Error(v.error);
      setEditor((old) => ({ ...old, [e.target.dataset.field ?? 'image']: v.url }));
      setMessage('Foto enviada e otimizada.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro no upload.');
    } finally {
      setSaving(false);
    }
  }
  const rows = payload.rows ?? [];
  const stats = payload.stats as
    | {
        todayRevenue: number;
        weekRevenue: number;
        monthRevenue: number;
        todayCount: number;
        occupancy: number;
      }
    | undefined;
  const total = payload.total ?? 0;
  const completed = rows.filter((r) => r.status === 'COMPLETED');
  const revenue = completed.reduce((sum, r) => sum + Number(r.total), 0);
  const title = modules.find(([key]) => key === module)?.[1];
  const columns = (rows[0] ? Object.keys(rows[0]) : [])
    .filter((key) => labels[key] && !['notes', 'createdAt', 'userId', 'target'].includes(key))
    .slice(0, 8);
  function renderCell(key: string, value: unknown) {
    if (key === 'status')
      return (
        <span className={`status status-${value}`}>{statuses[String(value)] ?? String(value)}</span>
      );
    if (['price', 'total', 'spent'].includes(key)) return currency(Number(value));
    if (['startsAt', 'endsAt', 'lastVisit', 'createdAt'].includes(key))
      return value
        ? new Date(String(value)).toLocaleString('pt-BR', {
            timeZone: 'America/Bahia',
            dateStyle: 'short',
            timeStyle: 'short',
          })
        : '—';
    if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
    return String(value ?? '—');
  }
  return (
    <div className={`admin-shell ${dark ? '' : 'admin-light'}`}>
      <aside className="admin-sidebar">
        <Link href="/" className="brand">
          {site.monogram}
          <span>
            {site.name}
            <small>GESTÃO DA BARBEARIA</small>
          </span>
        </Link>
        <p className="nav-label">SEU NEGÓCIO</p>
        <nav aria-label="Módulos administrativos">
          {allowed.map(([key, label, Icon]) => (
            <button
              key={key}
              className={module === key ? 'active' : ''}
              onClick={() => navigate(key)}
            >
              <Icon size={18} />
              <span>{label}</span>
              {module === key && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <span className="avatar-letter">{user.name[0]}</span>
          <div>
            <strong>{user.name}</strong>
            <small>
              {user.role === 'ADMIN'
                ? 'Administrador'
                : user.role === 'MANAGER'
                  ? 'Gerente'
                  : 'Barbeiro'}
            </small>
          </div>
          <button
            aria-label="Sair"
            className="icon-button"
            onClick={async () => {
              await api('/api/auth/logout', {});
              router.push('/admin/login');
              router.refresh();
            }}
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>
      <div className="admin-main">
        <header className="admin-topbar">
          <span className="muted">Seu negócio, no seu ritmo.</span>
          <div>
            <Link href="/" className="text-button">
              Ver site <ArrowUpRight size={16} />
            </Link>
            <button
              className="icon-button"
              aria-label="Alternar tema"
              onClick={() => setDark((v) => !v)}
            >
              {dark ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            <button
              className="icon-button"
              aria-label="Notificações"
              onClick={() => navigate('notifications')}
            >
              <Bell size={19} />
            </button>
          </div>
        </header>
        <main id="main" className="admin-content">
          <div className="admin-heading">
            <div>
              <p className="eyebrow">GERAL / GESTÃO</p>
              <h1>
                {module === 'dashboard' ? `Bom trabalho, ${user.name.split(' ')[0]}.` : title}
              </h1>
              <p className="muted">
                {module === 'dashboard'
                  ? new Date().toLocaleDateString('pt-BR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      timeZone: 'America/Bahia',
                    })
                  : 'Organize os detalhes. Cuide de quem chega.'}
              </p>
            </div>
            {fields[module] && module !== 'settings' && (
              <button className="button" onClick={openCreate}>
                <Plus size={18} />
                Adicionar{' '}
                {module === 'services'
                  ? 'serviço'
                  : module === 'barbers'
                    ? 'profissional'
                    : 'registro'}
              </button>
            )}
            {['appointments', 'calendar'].includes(module) && (
              <Link className="button" href="/agendar?manual=1" target="_blank">
                <Plus size={18} />
                Agendar cliente
              </Link>
            )}
          </div>
          {user.mustChangePassword && (
            <p className="notice">
              Por segurança, troque sua senha inicial para liberar os módulos.
            </p>
          )}
          {error && !editor && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
          {module !== 'account' && module !== 'settings' && (
            <div className="admin-toolbar">
              <label className="search-field">
                <Search size={17} />
                <input
                  aria-label="Buscar registros"
                  placeholder="Buscar…"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </label>
              {['appointments', 'calendar', 'finance', 'dashboard'].includes(module) && (
                <>
                  <label>
                    De
                    <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
                  </label>
                  <label>
                    Até
                    <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
                  </label>
                </>
              )}
              {['appointments', 'calendar'].includes(module) && (
                <label>
                  Status
                  <select value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="">Todos</option>
                    {Object.entries(statuses).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {['customers', 'finance', 'appointments'].includes(module) &&
                user.role !== 'BARBER' && (
                  <a
                    className="button outline small"
                    href={`/api/admin/${module}?${queryString}&export=csv`}
                  >
                    <Download size={16} />
                    Exportar CSV
                  </a>
                )}
            </div>
          )}
          {loading ? (
            <div className="admin-loading skeleton">Carregando seus dados…</div>
          ) : (
            <>
              {module === 'dashboard' && (
                <>
                  <DashboardExtras stats={stats} rows={rows} />
                  <div className="metric-grid">
                    {[
                      ['Receita no período', currency(revenue), Wallet],
                      ['Agendamentos', String(total), CalendarDays],
                      ['Concluídos', String(completed.length), Check],
                      [
                        'Cancelamentos',
                        String(rows.filter((r) => r.status === 'CANCELLED').length),
                        X,
                      ],
                    ].map(([label, value, Icon]) => {
                      const MetricIcon = Icon as typeof Wallet;
                      return (
                        <div className="metric-card" key={String(label)}>
                          <div>
                            <span>{String(label)}</span>
                            <MetricIcon size={18} />
                          </div>
                          <strong>{String(value)}</strong>
                          <small className="muted">
                            {from || to ? 'Período selecionado' : 'Todos os registros carregados'}
                          </small>
                        </div>
                      );
                    })}
                  </div>
                  <div className="dashboard-grid">
                    <section className="admin-card">
                      <div className="card-heading">
                        <h2>Movimento da semana</h2>
                        <span className="muted">Agendamentos</span>
                      </div>
                      <div className="chart">
                        {Array.from({ length: 7 }, (_, i) => {
                          const date = new Date(Date.now() + (i - 3) * 86400000);
                          const key = date.toLocaleDateString('en-CA', {
                            timeZone: 'America/Bahia',
                          });
                          const count = rows.filter(
                            (r) =>
                              new Date(String(r.startsAt)).toLocaleDateString('en-CA', {
                                timeZone: 'America/Bahia',
                              }) === key,
                          ).length;
                          return (
                            <div className="chart-column" key={key}>
                              <span>{count}</span>
                              <div className="bar-track">
                                <div
                                  style={{
                                    transform: `scaleY(${Math.max(0.025, count / Math.max(1, ...Array.from({ length: 7 }, (_, n) => rows.filter((r) => new Date(String(r.startsAt)).toDateString() === new Date(Date.now() + (n - 3) * 86400000).toDateString()).length)))})`,
                                  }}
                                />
                              </div>
                              <small>
                                {date.toLocaleDateString('pt-BR', { weekday: 'short' })}
                              </small>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                    <section className="admin-card">
                      <h2>Seu negócio em números</h2>
                      <div className="stat-line">
                        <span>Não compareceram</span>
                        <strong>{rows.filter((r) => r.status === 'NO_SHOW').length}</strong>
                      </div>
                      <div className="stat-line">
                        <span>Serviço mais procurado</span>
                        <strong>
                          {Object.entries(
                            rows.reduce((a: Record<string, number>, r) => {
                              a[String(r.serviceNames)] = (a[String(r.serviceNames)] ?? 0) + 1;
                              return a;
                            }, {}),
                          ).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'}
                        </strong>
                      </div>
                      <div className="stat-line">
                        <span>Profissional mais procurado</span>
                        <strong>
                          {Object.entries(
                            rows.reduce((a: Record<string, number>, r) => {
                              a[String(r.barberName)] = (a[String(r.barberName)] ?? 0) + 1;
                              return a;
                            }, {}),
                          ).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'}
                        </strong>
                      </div>
                      <button className="text-button" onClick={() => navigate('finance')}>
                        Ver financeiro <ArrowUpRight size={16} />
                      </button>
                    </section>
                  </div>
                  <section className="admin-card">
                    <div className="card-heading">
                      <h2>Próximos atendimentos</h2>
                      <button className="text-button" onClick={() => navigate('appointments')}>
                        Ver todos <ArrowUpRight size={16} />
                      </button>
                    </div>
                    {rows
                      .filter(
                        (r) =>
                          ['CONFIRMED', 'PENDING'].includes(String(r.status)) &&
                          new Date(String(r.startsAt)) > new Date(),
                      )
                      .slice(0, 6)
                      .map((r) => (
                        <div key={String(r.id)} className="appointment-line">
                          <span className="appointment-hour">
                            {new Date(String(r.startsAt)).toLocaleString('pt-BR', {
                              timeZone: 'America/Bahia',
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          <div>
                            <strong>{text((r.customer as Row)?.name)}</strong>
                            <small>
                              {String(r.serviceNames)} · {String(r.barberName)}
                            </small>
                          </div>
                          {renderCell('status', r.status)}
                        </div>
                      ))}
                  </section>
                </>
              )}
              {module === 'finance' && (
                <>
                  <div className="metric-grid">
                    <div className="metric-card">
                      <span>Receita concluída</span>
                      <strong>{currency(revenue)}</strong>
                    </div>
                    <div className="metric-card">
                      <span>Ticket médio</span>
                      <strong>
                        {currency(completed.length ? Math.round(revenue / completed.length) : 0)}
                      </strong>
                    </div>
                    <div className="metric-card">
                      <span>Atendimentos pagos</span>
                      <strong>{completed.length}</strong>
                    </div>
                  </div>
                  <section className="admin-card">
                    <h2>Comissões por profissional</h2>
                    {((payload.barbers ?? []) as Row[]).map((b) => {
                      const sum = completed
                        .filter((r) => r.barberId === b.id)
                        .reduce((a, r) => a + Number(r.total), 0);
                      return (
                        <div className="stat-line" key={String(b.id)}>
                          <span>
                            {String(b.name)} · {Number(b.commission)}%
                          </span>
                          <strong>
                            {currency(Math.round((sum * Number(b.commission)) / 100))}
                          </strong>
                        </div>
                      );
                    })}
                  </section>
                </>
              )}
              {module === 'calendar' && (
                <section className="admin-card">
                  <div className="button-row">
                    <label>
                      Visualização
                      <select
                        value={calendarMode}
                        onChange={(e) => setCalendarMode(e.target.value)}
                      >
                        <option value="day">Dia</option>
                        <option value="week">Semana</option>
                      </select>
                    </label>
                    <label>
                      Profissional
                      <select
                        value={barberFilter}
                        onChange={(e) => setBarberFilter(e.target.value)}
                      >
                        <option value="">Todos</option>
                        {((payload.barbers ?? []) as Row[]).map((b) => (
                          <option key={String(b.id)} value={String(b.id)}>
                            {String(b.name)}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <p className="hint">
                    Arraste um atendimento até outra faixa para remarcar. No celular, use o botão
                    Remarcar.
                  </p>
                  <div className="calendar-grid">
                    {Array.from({ length: calendarMode === 'week' ? 7 : 1 }, (_, i) => {
                      const day = new Date(
                        `${from || new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bahia' })}T12:00:00-03:00`,
                      );
                      day.setDate(day.getDate() + i);
                      const key = day.toLocaleDateString('en-CA', { timeZone: 'America/Bahia' });
                      return (
                        <div className="calendar-day" key={key}>
                          <h3>
                            {day.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
                          </h3>
                          {Array.from({ length: 12 }, (_, n) => n + 9).map((hour) => (
                            <div
                              className="calendar-slot"
                              key={hour}
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={async (e) => {
                                const id = e.dataTransfer.getData('text/plain');
                                if (id && confirm(`Remarcar para ${key} às ${hour}h?`))
                                  await mutate('update', id, {
                                    startsAt: new Date(
                                      `${key}T${String(hour).padStart(2, '0')}:00:00-03:00`,
                                    ).toISOString(),
                                  });
                              }}
                            >
                              <small>{hour}:00</small>
                              {rows
                                .filter(
                                  (r) =>
                                    (!barberFilter || r.barberId === barberFilter) &&
                                    new Date(String(r.startsAt)).toLocaleDateString('en-CA', {
                                      timeZone: 'America/Bahia',
                                    }) === key &&
                                    Number(
                                      new Date(String(r.startsAt)).toLocaleTimeString('en-GB', {
                                        timeZone: 'America/Bahia',
                                        hour: '2-digit',
                                      }),
                                    ) === hour,
                                )
                                .map((r) => (
                                  <button
                                    draggable
                                    onDragStart={(e) =>
                                      e.dataTransfer.setData('text/plain', String(r.id))
                                    }
                                    className={`calendar-event status-${r.status}`}
                                    key={String(r.id)}
                                    onClick={() => setEditor(r)}
                                  >
                                    {text((r.customer as Row)?.name)}
                                    <small>
                                      {String(r.serviceNames)} · {String(r.barberName)}
                                    </small>
                                  </button>
                                ))}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}
              {module === 'notifications' && (
                <section className="admin-card">
                  <h2>Lembretes e novos horários</h2>
                  <label className="checkbox">
                    <input
                      type="checkbox"
                      checked={sound}
                      onChange={(e) => setSound(e.target.checked)}
                    />
                    Som ao receber novo agendamento
                  </label>
                  <p className="hint">
                    Atualização automática a cada 30 segundos. Envie o lembrete pelo WhatsApp.
                  </p>
                  {rows
                    .filter(
                      (r) =>
                        ['CONFIRMED', 'PENDING'].includes(String(r.status)) &&
                        new Date(String(r.startsAt)) > new Date(),
                    )
                    .map((r) => (
                      <div className="appointment-line" key={String(r.id)}>
                        <div>
                          <strong>{text((r.customer as Row)?.name)}</strong>
                          <small>
                            {new Date(String(r.startsAt)).toLocaleString('pt-BR', {
                              timeZone: 'America/Bahia',
                            })}{' '}
                            · {String(r.serviceNames)}
                          </small>
                        </div>
                        <a
                          className="button outline small"
                          target="_blank"
                          rel="noreferrer"
                          href={`https://wa.me/55${text((r.customer as Row)?.phone).replace(/^55/, '')}?text=${encodeURIComponent(`Olá, ${text((r.customer as Row)?.name)}! Lembrando do seu horário na Barbearia Geral: ${new Date(String(r.startsAt)).toLocaleString('pt-BR', { timeZone: 'America/Bahia' })}. Até lá!`)}`}
                        >
                          Enviar lembrete
                        </a>
                      </div>
                    ))}
                </section>
              )}
              {module === 'settings' && (
                <section className="admin-card">
                  <h2>Dados, marca e regras da agenda</h2>
                  <p>As alterações são aplicadas no site e na disponibilidade de horários.</p>
                  <button className="button" onClick={() => setEditor(payload.settings ?? {})}>
                    Editar configurações
                  </button>
                </section>
              )}
              {module === 'account' && (
                <div className="dashboard-grid">
                  <section className="admin-card">
                    <h2>Trocar senha</h2>
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        setSaving(true);
                        try {
                          await api(
                            '/api/auth/password',
                            Object.fromEntries(new FormData(e.currentTarget)),
                          );
                          setMessage('Senha atualizada.');
                          router.refresh();
                          setModule('dashboard');
                        } catch (e) {
                          setError(e instanceof Error ? e.message : 'Erro.');
                        } finally {
                          setSaving(false);
                        }
                      }}
                    >
                      <label>
                        Senha atual
                        <input
                          name="current"
                          type="password"
                          autoComplete="current-password"
                          required
                        />
                      </label>
                      <label>
                        Nova senha
                        <input
                          name="password"
                          type="password"
                          minLength={12}
                          maxLength={128}
                          autoComplete="new-password"
                          required
                        />
                      </label>
                      <button className="button" disabled={saving}>
                        Salvar senha
                      </button>
                    </form>
                  </section>
                  <section className="admin-card">
                    <h2>Sessões ativas</h2>
                    {((payload.sessions ?? []) as Row[]).map((s) => (
                      <div className="session-line" key={String(s.id)}>
                        <span>
                          {String(s.agent).slice(0, 65)}
                          <small>{new Date(String(s.createdAt)).toLocaleString('pt-BR')}</small>
                        </span>
                        <button
                          className="text-button"
                          onClick={async () => {
                            if (confirm('Encerrar esta sessão?')) {
                              await api('/api/auth/revoke', { sessionId: s.id });
                              void load();
                            }
                          }}
                        >
                          Revogar
                        </button>
                      </div>
                    ))}
                  </section>
                  {user.role === 'ADMIN' && (
                    <section className="admin-card">
                      <h2>Autenticação em duas etapas</h2>
                      {payload.hasTotp ? (
                        <p className="notice">Autenticador ativado.</p>
                      ) : (
                        <>
                          <p>
                            Gere a chave, adicione no seu autenticador e confirme o código para
                            ativar.
                          </p>
                          <button
                            className="button outline"
                            onClick={async () => {
                              const { Secret } = await import('otpauth');
                              setTotpSecret(new Secret({ size: 20 }).base32);
                            }}
                          >
                            Gerar chave TOTP
                          </button>
                          {totpSecret && (
                            <form
                              onSubmit={async (e) => {
                                e.preventDefault();
                                try {
                                  const data = Object.fromEntries(new FormData(e.currentTarget));
                                  await api('/api/auth/totp', { ...data, secret: totpSecret });
                                  setMessage('2FA ativado.');
                                  void load();
                                } catch (e) {
                                  setError(e instanceof Error ? e.message : 'Erro.');
                                }
                              }}
                            >
                              <p className="totp-key">{totpSecret}</p>
                              <label>
                                Código de 6 dígitos
                                <input
                                  name="code"
                                  inputMode="numeric"
                                  pattern="[0-9]{6}"
                                  required
                                />
                              </label>
                              <button className="button">Ativar autenticador</button>
                            </form>
                          )}
                        </>
                      )}
                    </section>
                  )}
                </div>
              )}
              {!['dashboard', 'settings', 'account', 'calendar', 'notifications'].includes(
                module,
              ) && (
                <section className="admin-card table-card">
                  {selected.length > 0 && module === 'appointments' && user.role !== 'BARBER' && (
                    <div className="button-row">
                      <span>{selected.length} selecionados</span>
                      <button
                        className="button outline small"
                        onClick={() => {
                          if (confirm('Cancelar todos os selecionados?'))
                            void mutate('bulk', undefined, { ids: selected, status: 'CANCELLED' });
                        }}
                      >
                        Cancelar selecionados
                      </button>
                      <button
                        className="button outline small"
                        onClick={() =>
                          void mutate('bulk', undefined, { ids: selected, status: 'COMPLETED' })
                        }
                      >
                        Concluir selecionados
                      </button>
                    </div>
                  )}
                  {!rows.length ? (
                    <div className="empty-state">
                      <Scissors size={30} />
                      <h2>Nenhum registro por aqui.</h2>
                      <p>Altere os filtros ou adicione um novo registro.</p>
                    </div>
                  ) : (
                    <div className="table-scroll">
                      <table>
                        <thead>
                          <tr>
                            {module === 'appointments' && <th>Selecionar</th>}
                            {['appointments', 'finance'].includes(module) && <th>Cliente</th>}
                            {columns.map((c) => (
                              <th key={c}>{labels[c]}</th>
                            ))}
                            {module === 'audit' && (
                              <>
                                <th>Usuário</th>
                                <th>Registro</th>
                                <th>Quando</th>
                              </>
                            )}
                            {fields[module] && <th>Ações</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((r) => (
                            <tr
                              key={String(r.id)}
                              draggable={module === 'gallery'}
                              onDragStart={(e) =>
                                e.dataTransfer.setData('text/plain', String(r.id))
                              }
                              onDragOver={(e) => {
                                if (module === 'gallery') e.preventDefault();
                              }}
                              onDrop={async (e) => {
                                if (module !== 'gallery') return;
                                const dragged = rows.find(
                                  (v) => v.id === e.dataTransfer.getData('text/plain'),
                                );
                                if (dragged && dragged.id !== r.id) {
                                  await api('/api/admin/gallery', {
                                    action: 'update',
                                    id: dragged.id,
                                    data: { ...dragged, order: r.order },
                                  });
                                  await api('/api/admin/gallery', {
                                    action: 'update',
                                    id: r.id,
                                    data: { ...r, order: dragged.order },
                                  });
                                  void load();
                                }
                              }}
                            >
                              {module === 'appointments' && (
                                <td>
                                  <input
                                    aria-label={`Selecionar ${text((r.customer as Row)?.name)}`}
                                    type="checkbox"
                                    checked={selected.includes(String(r.id))}
                                    onChange={(e) =>
                                      setSelected((old) =>
                                        e.target.checked
                                          ? [...old, String(r.id)]
                                          : old.filter((v) => v !== r.id),
                                      )
                                    }
                                  />
                                </td>
                              )}
                              {['appointments', 'finance'].includes(module) && (
                                <td>
                                  <strong>{text((r.customer as Row)?.name)}</strong>
                                  <small>{text((r.customer as Row)?.phone)}</small>
                                </td>
                              )}
                              {columns.map((c) => (
                                <td key={c}>{renderCell(c, r[c])}</td>
                              ))}
                              {module === 'audit' && (
                                <>
                                  <td>{String(r.userId)}</td>
                                  <td>{String(r.target)}</td>
                                  <td>{renderCell('createdAt', r.createdAt)}</td>
                                </>
                              )}
                              {fields[module] && (
                                <td>
                                  <div className="table-actions">
                                    <button
                                      className="text-button"
                                      onClick={() => {
                                        setEditor(r);
                                        setError('');
                                      }}
                                    >
                                      Editar
                                    </button>
                                    {module === 'appointments' ? (
                                      <a
                                        href={`https://wa.me/55${text((r.customer as Row)?.phone).replace(/^55/, '')}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-button"
                                      >
                                        WhatsApp
                                      </a>
                                    ) : (
                                      <button
                                        className="text-button danger"
                                        onClick={() => {
                                          if (
                                            confirm(
                                              `Excluir ${r.name ?? r.caption ?? 'este registro'}? Esta ação não pode ser desfeita.`,
                                            )
                                          )
                                            void mutate('delete', String(r.id));
                                        }}
                                      >
                                        Excluir
                                      </button>
                                    )}
                                    {module === 'customers' && (
                                      <button
                                        className="text-button"
                                        onClick={() => {
                                          if (
                                            confirm(
                                              'Anonimizar os dados deste cliente e remover suas observações?',
                                            )
                                          )
                                            void mutate('anonymize', String(r.id));
                                        }}
                                      >
                                        Anonimizar
                                      </button>
                                    )}
                                  </div>
                                  {module === 'customers' && (
                                    <button
                                      className="text-button"
                                      onClick={() => {
                                        setModule('appointments');
                                        setSearch(String(r.name));
                                        setPage(1);
                                      }}
                                    >
                                      Ver histórico
                                    </button>
                                  )}
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <div className="pagination">
                    <span>{total} registros</span>
                    <div>
                      <button
                        disabled={page === 1}
                        className="icon-button"
                        onClick={() => setPage((v) => v - 1)}
                        aria-label="Página anterior"
                      >
                        <ChevronLeft />
                      </button>
                      <span>Página {page}</span>
                      <button
                        disabled={page * 25 >= total}
                        className="icon-button"
                        onClick={() => setPage((v) => v + 1)}
                        aria-label="Próxima página"
                      >
                        <ChevronRight />
                      </button>
                    </div>
                  </div>
                </section>
              )}
            </>
          )}
        </main>
      </div>
      <nav className="admin-mobile-nav" aria-label="Navegação mobile">
        {allowed
          .filter(([key]) => ['dashboard', 'calendar', 'appointments', 'account'].includes(key))
          .map(([key, label, Icon]) => (
            <button
              key={key}
              className={module === key ? 'active' : ''}
              onClick={() => navigate(key)}
            >
              <Icon size={20} />
              <small>{label}</small>
            </button>
          ))}
        <label className="more-modules">
          Mais
          <select
            aria-label="Outros módulos"
            value={module}
            onChange={(e) => navigate(e.target.value)}
          >
            {allowed.map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </nav>
      <dialog ref={modal} className="admin-dialog" onCancel={() => setEditor(null)}>
        <div className="card-heading">
          <h2>
            {module === 'settings'
              ? 'Configurações'
              : editor?.id
                ? 'Editar registro'
                : 'Novo registro'}
          </h2>
          <button
            className="icon-button"
            onClick={() => setEditor(null)}
            aria-label="Fechar formulário"
          >
            <X />
          </button>
        </div>
        {editor && (
          <form onSubmit={save} key={String(editor.id ?? 'new') + module}>
            {(fields[module === 'calendar' ? 'appointments' : module] ?? []).map((f) =>
              ['schedule', 'barberIds'].includes(f.key) ? (
                <div key={f.key}>
                  <p>
                    {f.key === 'schedule'
                      ? 'Horários de trabalho e intervalos'
                      : 'Profissionais que executam o serviço'}
                  </p>
                  {f.key === 'schedule' ? (
                    <ScheduleEditor value={text(editor[f.key])} />
                  ) : (
                    <BarberSelect name="barberIds" value={text(editor[f.key])} multiple />
                  )}
                </div>
              ) : (
                <label key={f.key} className={f.type === 'checkbox' ? 'checkbox' : ''}>
                  {f.type === 'checkbox' ? (
                    <>
                      <input name={f.key} type="checkbox" defaultChecked={Boolean(editor[f.key])} />
                      {f.label}
                    </>
                  ) : (
                    <>
                      {f.label}
                      {f.key === 'barberId' ? (
                        <BarberSelect name={f.key} value={text(editor[f.key])} />
                      ) : f.type === 'select' ? (
                        <select name={f.key} defaultValue={text(editor[f.key])}>
                          {f.options?.map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      ) : f.type === 'textarea' ? (
                        <textarea
                          name={f.key}
                          defaultValue={text(editor[f.key])}
                          required={f.required}
                          rows={f.key === 'schedule' ? 6 : 3}
                        />
                      ) : f.type === 'image' ? (
                        <>
                          <input
                            name={f.key}
                            value={text(editor[f.key])}
                            onChange={(e) =>
                              setEditor((old) => ({ ...old, [f.key]: e.target.value }))
                            }
                          />
                          <input
                            aria-label={`Enviar ${f.label}`}
                            data-field={f.key}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/avif"
                            onChange={upload}
                          />
                        </>
                      ) : (
                        <input
                          name={f.key}
                          type={f.type ?? 'text'}
                          required={f.required}
                          defaultValue={
                            f.type === 'password'
                              ? ''
                              : f.type === 'datetime-local' && editor[f.key]
                                ? new Date(
                                    new Date(text(editor[f.key])).getTime() -
                                      new Date().getTimezoneOffset() * 60000,
                                  )
                                    .toISOString()
                                    .slice(0, 16)
                                : text(editor[f.key])
                          }
                        />
                      )}
                    </>
                  )}
                  {f.help && <small className="muted">{f.help}</small>}
                </label>
              ),
            )}
            {['appointments', 'calendar'].includes(module) && (
              <>
                <label>
                  Remarcar para (opcional)
                  <input
                    type="datetime-local"
                    onChange={async (e) => {
                      if (e.target.value && confirm('Remarcar para este horário?'))
                        await mutate('update', String(editor.id), {
                          startsAt: new Date(e.target.value).toISOString(),
                        });
                    }}
                  />
                </label>
                <p className="hint">O servidor valida novamente a disponibilidade.</p>
                <details>
                  <summary>Histórico de alterações</summary>
                  {((editor.history ?? []) as Row[]).map((h) => (
                    <p className="hint" key={String(h.id)}>
                      {new Date(String(h.createdAt)).toLocaleString('pt-BR')} · {String(h.action)} ·{' '}
                      {String(h.userId)}
                    </p>
                  ))}
                </details>
              </>
            )}
            <p className="form-error" role="status">
              {error}
            </p>
            <div className="button-row">
              <button className="button" disabled={saving}>
                {saving ? 'Salvando…' : 'Salvar alterações'}
              </button>
              <button type="button" className="button outline" onClick={() => setEditor(null)}>
                Voltar
              </button>
            </div>
          </form>
        )}
      </dialog>
      {message && (
        <div role="status" className="toast">
          <Check size={18} />
          {message}
        </div>
      )}
    </div>
  );
}
