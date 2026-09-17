'use client';

import { useState } from 'react';
import { EVENTS, EXCURSIONS, FAQS, REVIEWS, TREASURY, VILLAS } from '@/lib/content';
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
            <div className="kicker light">The arrival process</div>
            <h2 className="section-title">
              Everyone starts the same way:
              <br />
              wet, broke and optimistic.
            </h2>
          </div>
          <p className="lead" style={{ color: 'rgba(255,255,255,.72)' }}>
            No shortcuts, no starter mansion. You wash up on your plot like it is day one of
            the island and you have to earn the hammock.
          </p>
        </div>

        <ol className={styles.steps}>
          {steps.map((s) => (
            <li key={s.n}>
              <span>{s.n}</span>
              <h3>{s.t}</h3>
              <p>{s.c}</p>
            </li>
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
            <div className="kicker">What you can put on it</div>
            <h2 className="section-title">Rates, if you insist on calling them that.</h2>
          </div>
          <p className="lead">
            Everything here is built by you, on your land, out of materials you dragged up a
            beach. The prices are what it costs in $ISLAND to skip the dragging.
          </p>
        </div>

        <div className={styles.villaGrid}>
          {VILLAS.map((v) => (
            <article key={v.id} className={styles.villa}>
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
            <div className="kicker light">Conditions on the ARC</div>
            <h2 className="section-title">
              The island is not
              <br />
              a passive investment.
            </h2>
          </div>
          <p className="lead" style={{ color: 'rgba(255,255,255,.72)' }}>
            Weather, wildlife and other people arrive on their own schedule. Your build
            either survives them or becomes a story. Both are content.
          </p>
        </div>

        <div className={styles.eventGrid}>
          {EVENTS.map((e) => (
            <article key={e.id} className={`${styles.event} ${styles[e.severity]}`}>
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
            <div className="kicker">Do something. Apparently.</div>
            <h2 className="section-title">
              Activities for people
              <br />
              who are bad at relaxing.
            </h2>
          </div>
          <p className="lead">
            Missions, basically, and the reason $ISLAND exists. You buy adventures with the
            token, not land. Some pay out. Some pay out and then something eats your dock.
          </p>
        </div>

        <div className={styles.excGrid}>
          {EXCURSIONS.map((e) => {
            const added = plan.includes(e.id);
            const open = openId === e.id;
            return (
              <article
                key={e.id}
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
            <div className="kicker light">Your folio</div>
            <h2 className="section-title">
              Where the money from
              <br />
              every plot actually goes.
            </h2>
          </div>
          <p className="lead" style={{ color: 'rgba(255,255,255,.72)' }}>
            Land is bought and sold in dollars, and can be resold by its owner at whatever
            the market will bear. $ISLAND is the in-island currency: adventures, materials,
            upgrades, bar tabs. Here is where every dollar of land revenue goes.
          </p>
        </div>

        <div className={styles.folio}>
          <div className={styles.bar} role="img" aria-label="Land sale allocation">
            {TREASURY.map((t) => (
              <span key={t.label} style={{ width: `${t.pct}%`, background: t.color }} />
            ))}
          </div>

          <ul className={styles.folioList}>
            {TREASURY.map((t) => (
              <li key={t.label}>
                <i style={{ background: t.color }} aria-hidden="true" />
                <b>{t.pct}%</b>
                <div>
                  <strong>{t.label}</strong>
                  <p>{t.detail}</p>
                </div>
              </li>
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

export function Reviews() {
  return (
    <section className={styles.section}>
      <div className="shell">
        <div className="kicker">Definitely real reviews</div>
        <h2 className="section-title">Guests have thoughts.</h2>
        <div className={styles.quotes}>
          {REVIEWS.map((r) => (
            <blockquote key={r.who}>
              <div className={styles.stars} aria-label={`${r.stars} out of 5`}>
                {'★'.repeat(r.stars)}
                {'☆'.repeat(5 - r.stars)}
              </div>
              <p>“{r.quote}”</p>
              <cite>— {r.who}</cite>
            </blockquote>
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
            <div className="kicker">Important vacation shit</div>
            <h2 className="section-title">
              Before you pack six shirts
              <br />
              and wear one.
            </h2>
          </div>
        </div>
        <div className={styles.faq}>
          {FAQS.map((f) => (
            <details key={f.q}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
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
