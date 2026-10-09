"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { site } from "@/content/site";
import styles from "./RestaurantDemo.module.css";

const menus = {
  "To begin": [
    { name: "Bread, still warm", detail: "Cultured butter · smoked sea salt", price: "65", plant: true },
    { name: "Carrots from the fire", detail: "Whipped tahini · garden herbs · toasted seeds", price: "95", plant: true },
    { name: "Burrata & late tomatoes", detail: "Basil oil · sourdough · cracked pepper", price: "125", plant: true },
  ],
  "From the hearth": [
    { name: "Wood-fired linefish", detail: "Lemon butter · charred greens · new potatoes", price: "245", plant: false },
    { name: "Slow Sunday short rib", detail: "Silky potato · red wine jus · pearl onions", price: "285", plant: false },
    { name: "The autumn garden", detail: "Roasted squash · wild mushrooms · herb grains", price: "185", plant: true },
  ],
  "Something sweet": [
    { name: "Dark chocolate crémeux", detail: "Olive oil · sea salt · cocoa crumb", price: "95", plant: true },
    { name: "A pear, slowly roasted", detail: "Vanilla cream · honey · toasted almonds", price: "85", plant: true },
    { name: "One more espresso", detail: "Double espresso · a little almond biscuit", price: "40", plant: true },
  ],
};
type Menu = keyof typeof menus;
type Booking = { date: string; time: string; guests: string; occasion: string };
const stages = ["Enquiry received", "Instant response", "Guest record", "Booking & reminder", "The follow-up"];
function localDate(offset = 0) {
  const d = new Date(); d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function RestaurantDemo() {
  const [category, setCategory] = useState<Menu>("To begin");
  const [vegetarian, setVegetarian] = useState(false);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [step, setStep] = useState(0);
  const [earliest, setEarliest] = useState("");
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const hero = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = hero.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = Math.max(0, Math.min(1, -el.getBoundingClientRect().top / el.offsetHeight));
      el.style.setProperty("--travel", `${y * 7}%`);
    };
    const scroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    window.addEventListener("scroll", scroll, { passive: true });
    return () => { window.removeEventListener("scroll", scroll); cancelAnimationFrame(frame); };
  }, []);

  useEffect(() => {
    if (!open) return;
    const previous = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => { document.documentElement.style.overflow = previous; };
  }, [open]);

  function reserve() {
    opener.current = document.activeElement as HTMLElement;
    setEarliest(localDate()); setError("");
    setBooking(null); setStep(0); form.current?.reset();
    dialog.current?.showModal(); setOpen(true);
  }
  function close() { dialog.current?.close(); }
  function advance() {
    const next = Math.min(step + 1, stages.length - 1);
    setStep(next);
    if (next === stages.length - 1) {
      requestAnimationFrame(() => document.getElementById("demo-build-link")?.focus());
    }
  }
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const date = String(data.get("date"));
    if (date < localDate()) { setError("Choose today or a later date for this demonstration."); return; }
    setError("");
    setBooking({ date, time: String(data.get("time")), guests: String(data.get("guests")), occasion: String(data.get("occasion")) });
    setStep(0);
    // Keep focus in the new confirmation when the form disappears.
    requestAnimationFrame(() => document.getElementById("demo-confirmation")?.focus());
  }
  const dateLabel = booking ? new Date(`${booking.date}T12:00:00`).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" }) : "";
  const details = booking ? [
    `Alex Morgan’s request for ${booking.guests} guests on ${dateLabel} at ${booking.time} is captured from the website.`,
    `“Hello Alex. We have your request for ${booking.guests} guests. Our team will check the table and confirm shortly.” A sample acknowledgement, shown here only.`,
    `Alex Morgan · alex@example.com · ${booking.guests} guests · ${booking.occasion}. The sample CRM record keeps the request and its next action together.`,
    `After the restaurant accepts, the sample booking is confirmed for ${dateLabel} at ${booking.time}. A reminder would be scheduled before the visit.`,
    "The day after the visit, a short thank-you and review request would complete the journey. If the guest replies, a person takes over.",
  ] : [];

  return <div className={styles.demo} data-demo="ember-and-grain">
    <div className={styles.studioBar}><Link href="/#showcase">← Back to VelaBuilt</Link><span>Fictional restaurant · Interactive concept</span><Link href="/start">Build something like this ↗</Link></div>
    <section ref={hero} className={styles.hero} aria-labelledby="restaurant-title">
      <div className={styles.heroImage}><Image src="/demo/ember/interior.webp" alt="Warmly lit restaurant interior with linen tables, arched windows and an open hearth; original concept imagery" fill sizes="(max-width: 800px) 1200px, 100vw" priority /></div>
      <nav className={styles.nav} aria-label="Restaurant concept">
        <a href="#restaurant-title" className={styles.brand}>e<span>&</span>g<span className={styles.brandLine}>Ember & Grain</span></a>
        <div><a href="#story">Our table</a><a href="#menu">The menu</a><button onClick={reserve} className={styles.navBook}>Find a table <span aria-hidden="true">↗</span></button></div>
      </nav>
      <div className={styles.heroWords}><p className={styles.eyebrow}>A little fire. A lot of heart.</p><h1 id="restaurant-title"><span>EMBER</span><span><i>&</i> GRAIN</span></h1></div>
      <div className={styles.heroBottom}><p>Food with a sense of place.<br />Evenings with no reason to rush.</p><a href="#story">Come on in <span aria-hidden="true">↓</span></a><span className={styles.heroNote}>Seasonal kitchen<br />An original VelaBuilt concept</span></div>
    </section>

    <section id="story" className={styles.story} aria-labelledby="story-title">
      <div className={styles.storyHead}><p className={styles.eyebrow}>01 / Around our table</p><p>Unhurried by nature.<br />Generous by design.</p></div>
      <h2 id="story-title">Some things<br />are better <em>slow.</em></h2>
      <div className={styles.storyBody}><span className={styles.star} aria-hidden="true">✳</span><p>A glowing hearth. Something good in your glass. A table that feels like it was waiting for you. At Ember & Grain, the seasons set the menu and the evening finds its own pace.</p><a href="#menu" className={styles.textLink}>See what is cooking <span aria-hidden="true">↗</span></a></div>
    </section>

    <section id="menu" className={styles.menuSection} aria-labelledby="menu-title">
      <div className={styles.foodImage}><Image src="/demo/ember/table.webp" alt="Fire-roasted carrots with whipped tahini and herbs, beside sourdough on a walnut table; original concept imagery" fill sizes="(max-width: 800px) 100vw, 48vw" /><span>From the fire, to your table.</span></div>
      <div className={styles.menuContent}><p className={styles.eyebrow}>02 / The seasonal menu</p><h2 id="menu-title">Simple things.<br /><em>Done beautifully.</em></h2>
        <div className={styles.categories} aria-label="Menu courses">{(Object.keys(menus) as Menu[]).map(item => <button key={item} aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>)}</div>
        <label className={styles.filter}><input type="checkbox" checked={vegetarian} onChange={e => setVegetarian(e.target.checked)} /> Vegetarian dishes only</label>
        <div className={styles.dishes} aria-live="polite" aria-atomic="true" key={`${category}-${vegetarian}`}>
          {menus[category].filter(d => !vegetarian || d.plant).map(d => <article key={d.name}><div><h3>{d.name}</h3><p>{d.detail}</p></div><span>R{d.price}</span></article>)}
        </div>
        <p className={styles.menuNote}>Illustrative menu & prices in ZAR. This is a fictional restaurant.</p>
        <button className={styles.darkButton} onClick={reserve}>Make an evening of it <span aria-hidden="true">↗</span></button>
      </div>
    </section>

    <section className={styles.reservation} aria-labelledby="table-title"><p className={styles.eyebrow}>03 / Stay a little longer</p><h2 id="table-title">Your evening.<br /><em>Your table.</em></h2><p>Two people catching up. Six celebrating something.<br />There is always a good reason to gather.</p><button onClick={reserve} className={styles.lightButton}>Try a reservation <span aria-hidden="true">↗</span></button><small>A local simulation. No real booking or message is sent.</small></section>

    <section className={styles.buildNote} aria-labelledby="build-title"><div><p className={styles.eyebrow}>The experience, and what happens next.</p><h2 id="build-title">A website opens the door.<br />A system takes it from there.</h2></div><div><p>This fictional concept connects the first impression to a useful next step: a request, a reply, a guest record and a follow-up. Try the reservation to see the whole journey with sample data.</p><Link href="/start" className={styles.textLink}>Let’s build yours <span aria-hidden="true">↗</span></Link></div></section>
    <footer className={styles.footer}><Link href="/">Designed & engineered by VelaBuilt</Link><p>Ember & Grain is a fictional concept. Original AI-generated imagery.</p><a href={`mailto:${site.email}`}>Contact the studio ↗</a></footer>

    <dialog ref={dialog} className={styles.dialog} aria-labelledby="reservation-title" onClose={() => { setOpen(false); opener.current?.focus(); }} onClick={e => { if (e.target === e.currentTarget) close(); }}>
      <div className={styles.dialogInner}><div className={styles.dialogTop}><p className={styles.eyebrow}>Ember & Grain / Demo reservation</p><button onClick={close} aria-label="Close reservation" className={styles.close}>×</button></div>
        <h2 id="reservation-title">{booking ? "An evening, connected." : "Let’s find your table."}</h2>
        <p className={styles.disclosure}>Simulation only. No real booking, email or CRM update. Nothing entered here is saved or sent.</p>
        {!booking ? <form ref={form} onSubmit={submit} className={styles.form}>
          <p className={styles.sampleGuest}>Your sample guest: <strong>Alex Morgan</strong> · alex@example.com</p>
          <div className={styles.formGrid}><label>Date<input type="date" name="date" min={earliest} defaultValue={earliest} required /></label><label>Time<select name="time" defaultValue="19:00"><option>18:00</option><option>19:00</option><option>20:00</option></select></label><label>Guests<select name="guests" defaultValue="2"><option value="2">2 guests</option><option value="4">4 guests</option><option value="6">6 guests</option></select></label><label>The occasion<select name="occasion" defaultValue="An evening out"><option>An evening out</option><option>A celebration</option><option>A catch-up</option></select></label></div>
          {error && <p role="alert">{error}</p>}
          <button className={styles.darkButton} type="submit">Send a demo request <span aria-hidden="true">↗</span></button>
        </form> : <div id="demo-confirmation" tabIndex={-1} className={styles.confirmation}>
          <p className={styles.receipt}>✓ Demo request received <span>{booking.guests} guests · {dateLabel} · {booking.time}</span></p>
          <p className={styles.journeyLabel}>Behind the experience · Step {step + 1} of 5</p>
          <ol className={styles.steps} aria-label="Simulated customer journey">{stages.map((label, i) => <li key={label} data-active={i === step} data-complete={i < step}><span>{i < step ? "✓" : String(i + 1).padStart(2, "0")}</span>{label}</li>)}</ol>
          <div className={styles.stepDetail} aria-live="polite" aria-atomic="true"><h3>{stages[step]}</h3><p>{details[step]}</p><small>{step === 3 ? "Human approval before a booking is confirmed." : "Illustrative behaviour · no external service is connected."}</small></div>
          <div className={styles.journeyActions}>{step < stages.length - 1 ? <button className={styles.darkButton} onClick={advance}>Show {stages[step + 1]?.toLowerCase()} <span aria-hidden="true">→</span></button> : <Link id="demo-build-link" href="/start" onClick={close} className={styles.darkButton}>Build a journey like this ↗</Link>}<button className={styles.textLink} onClick={() => { setBooking(null); setStep(0); }}>Try another request</button></div>
        </div>}
      </div>
    </dialog>
  </div>;
}
