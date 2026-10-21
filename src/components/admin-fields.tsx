'use client';
import { useEffect, useState } from 'react';
type Schedule = Record<string, number[][]>;
const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const hhmm = (minute: number) =>
  `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;
const minutes = (v: string) => {
  const [h, m] = v.split(':').map(Number);
  return h * 60 + m;
};
export function ScheduleEditor({ value }: { value: string }) {
  const [schedule, setSchedule] = useState<Schedule>(() => {
    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  });
  function update(day: number, range: number, index: number, val: string) {
    setSchedule((old) => ({
      ...old,
      [day]: (old[day] ?? []).map((pair, i) =>
        i === range ? pair.map((n, j) => (j === index ? minutes(val) : n)) : pair,
      ),
    }));
  }
  return (
    <div className="schedule-editor">
      <input type="hidden" name="schedule" value={JSON.stringify(schedule)} />
      {days.map((day, i) => (
        <div className="schedule-day" key={day}>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={!!schedule[i]?.length}
              onChange={(e) =>
                setSchedule((old) => ({
                  ...old,
                  [i]: e.target.checked
                    ? [
                        [540, 720],
                        [780, 1200],
                      ]
                    : [],
                }))
              }
            />
            {day}
          </label>
          {schedule[i]?.map((pair, n) => (
            <div className="schedule-range" key={n}>
              <input
                type="time"
                aria-label={`${day}, início do turno ${n + 1}`}
                value={hhmm(pair[0])}
                onChange={(e) => update(i, n, 0, e.target.value)}
              />
              <span>até</span>
              <input
                type="time"
                aria-label={`${day}, fim do turno ${n + 1}`}
                value={hhmm(pair[1])}
                onChange={(e) => update(i, n, 1, e.target.value)}
              />
              <button
                type="button"
                className="text-button danger"
                aria-label={`Remover turno ${n + 1} de ${day}`}
                onClick={() =>
                  setSchedule((old) => ({ ...old, [i]: old[i].filter((_, j) => j !== n) }))
                }
              >
                ×
              </button>
            </div>
          ))}
          {!!schedule[i]?.length && (
            <button
              type="button"
              className="text-button"
              onClick={() => setSchedule((old) => ({ ...old, [i]: [...old[i], [780, 1080]] }))}
            >
              + Adicionar turno
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
export function BarberSelect({
  name,
  value,
  multiple = false,
}: {
  name: string;
  value: string;
  multiple?: boolean;
}) {
  const [barbers, setBarbers] = useState<{ id: string; name: string }[]>([]);
  const [selected, setSelected] = useState<string[]>(() => {
    if (!multiple) return value ? [value] : [];
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  });
  useEffect(() => {
    fetch('/api/catalog')
      .then((r) => r.json())
      .then((v) => setBarbers(v.barbers))
      .catch(() => setBarbers([]));
  }, []);
  if (!multiple)
    return (
      <select name={name} defaultValue={value}>
        <option value="">Todos / sem vínculo</option>
        {barbers.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>
    );
  return (
    <div>
      <input name={name} type="hidden" value={JSON.stringify(selected)} />
      <p className="hint">Nenhum marcado permite todos os profissionais.</p>
      {barbers.map((b) => (
        <label className="checkbox" key={b.id}>
          <input
            type="checkbox"
            checked={selected.includes(b.id)}
            onChange={(e) =>
              setSelected((old) =>
                e.target.checked ? [...old, b.id] : old.filter((v) => v !== b.id),
              )
            }
          />
          {b.name}
        </label>
      ))}
    </div>
  );
}
