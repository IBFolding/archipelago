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
  Stats,
  Ticker,
  Tokenomics,
} from '@/components/Sections';
import { BookingModal, type BookingState } from '@/components/BookingModal';
import { LandOffice } from '@/components/LandOffice';
import { ALL_PLOTS, type Plot } from '@/lib/plots';
import { ISLANDS } from '@/lib/content';

const LOTS = ALL_PLOTS.length;
const FOR_SALE = ALL_PLOTS.filter((p) => !p.claimed || p.resale).length;

const TICKER = [
  `${LOTS} lots surveyed`,
  `${FOR_SALE} for sale today`,
  '18 islands',
  'A · R · C',
  'Land in dollars',
  '$ISLAND for everything else',
  '35% buyback and burn',
  'Sharks: yes',
  'Checkout at noon',
];

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
        <Ticker items={TICKER} />
        <Stats lots={LOTS} forSale={FOR_SALE} islands={ISLANDS.length} />
        <IslandMap onBook={showLand} />
        <Arrival />
        <LandOffice onClaim={claimPlot} focusIslandId={focusIslandId} />
        <Build onBook={showLand} />
        <Excursions />
        <Events />
        <Tokenomics />
        <Reviews />
        <Faq />
        <Ticker items={TICKER} reverse />
        <Final onBook={showLand} />
      </main>
      <BookingModal state={booking} onClose={closeBooking} />
    </>
  );
}
