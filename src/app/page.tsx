'use client';

import { useCallback, useState } from 'react';
import { Nav } from '@/components/Nav';
import { Hero } from '@/components/Hero';
import { IslandMap } from '@/components/IslandMap';
import {
  Arrival,
  Build,
  Events,
  Excursions,
  Faq,
  Final,
  Reviews,
  Tokenomics,
} from '@/components/Sections';
import { BookingModal, type BookingState } from '@/components/BookingModal';
import { LandOffice } from '@/components/LandOffice';
import type { Plot } from '@/lib/plots';

export default function Page() {
  const [booking, setBooking] = useState<BookingState>({ open: false });
  const [focusIslandId, setFocusIslandId] = useState<string | undefined>();

  /** Hero booking bar, island map and build cards all funnel to the parcels. */
  const showLand = useCallback((islandId?: string) => {
    if (islandId) setFocusIslandId(islandId);
    document.getElementById('land')?.scrollIntoView({ block: 'start' });
  }, []);

  const claimPlot = useCallback(
    (plot: Plot) => setBooking({ open: true, plot, islandId: plot.islandId }),
    [],
  );
  const closeBooking = useCallback(() => setBooking({ open: false }), []);

  return (
    <>
      <Nav />
      <main>
        <Hero onBook={showLand} />
        <IslandMap onBook={showLand} />
        <Arrival />
        <LandOffice onClaim={claimPlot} focusIslandId={focusIslandId} />
        <Build onBook={showLand} />
        <Excursions />
        <Events />
        <Tokenomics />
        <Reviews />
        <Faq />
        <Final onBook={showLand} />
      </main>
      <BookingModal state={booking} onClose={closeBooking} />
    </>
  );
}
