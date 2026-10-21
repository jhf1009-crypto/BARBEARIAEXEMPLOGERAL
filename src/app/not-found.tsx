import Link from 'next/link';
export default function NotFound() {
  return (
    <main id="main" className="not-found">
      <p className="eyebrow">404 / SAÍMOS UM POUCO DA LINHA</p>
      <h1>
        Esse caminho
        <br />
        não está na agenda.
      </h1>
      <p>Vamos encontrar o seu próximo horário?</p>
      <Link className="button" href="/agendar">
        Agendar horário →
      </Link>
      <Link className="text-button" href="/">
        Voltar ao início
      </Link>
    </main>
  );
}
