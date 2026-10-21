'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import PackagesEditor from './PackagesEditor'
import UniversalEditor, { emptyUniversal } from './builder/UniversalEditor'
import UniversalTrip from '@/components/trip/UniversalTrip'
import { eligibleOffers, quoteOffer, universalSchema, startingPrice } from '@/lib/universal-trip'
import PhotoEditor from './builder/PhotoEditor'
import { ListEditor, OrderControls, parseArray } from './builder/BuilderControls'
import { builderSteps, builderPayload, builderIssues, durationSummary, initialBuilder, moveItem, slugify, type TripBuilderForm, type TripBuilderRecord } from '@/lib/trip-builder'
import styles from './builder/TripBuilder.module.css'

const tips = [
  ['A good beginning', 'Give travellers a clear idea of where they’re going and what makes this trip special.', 'Keep the title short and memorable.', 'Use a duration that matches your packages.'],
  ['Let the place speak', 'Choose real, inviting photos that help travellers picture themselves there.', 'Landscape photos work best.', 'The first image becomes the trip cover.'],
  ['Make every day count', 'Offer a few clear duration options, each with its own thoughtful plan.', 'Keep unfinished packages as drafts.', 'A ready package needs a plan for every day.'],
  ['The little details matter', 'Help travellers understand exactly what to expect before they enquire.', 'Be specific about what is included.', 'Answer the questions you hear most often.'],
  ['One last look', 'Check the details as a traveller would. Publish only when you are happy with every part.', 'Draft packages remain private.', 'Saving a draft does not publish the trip.'],
]

