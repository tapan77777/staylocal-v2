import Image from 'next/image'
import Link from 'next/link'
import s from './Editorial.module.css'

export default function DiscoveryChoices() {
  return <section id="discover" className={s.section} aria-labelledby="discovery-heading">
    <div className={s.sectionHead}><div><p className="eyebrow">Two ways to get away</p><h2 id="discovery-heading">Follow your feeling.</h2></div><p>Take the trail. Or take your time.<br />We’ll help you find your way.</p></div>
    <div className={s.choices}>
      <Link href="/treks" className={s.choice}>
        <Image src="/images/mountain-trail.jpg" alt="Clouds gathering around a Himalayan mountain ridge" fill sizes="(max-width: 700px) 100vw, 50vw" className={s.cover} />
        <div className={s.choiceShade} /><div className={s.choiceCopy}><span className={s.lightEyebrow}>For the call of the mountains</span><h3>Treks</h3><p>High trails. Quiet forests. A different perspective.</p><span className={s.choiceLink}>Explore trekking adventures <span aria-hidden>↗</span></span></div>
      </Link>
      <Link href="/tours" className={s.choice}>
        <Image src="/images/island-shore.jpg" alt="Palm trees beside a turquoise Indian island shore" fill sizes="(max-width: 700px) 100vw, 50vw" className={s.cover} />
        <div className={s.choiceShade} /><div className={s.choiceCopy}><span className={s.lightEyebrow}>For the joy of going somewhere</span><h3>Tours</h3><p>Coastal days. Mountain towns. Time well spent.</p><span className={s.choiceLink}>Explore holidays & tours <span aria-hidden>↗</span></span></div>
      </Link>
    </div>
  </section>
}
