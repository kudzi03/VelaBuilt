import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import styles from "./RestaurantShowcase.module.css";

export function RestaurantShowcase() {
  return <section id="showcase" data-chapter="reading" className={`sheet ${styles.section}`} aria-labelledby="showcase-heading">
    <div className="shell">
      <Reveal className={styles.heading}>
        <div><p className="label">Try an example website · Fictional restaurant</p>
          <h2 id="showcase-heading" className="display-lg mt-5">A first impression.<br />A next step.</h2></div>
        <p className={styles.intro}>Step inside a restaurant website. Explore the menu, request a table, and see what happens after the restaurant hears from you.</p>
      </Reveal>
      <Reveal>
        <Link href="/demo/ember-and-grain" prefetch={false} className={styles.preview} aria-label="Explore Ember & Grain, a fictional restaurant website concept">
          <Image src="/demo/ember/interior.webp" alt="An original restaurant concept: warm pendant lights, linen tables and an open hearth" fill sizes="(max-width: 700px) 1000px, 90vw" className={styles.image} />
          <div className={styles.top}><span>Ember & Grain</span><span>Restaurant concept / 01</span></div>
          <div className={styles.title}>GOOD FOOD.<br /><span>LONG EVENINGS.</span></div>
          <div className={styles.bottom}><span>Original concept · Fictional restaurant</span><span className={styles.enter}>Enter the experience <span aria-hidden="true">↗</span></span></div>
        </Link>
      </Reveal>
      <div className={styles.caption}><p>Designed to draw you in and make booking easy.</p><p>Works on phones · Interactive menu · Sample bookings</p></div>
    </div>
  </section>;
}
