'use client';

import { useCallback, useState } from 'react';
import { Nav } from '@/components/Nav';
import { Hero } from '@/components/Hero';
import { IslandMap } from '@/components/IslandMap';
import { Arrival, Build, Excursions, Faq, Final, Reviews, Tokenomics } from '@/components/Sections';
import { BookingModal, type BookingState } from '@/components/BookingModal';

export default function Page() {
  const [booking, setBooking] = useState<BookingState>({ open: false });

  const openBooking = useCallback(
    (islandId?: string) => setBooking({ open: true, islandId }),
    [],
  );
  const closeBooking = useCallback(() => setBooking({ open: false }), []);

  return (
    <>
      <Nav />
      <main>
        <Hero onBook={openBooking} />
        <IslandMap onBook={openBooking} />
        <Arrival />
        <Build onBook={openBooking} />
        <Excursions />
        <Tokenomics />
        <Reviews />
        <Faq />
        <Final onBook={openBooking} />
      </main>
      <BookingModal state={booking} onClose={closeBooking} />
    </>
  );
}
