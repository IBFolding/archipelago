'use client';

import { useState } from 'react';
import { EVENTS, EXCURSIONS, FAQS, REVIEWS, TREASURY, VILLAS } from '@/lib/content';
import { Counter, GrowBar, TiltCard, Ticker } from './Motion';
import { Reveal, SplitHeading } from './Reveal';
import styles from './Sections.module.css';

const VIBE_LABEL: Record<string, string> = {
  good: 'Genuinely nice',
  mixed: 'Could go either way',
  cursed: 'Something will happen',
};

/** How the game actually plays, told as a resort arrival sequence. */
export function Arrival() {
  const steps = [
    {
      n: '01',
      t: 'You land with nothing',
      c: 'No house. No boat. One bag and a sunburn already forming. This is the resort experience.',
    },
    {
      n: '02',
      t: 'You claim a plot',
      c: 'Clear the palms, level the sand, and put down something that technically counts as shelter.',
    },
    {
      n: '03',
      t: 'You build it out',
      c: 'Hut becomes villa becomes bar becomes a dock with your name on it. Decorate it until it is unmistakably yours.',
    },
    {
      n: '04',
      t: 'The island fights back',
      c: 'Storms. Sharks. Lava. Piranhas in a lagoon that was fine last week. Rebuild and charge tourists more.',
    },
  ];

  return (
    <section className={`${styles.section} ${styles.dark}`} id="arrival">
      <div className="shell">
        <div className="section-head">
          <div>
            <Reveal>
              <div className="kicker light">The arrival process</div>
            </Reveal>
            <SplitHeading
              text={'Everyone starts the same way:\nwet, broke and optimistic.'}
            />
          </div>
          <Reveal delay={120} className="lead" style={{ color: 'rgba(255,255,255,.72)' }}>
            No shortcuts, no starter mansion. You wash up on your plot like it is day one of
            the island and you have to earn the hammock.
          </Reveal>
        </div>

        <ol className={styles.steps}>
          {steps.map((s, i) => (
            <Reveal as="li" key={s.n} delay={i * 90}>
              <span>{s.n}</span>
              <h3>{s.t}</h3>
              <p>{s.c}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

/** Build catalogue, dressed as villa rates. */
export function Build({ onBook }: { onBook: (islandId?: string) => void }) {
  return (
    <section className={styles.section} id="build">
      <div className="shell">
        <div className="section-head">
          <div>
            <Reveal>
              <div className="kicker">What you can put on it</div>
            </Reveal>
            <SplitHeading text={'Rates, if you insist\non calling them that.'} />
          </div>
          <Reveal delay={120} className="lead">
            Everything here is built by you, on your land, out of materials you dragged up a
            beach. The prices are what it costs in $ISLAND to skip the dragging.
          </Reveal>
        </div>

        <div className={styles.villaGrid}>
          {VILLAS.map((v, i) => (
            <Reveal key={v.id} delay={i * 90}>
             <TiltCard>
              <article className={styles.villa}>
              <div className={styles.villaTag}>{v.tag}</div>
              <h3>{v.name}</h3>
              <p>{v.copy}</p>
              <ul>
                {v.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <div className={styles.villaFoot}>
                <div>
                  <strong>{v.nightly.toLocaleString()}</strong>
                  <small>$ISLAND to build</small>
                </div>
                <button onClick={() => onBook()}>Find a plot</button>
              </div>
              </article>
             </TiltCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Live numbers, straight out of the generated plats. */
export function Stats({
  lots,
  forSale,
  islands,
}: {
  lots: number;
  forSale: number;
  islands: number;
}) {
  const items = [
    { n: lots, label: 'Lots surveyed' },
    { n: forSale, label: 'For sale today' },
    { n: islands, label: 'Islands' },
    { n: 3, label: 'Letters to live on' },
  ];
  return (
    <section className={styles.stats}>
      <div className="shell">
        <div className={styles.statGrid}>
          {items.map((it, i) => (
            <Reveal key={it.label} delay={i * 90} variant="scale">
              <div className={styles.stat}>
                <strong>
                  <Counter to={it.n} />
                </strong>
                <span>{it.label}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const SEVERITY_LABEL: Record<string, string> = {
  nuisance: 'Nuisance',
  serious: 'Serious',
  catastrophic: 'Catastrophic',
};

/** What the island does back to you. */
export function Events() {
  return (
    <section className={`${styles.section} ${styles.dark}`} id="events">
      <div className="shell">
        <div className="section-head">
          <div>
            <Reveal>
              <div className="kicker light">Conditions on the ARC</div>
            </Reveal>
            <SplitHeading text={'The island is not\na passive investment.'} />
          </div>
          <Reveal delay={120} className="lead" style={{ color: 'rgba(255,255,255,.72)' }}>
            Weather, wildlife and other people arrive on their own schedule. Your build
            either survives them or becomes a story. Both are content.
          </Reveal>
        </div>

        <div className={styles.eventGrid}>
          {EVENTS.map((e, i) => (
            <Reveal key={e.id} delay={i * 80}>
             <TiltCard>
              <article className={`${styles.event} ${styles[e.severity]}`}>
              <div className={styles.eventTop}>
                <span className={styles.eventIcon} aria-hidden="true">
                  {e.icon}
                </span>
                <span className={styles.sev}>{SEVERITY_LABEL[e.severity]}</span>
              </div>
              <small>{e.frequency}</small>
              <h3>{e.name}</h3>
              <p>{e.copy}</p>
              <p className={styles.defence}>
                <b>Defence:</b> {e.defence}
              </p>
              </article>
             </TiltCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Excursions + the day planner. */
export function Excursions() {
  const [plan, setPlan] = useState<string[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  const toggle = (id: string) =>
    setPlan((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  return (
    <section className={styles.section} id="excursions">
      <div className="shell">
        <div className="section-head">
          <div>
            <Reveal>
              <div className="kicker">Do something. Apparently.</div>
            </Reveal>
            <SplitHeading text={'Activities for people\nwho are bad at relaxing.'} />
          </div>
          <Reveal delay={120} className="lead">
            Missions, basically, and the reason $ISLAND exists. You buy adventures with the
            token, not land. Some pay out. Some pay out and then something eats your dock.
          </Reveal>
        </div>

        <div className={styles.excGrid}>
          {EXCURSIONS.map((e, i) => {
            const added = plan.includes(e.id);
            const open = openId === e.id;
            return (
              <Reveal key={e.id} delay={i * 70}>
               <TiltCard>
                <article
                  className={`${styles.exc} ${styles[e.vibe]} ${added ? styles.excOn : ''}`}
                >
                <div className={styles.excTop}>
                  <span className={styles.excIcon} aria-hidden="true">
                    {e.icon}
                  </span>
                  <span className={styles.vibe}>{VIBE_LABEL[e.vibe]}</span>
                </div>
                <small>
                  {e.time} · {e.duration}
                </small>
                <h3>{e.title}</h3>
                <p className={styles.excPrice}>
                  {e.price.toLocaleString()} <span>$ISLAND</span>
                </p>
                <p>{e.copy}</p>

                <button
                  className={styles.smallPrintBtn}
                  aria-expanded={open}
                  onClick={() => setOpenId(open ? null : e.id)}
                >
                  {open ? 'Hide the small print' : 'Read the small print'}
                </button>
                {open && <p className={styles.smallPrint}>{e.smallPrint}</p>}

                <button className={styles.excAdd} onClick={() => toggle(e.id)}>
                  {added ? '✓ On your schedule' : 'Add to my day +'}
                </button>
                </article>
               </TiltCard>
              </Reveal>
            );
          })}
        </div>

        <div className={styles.planner}>
          <div>
            <small>Your extremely demanding schedule</small>
            <strong>
              {plan.length
                ? EXCURSIONS.filter((e) => plan.includes(e.id))
                    .map((e) => e.title)
                    .join(' · ')
                : 'Nothing planned. Beautiful.'}
            </strong>
          </div>
          <button onClick={() => setPlan([])} disabled={!plan.length}>
            Clear schedule
          </button>
        </div>
      </div>
    </section>
  );
}

/** Land-sale split, presented as a hotel folio. */
export function Tokenomics() {
  return (
    <section className={`${styles.section} ${styles.dark}`} id="tokenomics">
      <div className="shell">
        <div className="section-head">
          <div>
            <Reveal>
              <div className="kicker light">Your folio</div>
            </Reveal>
            <SplitHeading text={'Where the money from\nevery lot actually goes.'} />
          </div>
          <Reveal delay={120} className="lead" style={{ color: 'rgba(255,255,255,.72)' }}>
            Land is bought and sold in dollars, and can be resold by its owner at whatever
            the market will bear. $ISLAND is the in-island currency: adventures, materials,
            upgrades, bar tabs. Here is where every dollar of land revenue goes.
          </Reveal>
        </div>

        <div className={styles.folio}>
          <GrowBar
            segments={TREASURY.map((t) => ({
              pct: t.pct,
              color: t.color,
              label: t.label,
            }))}
          />

          <ul className={styles.folioList}>
            {TREASURY.map((t, i) => (
              <Reveal as="li" key={t.label} delay={i * 80}>
                <i style={{ background: t.color }} aria-hidden="true" />
                <b>
                  <Counter to={t.pct} suffix="%" />
                </b>
                <div>
                  <strong>{t.label}</strong>
                  <p>{t.detail}</p>
                </div>
              </Reveal>
            ))}
          </ul>

          <p className={styles.folioNote}>
            Total: 100%. Dollars come in from land, and 35 cents of each one leaves through
            the $ISLAND burn. No hidden resort fee, no mysterious “resort levy”, no $14
            bottle of water.
          </p>
        </div>
      </div>
    </section>
  );
}

export { Ticker };

export function Reviews() {
  return (
    <section className={styles.section}>
      <div className="shell">
        <Reveal>
          <div className="kicker">Definitely real reviews</div>
        </Reveal>
        <SplitHeading text="Guests have thoughts." />
        <div className={styles.quotes}>
          {REVIEWS.map((r, i) => (
            <Reveal as="blockquote" key={r.who} delay={i * 90}>
              <div className={styles.stars} aria-label={`${r.stars} out of 5`}>
                {'★'.repeat(r.stars)}
                {'☆'.repeat(5 - r.stars)}
              </div>
              <p>“{r.quote}”</p>
              <cite>— {r.who}</cite>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Faq() {
  return (
    <section className={styles.section} id="faq">
      <div className="shell">
        <div className="section-head">
          <div>
            <Reveal>
              <div className="kicker">Important vacation shit</div>
            </Reveal>
            <SplitHeading text={'Before you pack six shirts\nand wear one.'} />
          </div>
        </div>
        <div className={styles.faq}>
          {FAQS.map((f, i) => (
            <Reveal as="details" key={f.q} delay={i * 60}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Final({ onBook }: { onBook: (islandId?: string) => void }) {
  return (
    <>
      <section className={styles.final} id="get">
        <div className="shell">
          <div className="kicker light">ARCHipelago · resort &amp; questionable life choices</div>
          <h2>
            Get your $ISLAND.
            <br />
            Miss your flight.
          </h2>
          <p>Ocean view included. Good decisions sold separately.</p>
          <div className={styles.finalCtas}>
            <a className={styles.finalPrimary} href="#tokenomics">
              Get $ISLAND →
            </a>
            <button className={styles.finalSecondary} onClick={() => onBook()}>
              Browse the parcels
            </button>
          </div>
        </div>
      </section>
      <footer className={styles.footer}>
        ARCHIPELAGO · $ISLAND · SOMEWHERE BETWEEN ARC AND A VERY LONG WEEKEND
      </footer>
    </>
  );
}
