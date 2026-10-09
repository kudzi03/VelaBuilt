import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import styles from "./RestaurantShowcase.module.css";

export function RestaurantShowcase() {
  return <section id="showcase" data-chapter="reading" className={`sheet ${styles.section}`} aria-labelledby="showcase-heading">
    <div className="shell">
      <Reveal className={styles.heading}>
        <div><p className="label">In the making · An interactive concept</p>
          <h2 id="showcase-heading" className="display-lg mt-5">A first impression.<br />A next step.</h2></div>
        <p className={styles.intro}>Step inside a restaurant website. Explore the menu, request a table, and see how one enquiry becomes a connected customer journey.</p>
      </Reveal>
      <Reveal>
        <Link href="/demo/ember-and-grain" prefetch={false} className={styles.preview} aria-label="Explore Ember & Grain, a fictional restaurant website concept">
          <Image src="/demo/ember/interior.webp" alt="An original restaurant concept: warm pendant lights, linen tables and an open hearth" fill sizes="(max-width: 768px) 100vw, 90vw" className={styles.image} />
          <div className={styles.top}><span>Ember & Grain</span><span>Restaurant concept / 01</span></div>
          <div className={styles.title}>GOOD FOOD.<br /><span>LONG EVENINGS.</span></div>
          <div className={styles.bottom}><span>Original concept · Fictional restaurant</span><span className={styles.enter}>Enter the experience <span aria-hidden="true">↗</span></span></div>
        </Link>
      </Reveal>
      <div className={styles.caption}><p>Designed to draw you in. Built to carry the enquiry through.</p><p>Responsive website · Interactive menu · Simulated bookings</p></div>
    </div>
  </section>;
}
