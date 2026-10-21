'use client';
import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
const Booking = dynamic(() => import('./booking-sheet'), { ssr: false });
export function PublicInteractions() {
  const [booking, setBooking] = useState<{ service?: string; barber?: string } | null>(null);
  const gallery = useRef<HTMLDialogElement>(null);
  const cursor = useRef<HTMLDivElement>(null);
  const [photo, setPhoto] = useState({ src: '', caption: '' });
  useEffect(() => {
    let previous = window.scrollY;
    let ticking = false;
    const header = document.querySelector('.site-header');
    const hero = document.querySelector<HTMLElement>('.hero-photo');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const capable = !reduced && (navigator.hardwareConcurrency || 4) >= 4;
    const scroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        header?.classList.toggle(
          'header-hidden',
          window.scrollY > previous && window.scrollY > 200,
        );
        previous = window.scrollY;
        if (hero && capable && previous < innerHeight) {
          hero.style.transform = `translateY(${previous * 0.1}px)`;
        }
        ticking = false;
      });
    };
    window.addEventListener('scroll', scroll, { passive: true });
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            if (!reduced)
              e.target.animate(
                [
                  { opacity: 0, transform: 'translateY(20px)' },
                  { opacity: 1, transform: 'translateY(0)' },
                ],
                {
                  duration: 420,
                  delay: Number((e.target as HTMLElement).dataset.revealDelay ?? 0),
                  easing: 'cubic-bezier(.2,0,0,1)',
                },
              );
            observer.unobserve(e.target);
          }
        }),
      { threshold: 0.08 },
    );
    document.querySelectorAll<HTMLElement>('.reveal').forEach((e, i) => {
      e.dataset.revealDelay = String((i % 3) * 55);
      observer.observe(e);
    });
    let pointerFrame = 0;
    const pointer = (event: PointerEvent) => {
      if (!matchMedia('(pointer: fine)').matches || reduced) return;
      cancelAnimationFrame(pointerFrame);
      pointerFrame = requestAnimationFrame(() => {
        if (cursor.current)
          cursor.current.style.transform = `translate(${event.clientX - 13}px, ${event.clientY - 13}px)`;
      });
    };
    document.addEventListener('pointermove', pointer, { passive: true });
    const click = (event: MouseEvent) => {
      const el = (event.target as HTMLElement).closest<HTMLAnchorElement>('[data-book]');
      if (el) {
        event.preventDefault();
        navigator.vibrate?.(8);
        setBooking({ service: el.dataset.service, barber: el.dataset.barber });
      }
      const image = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-gallery]');
      if (image) {
        setPhoto({ src: image.dataset.gallery ?? '', caption: image.dataset.caption ?? '' });
        gallery.current?.showModal();
      }
    };
    document.addEventListener('click', click);
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
    return () => {
      window.removeEventListener('scroll', scroll);
      document.removeEventListener('click', click);
      document.removeEventListener('pointermove', pointer);
      cancelAnimationFrame(pointerFrame);
      observer.disconnect();
    };
  }, []);
  return (
    <>
      <div ref={cursor} className="cursor-ring" aria-hidden="true" />
      {booking && (
        <Booking
          initialService={booking.service}
          initialBarber={booking.barber}
          onClose={() => setBooking(null)}
        />
      )}
      <dialog ref={gallery} className="lightbox">
        <button
          className="icon-button lightbox-close"
          onClick={() => gallery.current?.close()}
          aria-label="Fechar imagem"
        >
          ✕
        </button>
        {photo.src && <img src={photo.src} width="900" height="1000" alt={photo.caption} />}
        <p>{photo.caption}</p>
      </dialog>
    </>
  );
}
