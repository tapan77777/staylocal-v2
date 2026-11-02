import Link from 'next/link'
import s from './TrekBuilder.module.css'
export default function CreatePackageChoice({ enabled }: { enabled: boolean }) {
  return <div className={s.builder}><header className={s.header}><p className={s.eyebrow}>StayLocal · Package studio</p><h1>What kind of journey<br />are we creating?</h1><p>A shared home for your packages. The right tools for each kind of travel.</p></header><div className={s.choices}>
    <Link href="/admin/trips/new?kind=trek"><span className={s.choiceIcon} aria-hidden>↗</span><p className={s.eyebrow}>Trail documentation & departures</p><h2>Create Trek</h2><p>Build the route, describe each day, document preparation and manage operator-confirmed dates.</p><strong>Open Trek Builder →</strong></Link>
    <Link href="/admin/trips/new?kind=tour"><span className={s.choiceIcon} aria-hidden>☀</span><p className={s.eyebrow}>Holidays, stays & experiences</p><h2>Create Tour</h2><p>Your existing Tour Builder, package options and commercial pricing tools, preserved.</p><strong>Open Tour Builder →</strong></Link>
  </div>{!enabled && <p className={s.notice}>Trek saving requires the reviewed storage upgrade and feature activation. Existing Tour Builder remains available; legacy records stay unclassified until reviewed.</p>}<Link href="/admin/trips" className={s.back}>← All packages</Link></div>
}
