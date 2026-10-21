'use client';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import BookingSheet from '@/components/booking-sheet';
function BookingPage() {
  const q = useSearchParams();
  const router = useRouter();
  return (
    <BookingSheet
      standalone
      manual={q.get('manual') === '1'}
      initialService={q.get('service') ?? undefined}
      initialBarber={q.get('barber') ?? undefined}
      rescheduleToken={q.get('reschedule') ?? undefined}
      onClose={() => router.push(q.get('manual') === '1' ? '/admin' : '/')}
    />
  );
}
export default function Page() {
  return (
    <Suspense fallback={<p>Carregando agenda…</p>}>
      <BookingPage />
    </Suspense>
  );
}