export default function TripForm({ trip }: { trip?: TripBuilderRecord }) {
  const router = useRouter()
  const [state, setState] = useState(() => initialBuilder(trip))
  const [step, setStep] = useState(0)
  const [universalAvailable, setUniversalAvailable] = useState(false)
  useEffect(() => {
    if (trip?.type === 'andaman') return
    const controller = new AbortController()
    void fetch(`/api/admin/trips/${trip?.id ?? 'new'}/universal`, { signal: controller.signal }).then(async r => { if (!r.ok) return; return r.json() }).then(data => {
      if (!data?.available || controller.signal.aborted) return
      setUniversalAvailable(true)
      if (data.config) setState(s => ({ ...s, universal: { config: data.config, enabled: data.enabled, expectedUpdatedAt: data.expectedUpdatedAt } }))
      else if (!trip) setState(s => ({ ...s, universal: { config: emptyUniversal(), enabled: false, expectedUpdatedAt: null } }))
    }).catch(() => { /* Legacy editing stays available; server validates any active config. */ })
    return () => controller.abort()
  }, [trip?.id, trip?.type])
  const [dirty, setDirty] = useState(false)
  const dirtyRef = useRef(false)
  const [loading, setLoading] = useState(false)
  const [photoBusy, setPhotoBusy] = useState(false)
  const [error, setError] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [slugManual, setSlugManual] = useState(!!trip)
  const [durationManual, setDurationManual] = useState(!!trip)
  const [priceManual, setPriceManual] = useState(!!trip)
  const [slugStatus, setSlugStatus] = useState('')
  const heading = useRef<HTMLHeadingElement>(null)
  const form = state.form
  const andaman = form.type === 'andaman'
  const legacy = !!trip && (andaman || trip.pricing !== '[]')
  const errors = builderIssues(state, 'published', trip)
  const publishedPackages = state.packages.filter(p => p.status === 'published')
  const warnings: string[] = []
  const universalPrice = state.universal?.enabled ? (() => { try { return startingPrice(state.universal.config, state.packages) } catch { return null } })() : undefined
  if (universalPrice !== undefined) warnings.push(`When activated, the public card uses ${universalPrice === null ? 'price on request' : `₹${universalPrice.toLocaleString('en-IN')}`} from eligible published offers. The saved legacy fallback price ₹${form.price.toLocaleString('en-IN')} is preserved.`)
  if (!state.packages.length && !andaman) warnings.push(legacy ? 'This trip is using its existing legacy calculator. No duration packages have been added.' : 'No packages yet. You can save a draft, but publishing needs a ready package.')
  if (legacy && publishedPackages.length && !andaman) warnings.push('Publishing a ready package switches the public page from its legacy calculator to the package picker. Legacy values will be preserved.')
  const lowestPrice = Math.min(...publishedPackages.filter(p => !p.priceOnRequest).map(p => p.priceAdult))
  if (universalPrice === undefined && Number.isFinite(lowestPrice) && lowestPrice !== form.price) warnings.push(`The trip card shows ₹${form.price.toLocaleString('en-IN')}, while the lowest ready package is ₹${lowestPrice.toLocaleString('en-IN')}. Check that both prices are intentional.`)
  if (state.packages.length && state.packages.every(p => p.priceOnRequest)) warnings.push('Packages are price-on-request. The current public trip card still needs a numeric starting price; that card behaviour is unchanged.')
  const legacyPricing = !andaman ? parseArray<number[]>(form.pricing) : []
  if (legacy && !publishedPackages.length && legacyPricing[0]?.[0] && legacyPricing[0][0] !== form.price) warnings.push('The trip card starting price differs from the first legacy calculator price. Existing prices are preserved; verify both before publishing.')
  if (legacy && !form.duration) warnings.push('This existing trip has no duration summary. Add one in Basics if you have approved details.')

  const changed = () => { setState(s => s.universal?.migrationConfirmed ? { ...s, universal: { ...s.universal, migrationConfirmed: false } } : s); setDirty(true); dirtyRef.current = true; setConfirmed(false); setError('') }
  const patch = (values: Partial<TripBuilderForm>) => { changed(); setState(s => ({ ...s, form: { ...s.form, ...values } })) }
  const set = <K extends keyof TripBuilderForm>(key: K, value: TripBuilderForm[K]) => patch({ [key]: value })
  const go = (next: number) => { if (!photoBusy) { setError(''); setStep(next) } }

  useEffect(() => { heading.current?.focus({ preventScroll: true }) }, [step])
  useEffect(() => {
    const unload = (event: BeforeUnloadEvent) => { if (dirtyRef.current) { event.preventDefault(); event.returnValue = '' } }
    const link = (event: MouseEvent) => {
      const anchor = event.target instanceof Element ? event.target.closest('a') : null
      if (!dirtyRef.current || !anchor || anchor.target === '_blank' || event.ctrlKey || event.metaKey || event.shiftKey || event.defaultPrevented) return
      if (new URL(anchor.href, window.location.href).href === window.location.href) return
      if (!window.confirm('Leave the Trip Builder? Your unsaved changes will be lost.')) event.preventDefault()
    }
    window.addEventListener('beforeunload', unload); document.addEventListener('click', link, true)
    return () => { window.removeEventListener('beforeunload', unload); document.removeEventListener('click', link, true) }
  }, [])
  useEffect(() => {
    if (trip || !form.slug) return
    const controller = new AbortController()
    setSlugStatus('Checking availability…')
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/admin/trips/check-slug?slug=${encodeURIComponent(form.slug)}`, { signal: controller.signal })
        const data = await response.json()
        if (!controller.signal.aborted && !slugManual && data.suggestion) {
          setState(s => ({ ...s, form: { ...s.form, slug: data.suggestion } }))
          return
        }
        if (!controller.signal.aborted) setSlugStatus(!response.ok ? (data.error || 'Could not check availability. It will be checked when saving.') : data.available ? 'This URL is available.' : 'This URL is already in use. Choose another slug.')
      } catch { if (!controller.signal.aborted) setSlugStatus('Availability will be checked when saving.') }
    }, 350)
    return () => { controller.abort(); clearTimeout(timer) }
  }, [form.slug, trip, slugManual])

  const save = async (status: 'draft' | 'published') => {
    if (photoBusy) return
    const problems = builderIssues(state, status, trip)
    if (problems.length) { setError(problems.join(' ')); setStep(4); return }
    if (status === 'published' && !confirmed) { setError('Confirm the review checklist before publishing.'); return }
    if (status === 'draft' && trip?.status === 'published' && !window.confirm('Save as draft and unpublish this trip? Its public detail page will become unavailable until you publish again.')) return
    setLoading(true); setError('')
    try {
      const response = await fetch(trip ? `/api/admin/trips/${trip.id}` : '/api/admin/trips', {
        method: trip ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(builderPayload(state, status, trip, status === 'published' && confirmed)),
      })
      if (!response.ok) { const data = await response.json().catch(() => ({})); setError(data.error || 'Could not save. Your changes are still here. Please retry.'); return }
      dirtyRef.current = false; setDirty(false); router.push('/admin/trips'); router.refresh()
    } catch { setError('Network error. Your changes are still here. Please retry.') }
    finally { setLoading(false) }
  }

  return <div className={styles.builder}>
    <div className={styles.top}>
      <div><p className={styles.eyebrow}>StayLocal · Trip Builder</p><h1>{trip ? 'Shape your next great trip.' : 'A great journey starts here.'}</h1><p className={styles.muted}>{trip ? `Editing ${trip.title}` : 'Turn your local knowledge into a trip travellers will love.'}</p></div>
      <Link className={styles.backLink} href="/admin/trips">← All trips</Link>
    </div>
    <nav className={styles.steps} aria-label="Trip builder steps">{builderSteps.map((label, index) => <button type="button" key={label} aria-current={step === index ? 'step' : undefined} onClick={() => go(index)} disabled={loading || photoBusy}><span className={styles.stepNumber}>{index < step ? '✓' : index + 1}</span>{label}</button>)}</nav>
    <div className={styles.workspace}><div className={styles.main}>
      <section className={styles.section} aria-labelledby="builder-heading"><fieldset disabled={loading || photoBusy} className={styles.formLock}>
        <p className={styles.eyebrow}>Step {step + 1} of 5</p>
        <h2 id="builder-heading" tabIndex={-1} ref={heading}>{['Tell us about the trip', 'Bring your trip to life', 'Build the journey, day by day', 'Set the right expectations', 'Ready for its first traveller?'][step]}</h2>
        <p className={styles.intro}>{['Start with the essentials. You can come back and refine every detail.', 'Add a cover and a few favourite views. Every photo should tell a little of the story.', 'Give each duration its own price, stay and itinerary. Keep work in progress as a draft.', 'Clear, thoughtful details build trust and make enquiries easier to answer.', 'Preview your content, check the details and choose when this trip goes live.'][step]}</p>
        {step === 0 && <div className={styles.grid}>
          <label className={`${styles.field} ${styles.wide}`}>Trip title <span className={styles.srOnly}>(required)</span><input aria-required="true" value={form.title} maxLength={200} placeholder="e.g. A quieter side of the mountains" onChange={e => patch({ title: e.target.value, ...(!slugManual ? { slug: slugify(e.target.value) } : {}) })} /></label>
          <label className={`${styles.field} ${styles.wide}`}>Trip URL<input aria-label="Trip URL" aria-required="true" value={form.slug} maxLength={80} readOnly={!!trip} onChange={e => { setSlugManual(true); set('slug', e.target.value) }} placeholder="your-trip-name" /><small>{trip ? `Existing URL protected: /trip/${trip.slug}` : `/trip/${form.slug || 'your-trip-name'} · ${slugStatus || 'Generated from the title; you can edit it.'}`}</small></label>
          <label className={styles.field}>Destination<input aria-required="true" value={form.location} placeholder="e.g. Jibhi, Himachal Pradesh" onChange={e => set('location', e.target.value)} /></label>
          <label className={styles.field}>Category<select value={form.category} onChange={e => set('category', e.target.value)}>{[...new Set(['Mountains', 'Islands', 'Wildlife', 'Trek', 'Beach', 'Hills', 'Other', form.category])].map(category => <option key={category}>{category}</option>)}</select></label>
          <label className={`${styles.field} ${styles.wide}`}>A short introduction<textarea value={form.subtitle} placeholder="What makes this journey worth taking?" onChange={e => set('subtitle', e.target.value)} /></label>
          <label className={styles.field}>Difficulty<select value={form.difficulty} onChange={e => set('difficulty', e.target.value)}>{[...new Set(['Easy', 'Moderate', 'Hard', form.difficulty])].map(d => <option key={d}>{d}</option>)}</select></label>
          <label className={styles.field}>Duration summary<input value={form.duration} maxLength={120} placeholder="e.g. 3–5 days" onChange={e => { setDurationManual(true); set('duration', e.target.value) }} /><small>Shown on the trip card. {state.packages.length > 0 && <button type="button" className={styles.textButton} onClick={() => { setDurationManual(true); set('duration', durationSummary(state.packages)) }}>Use package durations</button>}</small></label>
        </div>}
        {step === 1 && <PhotoEditor cover={form.image} gallery={form.gallery} onChange={patch} onBusyChange={setPhotoBusy} />}
        {step === 2 && universalAvailable && !andaman && <div className={styles.notice}><label className={styles.ready}><input type="checkbox" checked={!!state.universal} onChange={e => { changed(); setState(s => ({ ...s, universal: e.target.checked ? { config: emptyUniversal(), enabled: false, expectedUpdatedAt: null } : undefined })) }} disabled={!!state.universal?.expectedUpdatedAt} />Manage a universal trip experience</label>{state.universal && <><UniversalEditor config={state.universal.config} packages={state.packages} onChange={config => { changed(); setState(s => ({ ...s, universal: { ...s.universal!, config } })) }} /><label className={styles.ready}><input type="checkbox" checked={state.universal.enabled} onChange={e => { changed(); setState(s => ({ ...s, universal: { ...s.universal!, enabled: e.target.checked } })) }} />Activate universal public layout · administrator only</label><p>Activation is per trip. Keep migration candidates off until content and pricing parity are reviewed.</p>{legacy && <label className={styles.ready}><input type="checkbox" checked={!!state.universal.migrationConfirmed} onChange={e => { changed(); setState(s => ({ ...s, universal: { ...s.universal!, migrationConfirmed: e.target.checked } })) }} />I have resolved and approved this legacy trip’s duration, content and pricing mapping.</label>}</>}</div>}
        {step === 2 && (andaman ? <div className={styles.notice}><strong>Andaman uses a dedicated trip experience.</strong><p>Its duration pricing and day-wise itinerary are managed by the existing special page. Package changes here would not appear there, so they are protected. You can update its basics, photos and general details. A unified package migration needs separate approval.</p></div> : <PackagesEditor packages={state.packages} onChange={packages => {
          const prices = packages.filter(p => !p.priceOnRequest && p.priceAdult > 0).map(p => p.priceAdult)
          const suggestedPrice = prices.length ? Math.min(...prices) : 0
          changed(); setState(s => ({ ...s, packages: packages.map((p, i) => ({ ...p, sortOrder: i })), form: { ...s.form,
            ...(!priceManual ? { price: suggestedPrice } : {}),
            ...(!durationManual ? { duration: durationSummary(packages) } : {}),
          } }))
        }} />)}
        {step === 2 && legacy && !andaman && <div className={styles.notice}>This existing trip keeps its legacy pricing until you publish a ready package. Adding a draft package alone does not change the public calculator.</div>}
        {step === 3 && <>
          <label className={styles.field}>Route<input value={form.route} onChange={e => set('route', e.target.value)} placeholder="e.g. Arrival town → destination → departure town" /></label>
          {(['highlights', 'included', 'notIncluded'] as const).map((key, index) => <ListEditor key={key} label={['Trip highlights', 'What’s included', 'What’s not included'][index]} items={parseArray<string>(form[key])} onChange={items => set(key, JSON.stringify(items))} placeholder={['A moment travellers will remember', 'An inclusion travellers can count on', 'A cost travellers should plan for'][index]} />)}
          <section className={styles.listEditor}><div className={styles.sectionHeading}><h3>Frequently asked questions</h3><button type="button" className={styles.textButton} onClick={() => set('faqs', JSON.stringify([...parseArray<{ q: string; a: string }>(form.faqs), { q: '', a: '' }]))}>+ Add question</button></div>
            {parseArray<{ q: string; a: string }>(form.faqs).map((faq, i, all) => <div className={styles.faq} key={i}>
              <div className={styles.sectionHeading}><strong className={styles.muted}>Question {i + 1}</strong><OrderControls index={i} length={all.length} label={`question ${i + 1}`} move={direction => set('faqs', JSON.stringify(moveItem(all, i, direction)))} remove={() => set('faqs', JSON.stringify(all.filter((_, index) => index !== i)))} /></div>
              <input aria-label={`FAQ ${i + 1} question`} placeholder="What would a traveller ask?" value={faq.q} onChange={e => set('faqs', JSON.stringify(all.map((item, index) => index === i ? { ...item, q: e.target.value } : item)))} />
              <textarea aria-label={`FAQ ${i + 1} answer`} placeholder="Give a clear, helpful answer…" value={faq.a} onChange={e => set('faqs', JSON.stringify(all.map((item, index) => index === i ? { ...item, a: e.target.value } : item)))} />
            </div>)}
          </section>
        </>}
        {step === 4 && <>
          {state.universal && <UniversalPreview state={state} />}
          <div className={styles.reviewChecks}><span>{form.image ? '✓ Cover added' : '○ Cover needed'}</span><span>{publishedPackages.length} ready packages</span><span>{state.packages.length - publishedPackages.length} draft packages</span></div>
          <div className={styles.preview} aria-label="Customer-facing trip preview">
            {form.image ? <img className={styles.previewImage} src={form.image} alt={`${form.title || 'Trip'} cover`} /> : <div className={styles.emptyCover}>Your cover photo will appear here</div>}
            <div className={styles.previewBody}><span className={styles.badge}>{form.category}</span><p>{form.location} {form.duration ? `· ${form.duration}` : ''}</p><h3>{form.title || 'Your trip title'}</h3><p>{form.subtitle}</p><div className={styles.previewPrice}>{universalPrice === null ? 'Price on request' : `₹${(universalPrice ?? form.price).toLocaleString('en-IN')}`} <small className={styles.muted}>starting price / person</small></div>
              {parseArray<string>(form.highlights).length > 0 && <ul>{parseArray<string>(form.highlights).map((highlight, i) => <li key={i}>{highlight}</li>)}</ul>}
              {!andaman && publishedPackages.map(p => <div className={styles.previewPackage} key={p.id ?? p.slug}><h4>{p.label} · {p.days}D/{p.nights}N</h4><p>{p.priceOnRequest ? 'Price on request' : `From ₹${p.priceAdult.toLocaleString('en-IN')} ${p.priceBasis}`}</p><p>{p.accommodation}</p><ol>{parseArray<{ title: string; desc: string }>(p.itinerary).map((day, i) => <li key={i}><strong>{day.title}</strong> — {day.desc}</li>)}</ol></div>)}
              {form.route && <p><strong>Route:</strong> {form.route}</p>}
              {(['included', 'notIncluded'] as const).map(key => parseArray<string>(form[key]).length > 0 && <div className={styles.previewPackage} key={key}><h4>{key === 'included' ? 'What’s included' : 'What’s not included'}</h4><ul>{parseArray<string>(form[key]).map((item, i) => <li key={i}>{item}</li>)}</ul></div>)}
              {parseArray<{ q: string; a: string }>(form.faqs).map((faq, i) => <div className={styles.previewPackage} key={i}><h4>{faq.q}</h4><p>{faq.a}</p></div>)}
              <span className={styles.primary} aria-disabled="true">Enquire about this trip ↗</span><p className={styles.muted}>Content preview only. Your existing public page layout and enquiry flow remain unchanged. {andaman ? 'Andaman keeps its dedicated calculator and itinerary.' : legacy && !publishedPackages.length ? 'This trip keeps its legacy calculator.' : ''}</p>
            </div>
          </div>
          <label className={styles.field} style={{ marginTop: 24 }}>{state.universal?.enabled ? 'Preserved fallback starting price (₹)' : 'Trip card starting price (₹)'}<input type="number" min="0" step="1" value={form.price} onChange={e => { setPriceManual(true); set('price', Number(e.target.value)) }} /><small>{state.universal?.enabled ? 'Universal public prices are calculated from published offers. This saved value is kept for legacy fallback.' : 'This is separate from each package price. Existing trip prices are never recalculated automatically.'}</small></label>
          {warnings.length > 0 && <div className={styles.notice}><strong>A few things to check</strong><ul>{warnings.map(warning => <li key={warning}>{warning}</li>)}</ul></div>}
          {errors.length > 0 ? <div className={styles.error}><strong>Before you publish</strong><ul>{errors.map(problem => <li key={problem}>{problem}</li>)}</ul><p>You can still save a valid draft and finish later.</p></div> : <div className={styles.success}>✓ Your trip passes the publishing checks.</div>}
          <label className={styles.publishCheck}><input type="checkbox" checked={confirmed} disabled={errors.length > 0} onChange={e => setConfirmed(e.target.checked)} /><span>I’ve reviewed the photos, prices, ready packages and itinerary, and I’m ready to make this trip public.</span></label>
        </>}
        {trip && <details className={styles.advanced}><summary>Advanced / Legacy · preserved data</summary><p>These saved calculator fields are kept exactly in the builder and are not converted by visual editing. Pricing or rendering changes need a separate reviewed update.{andaman ? ' Andaman’s hardcoded itinerary cannot be changed here.' : ''}</p>{(['pricing', 'itinerary', 'tierDetails', 'durLabels', 'durSubLabels'] as const).map(key => <div key={key}><strong>{key}</strong><pre>{form[key]}</pre></div>)}</details>}
        {error && <div role="alert" className={styles.error}>{error}</div>}
      </fieldset></section>
    </div><aside className={styles.side} aria-label="Builder guidance">
      <div className={styles.sideCard}>{form.image && <img className={styles.sideCover} src={form.image} alt="" />}<span className={styles.eyebrow}>Thoughtfully put together</span><h3>{tips[step][0]}</h3><p>{tips[step][1]}</p><ul><li>{tips[step][2]}</li><li>{tips[step][3]}</li></ul></div>
      <div className={styles.sideCard}><span className={styles.badge}>{trip?.status === 'published' ? 'Currently published' : 'Work in progress'}</span><div className={styles.sideSummary}><div><span>Destination</span><strong>{form.location || 'Not added'}</strong></div><div><span>Packages</span><strong>{state.packages.length}</strong></div><div><span>Photos</span><strong>{new Set([form.image, ...parseArray<string>(form.gallery)].filter(Boolean)).size}</strong></div></div><p>Nothing goes live until you review and publish.</p></div>
    </aside></div>
    <footer className={styles.footer}>
      <div className={styles.actions}>{step > 0 && <button type="button" className={styles.secondary} disabled={loading || photoBusy} onClick={() => go(step - 1)}>← Back</button>}<span className={styles.muted} role="status">{dirty ? 'Unsaved changes' : trip ? 'Saved trip loaded' : 'Not saved yet'}</span></div>
      <div className={styles.actions}><button type="button" className={styles.secondary} disabled={loading || photoBusy} onClick={() => void save('draft')}>{loading ? 'Saving…' : trip?.status === 'published' ? 'Save as draft / unpublish' : 'Save draft'}</button>{step < 4 ? <button type="button" className={styles.primary} disabled={loading || photoBusy} onClick={() => go(step + 1)}>Continue →</button> : <button type="button" className={styles.primary} disabled={loading || photoBusy || !confirmed || errors.length > 0} onClick={() => void save('published')}>{loading ? 'Saving…' : trip?.status === 'published' ? 'Publish changes ↗' : 'Publish trip ↗'}</button>}</div>
    </footer>
  </div>
}

function UniversalPreview({ state }: { state: ReturnType<typeof initialBuilder> }) {
  const parsed = universalSchema.safeParse(state.universal?.config)
  if (!parsed.success) return <p role="status">Complete the universal fields to preview this layout.</p>
  const config = parsed.data
  try {
    const initialQuotes = Object.fromEntries(eligibleOffers(config, state.packages).map(({ pkg }) => [pkg.slug, quoteOffer(config, state.packages, pkg.slug, Math.min(2, config.maxPeople))]))
    return <details><summary>Full universal customer preview</summary><UniversalTrip trip={{ ...state.form, packages: state.packages }} config={config} initialQuotes={initialQuotes} preview /></details>
  } catch { return <p>Fix offer pricing before previewing.</p> }
}
