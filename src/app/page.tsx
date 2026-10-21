import Link from 'next/link';
import {
  ArrowUpRight,
  ArrowRight,
  Clock3,
  MapPin,
  Star,
  Scissors,
  Check,
  Camera,
} from 'lucide-react';
import { publicData } from '@/lib/public-data';
import { site } from '@/site.config';
import { Photo } from '@/components/photo';
import { PublicInteractions } from '@/components/public-interactions';
import { headers } from 'next/headers';
export const dynamic = 'force-dynamic';
export async function generateMetadata() {
  const { cfg } = await publicData();
  return {
    title: cfg.seoTitle,
    description: cfg.seoDescription,
    openGraph: { title: cfg.seoTitle, description: cfg.seoDescription },
  };
}
const money = (n: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(n / 100);
export default async function Home() {
  const { services, barbers, gallery, reviews, cfg } = await publicData();
  const whatsapp = `https://wa.me/${cfg.phone}?text=${encodeURIComponent(cfg.whatsappMessage)}`;
  const nonce = (await headers()).get('x-nonce') ?? undefined;
  const structured = {
    '@context': 'https://schema.org',
    '@type': 'HairSalon',
    name: cfg.businessName,
    url: process.env.APP_URL ?? 'http://localhost:3000',
    telephone: `+${cfg.phone}`,
    image: `${process.env.APP_URL ?? 'http://localhost:3000'}${site.hero}`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: site.street,
      addressLocality: site.city,
      addressRegion: site.region,
      postalCode: site.postalCode,
      addressCountry: 'BR',
    },
    openingHours: ['Mo-Fr 09:00-20:00', 'Sa 09:00-18:00'],
    priceRange: 'R$ 15–85',
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Serviços',
      itemListElement: services.map((s) => ({
        '@type': 'Offer',
        price: (s.price / 100).toFixed(2),
        priceCurrency: 'BRL',
        itemOffered: { '@type': 'Service', name: s.name },
      })),
    },
  };
  return (
    <>
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structured).replace(/</g, '\\u003c') }}
      />
      <header className="site-header">
        <a className="brand" href="/">
          {cfg.logo ? (
            <img src={cfg.logo} width="120" height="44" alt={cfg.businessName} />
          ) : (
            <>
              <span className="brand-mark">{site.monogram}</span>
              <span>
                {site.name}
                <small>BARBEARIA</small>
              </span>
            </>
          )}
        </a>
        <nav aria-label="Principal">
          <a href="#servicos">Serviços</a>
          <a href="#equipe">Barbeiros</a>
          <a href="#espaco">O espaço</a>
        </nav>
        <a className="button small" href="/agendar" data-book>
          Agendar <ArrowUpRight size={16} />
        </a>
      </header>
      <main id="main" style={{ '--accent': cfg.accent } as React.CSSProperties}>
        <section className="hero">
          <div className="hero-photo">
            <Photo
              src={site.hero}
              alt="Barbeiro fazendo um corte com atenção aos detalhes"
              priority
            />
            <div className="photo-shade" />
          </div>
          <div className="hero-content wrap">
            <p className="eyebrow hero-enter">
              SALVADOR · PITUBA <span className="short-line" /> ESTILO DE VERDADE
            </p>
            <h1 className="hero-enter">{cfg.headline}</h1>
            <p className="hero-sub hero-enter">{cfg.description}</p>
            <a href="/agendar" data-book className="button hero-cta hero-enter">
              Agendar meu horário <ArrowUpRight size={21} />
            </a>
            <div className="hero-proof hero-enter">
              <span className="stars">★★★★★</span>
              <span>
                Quem vem, volta.<small>Cuidado que faz a diferença.</small>
              </span>
            </div>
          </div>
          <span className="hero-caption">CORTES BEM FEITOS. SEM COMPLICAÇÃO.</span>
          <a href="#servicos" className="hero-scroll">
            ROLE PARA CONHECER ↓
          </a>
        </section>
        <div className="promise-strip">
          <span>
            <Check size={16} /> Horário marcado, sem espera
          </span>
          <span>
            <Scissors size={16} /> Profissionais que entendem você
          </span>
          <span>
            <MapPin size={16} /> No coração da Pituba
          </span>
        </div>
        <section id="servicos" className="section wrap">
          <div className="section-heading reveal">
            <div>
              <p className="eyebrow">01 / DO SEU JEITO</p>
              <h2>O cuidado que você merece.</h2>
            </div>
            <p>
              Escolha seu serviço.
              <br />O próximo passo é com a gente.
            </p>
          </div>
          <div className="service-grid">
            {services.map((s, i) => (
              <article className="service-card reveal" key={s.id}>
                <div className="service-image">
                  <Photo src={s.image} alt={s.name} />
                  {i === 2 && <span className="tag">EXPERIÊNCIA COMPLETA</span>}
                </div>
                <div className="service-body">
                  <div className="service-top">
                    <h3>{s.name}</h3>
                    <strong>{money(s.price)}</strong>
                  </div>
                  <p>{s.description}</p>
                  <div className="service-bottom">
                    <span>
                      <Clock3 size={14} />
                      {s.duration} min
                    </span>
                    <a
                      href={`/agendar?service=${s.id}`}
                      data-book
                      data-service={s.id}
                      aria-label={`Agendar ${s.name}`}
                    >
                      Agendar <ArrowUpRight size={17} />
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
        <section id="equipe" className="section team-section">
          <div className="wrap">
            <div className="section-heading reveal">
              <div>
                <p className="eyebrow">02 / MÃOS QUE ENTENDEM</p>
                <h2>Seu estilo está em boas mãos.</h2>
              </div>
              <p>
                Técnica, personalidade
                <br />e atenção em cada detalhe.
              </p>
            </div>
            <div className="team-grid">
              {barbers.map((b, i) => (
                <article className="team-card reveal" key={b.id}>
                  <div className="team-photo">
                    <Photo src={b.image} alt={`Retrato de ${b.name}`} />
                    <span className="team-number">0{i + 1}</span>
                  </div>
                  <div className="team-info">
                    <div>
                      <h3>{b.name}</h3>
                      <p>{b.specialty}</p>
                    </div>
                    <a
                      className="icon-button"
                      href={`/agendar?barber=${b.id}`}
                      data-book
                      data-barber={b.id}
                      aria-label={`Agendar com ${b.name}`}
                    >
                      <ArrowUpRight />
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section id="trabalhos" className="section wrap">
          <div className="section-heading reveal">
            <div>
              <p className="eyebrow">03 / O RESULTADO FALA</p>
              <h2>Detalhes que fazem o estilo.</h2>
            </div>
            <span className="muted">Deslize para explorar →</span>
          </div>
          <div className="gallery" aria-label="Galeria de trabalhos">
            {gallery.map((g) => (
              <button
                key={g.id}
                className="gallery-item"
                data-gallery={g.image}
                data-caption={g.caption}
                aria-label={`Ampliar: ${g.caption}`}
              >
                <Photo src={g.image} alt={g.caption} />
                <span>
                  {g.caption}
                  <ArrowUpRight size={17} />
                </span>
              </button>
            ))}
          </div>
        </section>
        <section className="reviews-section section">
          <div className="wrap">
            <p className="eyebrow">A MELHOR INDICAÇÃO É DE QUEM JÁ SENTOU NA CADEIRA.</p>
            <div className="review-grid">
              {reviews.map((r) => (
                <figure key={r.id} className="review reveal">
                  <div className="stars" role="img" aria-label={`${r.rating} de 5 estrelas`}>
                    {Array.from({ length: r.rating }, (_, i) => (
                      <Star size={14} fill="currentColor" key={i} />
                    ))}
                  </div>
                  <blockquote>“{r.text}”</blockquote>
                  <figcaption>
                    <span className="avatar-letter">{r.name[0]}</span>
                    {r.name}
                    <span className="muted">Cliente da casa</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
        <section id="espaco" className="section wrap location">
          <div className="space-photo reveal">
            <Photo
              src={site.space}
              alt="Interior da barbearia, um espaço para cuidar do seu estilo"
            />
          </div>
          <div className="location-copy reveal">
            <p className="eyebrow">04 / CHEGA MAIS</p>
            <h2>
              Sua pausa.
              <br />
              Seu lugar.
            </h2>
            <p>Um espaço para desacelerar e sair renovado.</p>
            <div className="location-detail">
              <MapPin />
              <div>
                <strong>Estamos na Pituba</strong>
                <p>{cfg.address}</p>
              </div>
            </div>
            <div className="location-detail">
              <Clock3 />
              <div>
                <strong>Escolha seu melhor momento</strong>
                <p>{cfg.hours}</p>
              </div>
            </div>
            <div className="button-row">
              <a
                className="button"
                target="_blank"
                rel="noreferrer"
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cfg.address)}`}
              >
                Como chegar <ArrowUpRight size={18} />
              </a>
              <a className="button outline" href={whatsapp}>
                WhatsApp <ArrowUpRight size={18} />
              </a>
            </div>
            <details className="map">
              <summary>Ver no mapa</summary>
              <iframe
                title="Localização da barbearia"
                loading="lazy"
                referrerPolicy="no-referrer"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(cfg.address)}&output=embed`}
              />
            </details>
          </div>
        </section>
        <section className="closing wrap reveal">
          <p className="eyebrow">RESERVE UM TEMPO PARA VOCÊ.</p>
          <h2>
            Seu próximo corte
            <br />
            começa aqui.
          </h2>
          <a href="/agendar" data-book className="button">
            Escolher meu horário <ArrowUpRight size={20} />
          </a>
          <p>Rápido de agendar. Bom de voltar.</p>
        </section>
      </main>
      <footer className="footer wrap">
        <a href="/" className="brand">
          {site.name}
          <small>BARBEARIA</small>
        </a>
        <p>{cfg.address}</p>
        <div>
          <a href={cfg.instagram} aria-label="Instagram">
            <Camera size={20} />
          </a>
          <Link href="/privacidade">Privacidade</Link>
          <Link href="/termos">Termos</Link>
          <Link href="/admin">Área da equipe</Link>
        </div>
        <small>
          © {new Date().getFullYear()} {cfg.businessName}. Feito com cuidado.
        </small>
      </footer>
      <div className="mobile-dock">
        <a href={whatsapp} className="dock-whatsapp" aria-label="Conversar pelo WhatsApp">
          WhatsApp <ArrowUpRight size={17} />
        </a>
        <a className="button" href="/agendar" data-book>
          Agendar horário <ArrowRight size={18} />
        </a>
      </div>
      <PublicInteractions />
    </>
  );
}
