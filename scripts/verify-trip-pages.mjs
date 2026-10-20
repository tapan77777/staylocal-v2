import assert from 'node:assert/strict'

const base = process.argv[2] || 'http://localhost:3000'
const listResponse = await fetch(`${base}/api/trips`)
assert.equal(listResponse.status, 200, 'published trips API')
const trips = await listResponse.json()
assert.ok(trips.length, 'at least one published trip')
const home = await (await fetch(base)).text()

for (const trip of trips) {
  assert.ok(home.includes(`/trip/${trip.slug}`), `${trip.slug}: homepage link`)
  const response = await fetch(`${base}/trip/${trip.slug}`)
  assert.equal(response.status, 200, `${trip.slug}: detail status`)
  const html = await response.text()
  assert.ok(html.includes(trip.title), `${trip.slug}: title`)
  const pricing = JSON.parse(trip.pricing)
  const initialPrice = trip.type === 'calculator' ? pricing[0]?.[0] ?? trip.price : trip.price
  assert.ok(html.includes(initialPrice.toLocaleString('en-IN')), `${trip.slug}: stored calculator price`)
  assert.ok(html.includes(trip.image.replaceAll('&', '&amp;')), `${trip.slug}: hero image`)
  assert.ok(html.includes('https://wa.me/919178628894'), `${trip.slug}: WhatsApp enquiry`)
  // The initial render shows the first duration's itinerary.
  const itinerary = JSON.parse(trip.itinerary)[0] || []
  for (const day of itinerary) {
    assert.ok(html.includes(day.title.replaceAll('&', '&amp;')), `${trip.slug}: itinerary ${day.day}`)
  }
  const detailResponse = await fetch(`${base}/api/trips/${trip.slug}`)
  assert.equal(detailResponse.status, 200, `${trip.slug}: detail API`)
  const detail = await detailResponse.json()
  for (const key of ['image', 'gallery', 'itinerary', 'pricing', 'price']) {
    assert.deepEqual(detail[key], trip[key], `${trip.slug}: unchanged ${key}`)
  }
  console.log(`PASS ${trip.slug}: page, card link, image, pricing, itinerary, WhatsApp, API`)
}

for (const path of ['/trip/staylocal-nonexistent-trip', '/api/trips/staylocal-nonexistent-trip']) {
  const response = await fetch(`${base}${path}`)
  assert.equal(response.status, 404, `${path}: missing trip`)
  console.log(`PASS ${path}: HTTP 404`)
}
