'use client';
type Row = Record<string, unknown>;
type Stats = {
  todayRevenue: number;
  weekRevenue: number;
  monthRevenue: number;
  todayCount: number;
  occupancy: number;
};
const money = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v / 100);
export function DashboardExtras({ stats, rows }: { stats?: Stats; rows: Row[] }) {
  if (!stats) return null;
  const revenue = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(Date.now() - (6 - i) * 86400000);
    const key = day.toLocaleDateString('en-CA', { timeZone: 'America/Bahia' });
    return {
      label: day.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      value: rows
        .filter(
          (r) =>
            r.status === 'COMPLETED' &&
            new Date(String(r.startsAt)).toLocaleDateString('en-CA', {
              timeZone: 'America/Bahia',
            }) === key,
        )
        .reduce((s, r) => s + Number(r.total), 0),
    };
  });
  const peaks = Array.from({ length: 12 }, (_, i) => ({
    label: `${i + 9}h`,
    value: rows.filter(
      (r) =>
        r.status !== 'CANCELLED' &&
        Number(
          new Date(String(r.startsAt)).toLocaleTimeString('en-GB', {
            timeZone: 'America/Bahia',
            hour: '2-digit',
          }),
        ) ===
          i + 9,
    ).length,
  }));
  const noShows = rows.filter((r) => r.status === 'NO_SHOW').length;
  return (
    <>
      <div className="metric-grid">
        <div className="metric-card">
          <span>Faturamento hoje</span>
          <strong>{money(stats.todayRevenue)}</strong>
          <small>{stats.todayCount} atendimentos previstos</small>
        </div>
        <div className="metric-card">
          <span>Faturamento da semana</span>
          <strong>{money(stats.weekRevenue)}</strong>
          <small>Semana atual, desde segunda-feira</small>
        </div>
        <div className="metric-card">
          <span>Faturamento do mês</span>
          <strong>{money(stats.monthRevenue)}</strong>
          <small>Somente atendimentos concluídos</small>
        </div>
        <div className="metric-card">
          <span>Ocupação de hoje</span>
          <strong>{stats.occupancy}%</strong>
          <small>Jornadas descontadas de bloqueios</small>
        </div>
      </div>
      <div className="dashboard-grid">
        <section className="admin-card">
          <h2>Receita dos últimos 7 dias</h2>
          <div
            className="chart"
            role="img"
            aria-label={revenue.map((v) => `${v.label}: ${money(v.value)}`).join(', ')}
          >
            {revenue.map((v) => (
              <div key={v.label} className="chart-column">
                <span>{money(v.value)}</span>
                <div className="bar-track">
                  <div
                    style={{
                      transform: `scaleY(${Math.max(0.015, v.value / Math.max(1, ...revenue.map((v) => v.value)))})`,
                    }}
                  />
                </div>
                <small>{v.label}</small>
              </div>
            ))}
          </div>
        </section>
        <section className="admin-card">
          <h2>Horários mais procurados</h2>
          <div
            className="chart"
            role="img"
            aria-label={peaks.map((v) => `${v.label}: ${v.value} agendamentos`).join(', ')}
          >
            {peaks.map((v) => (
              <div key={v.label} className="chart-column">
                <span>{v.value}</span>
                <div className="bar-track">
                  <div
                    style={{
                      transform: `scaleY(${Math.max(0.015, v.value / Math.max(1, ...peaks.map((v) => v.value)))})`,
                    }}
                  />
                </div>
                <small>{v.label}</small>
              </div>
            ))}
          </div>
          <p className="hint">
            Não comparecimento: {rows.length ? Math.round((noShows / rows.length) * 100) : 0}% no
            período carregado.
          </p>
        </section>
      </div>
    </>
  );
}
