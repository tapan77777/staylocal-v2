import { PrismaClient, Prisma } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

function dbHostFromUrl(url: string | undefined): string {
  if (!url) return '<unset>'
  try { return new URL(url).host } catch { return '<unparseable>' }
}

async function main() {
  const url = process.env.DATABASE_URL
  const host = dbHostFromUrl(url)
  // Hard stop on prod DB unless the operator opts in. The deploy host of record is
  // `ep-red-frog-aq1q61wu-pooler.c-8.us-east-1.aws.neon.tech` — if that is the target,
  // require `CONFIRM_SEED=yes` so no one runs this seed against production by accident.
  const prodHostMarker = 'ep-red-frog-aq1q61wu'
  if (host.includes(prodHostMarker) && process.env.CONFIRM_SEED !== 'yes') {
    console.error(
      `\nREFUSING TO SEED PRODUCTION.\n` +
      `DATABASE_URL host: ${host}\n` +
      `Re-run with CONFIRM_SEED=yes to proceed, or point DATABASE_URL at a staging branch.\n`
    )
    process.exit(2)
  }
  console.log(`[seed] target DB host: ${host}`)

  const password = await bcrypt.hash('staylocal@2026', 10)
  await prisma.user.upsert({
    where: { email: 'admin@staylocal.com' },
    update: {},
    create: { name: 'Tapan', email: 'admin@staylocal.com', password, role: 'admin' }
  })

  const jibhiDurSubLabels = JSON.stringify(['Jibhi + Jalori', '+ Shoja + Trek', '+ Manali day'])

  await prisma.trip.upsert({
    where: { slug: 'jibhi' },
    update: { durSubLabels: jibhiDurSubLabels },
    create: {
      slug: 'jibhi',
      title: 'Jibhi Valley Escape',
      subtitle: 'Pine forests, mountain silence, and a rhythm you forgot exists.',
      location: 'Himachal Pradesh',
      category: 'Mountains',
      duration: '9D · 8N',
      difficulty: 'Easy',
      price: 15000,
      status: 'published',
      route: 'Delhi → Aut → Jibhi → Rishikesh',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
      gallery: JSON.stringify([
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80',
        'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=800&q=80'
      ]),
      type: 'calculator',
      highlights: JSON.stringify(['Jalori Pass at 3120m','Serolsar Lake trek','Shoja village','Chhoie waterfall','Bonfire nights']),
      included: JSON.stringify(['Accommodation','All local transfers','Breakfast daily','Local guide','Bonfire']),
      notIncluded: JSON.stringify(['Delhi to Aut transport','Personal expenses','Meals beyond breakfast']),
      faqs: JSON.stringify([
        {q:'What fitness level is required?',a:'Easy — suitable for all ages and fitness levels.'},
        {q:'Is transport from Delhi included?',a:'No — transport from Delhi to Aut is not included. We can help you book a Volvo bus.'},
        {q:'What is the cancellation policy?',a:'₹3,000 advance to confirm. Refundable if cancelled 10+ days before.'}
      ]),
      pricing: JSON.stringify([[7500,11899,18790],[9499,14999,23490],[11999,18499,28990]]),
      durLabels: JSON.stringify(['3D/2N','4D/3N','5D/4N']),
      durSubLabels: jibhiDurSubLabels,
      tierDetails: JSON.stringify([
        {name:'Standard',vehicle:'Alto · Homestay sharing',meals:'Breakfast',feats:['Homestay sharing','Alto cab','Breakfast','Bonfire']},
        {name:'Deluxe',vehicle:'Ertiga · Wooden cottage',meals:'Breakfast',feats:['Wooden cottage','Ertiga cab','Breakfast','Bonfire','Forest walk']},
        {name:'Premium',vehicle:'Jimny · Private riverside',meals:'All meals',feats:['Private riverside cottage','Jimny','All meals','Bonfire','Serolsar guided trek']}
      ]),
      itinerary: JSON.stringify([
        [{day:'Day 1',title:'Aut → Jibhi · Arrive',desc:'Pickup from Aut, check in, Jibhi waterfall walk, bonfire evening'},{day:'Day 2',title:'Jalori Pass · Serolsar Lake',desc:'Drive to Jalori Pass, trek to Serolsar Lake through alpine forest'},{day:'Day 3',title:'Shoja · Aut drop',desc:'Shoja village, Chhoie waterfall, drop to Aut'}],
        [{day:'Day 1',title:'Aut → Jibhi',desc:'Pickup, check in, Jibhi waterfall, bonfire'},{day:'Day 2',title:'Jalori Pass · Serolsar',desc:'Full day — Jalori Pass, Serolsar Lake trek'},{day:'Day 3',title:'Shoja · Raghupur Fort',desc:'Raghupur Fort trek, Tirthan evening'},{day:'Day 4',title:'Chhoie Waterfall · Aut',desc:'Waterfall trek, drop to Aut'}],
        [{day:'Day 1',title:'Aut → Jibhi',desc:'Pickup, check in, waterfall, bonfire'},{day:'Day 2',title:'Jalori Pass · Serolsar',desc:'Jalori Pass, Serolsar Lake trek'},{day:'Day 3',title:'Raghupur Fort · Shoja',desc:'Raghupur Fort, Tirthan valley'},{day:'Day 4',title:'Manali day trip',desc:'Old Manali, Hadimba temple, cafes'},{day:'Day 5',title:'Chhoie Waterfall · Aut',desc:'Waterfall trek, drop to Aut'}]
      ])
    }
  })

  await prisma.trip.upsert({
    where: { slug: 'andaman' },
    update: {},
    create: {
      slug: 'andaman',
      title: 'Andaman Islands',
      subtitle: 'Turquoise water, private beaches, limestone caves — places most tourists never find.',
      location: 'Port Blair · Havelock · Neil Island',
      category: 'Islands',
      duration: '4N · 5D',
      difficulty: 'Easy',
      price: 18999,
      status: 'published',
      route: 'Port Blair → Havelock → Neil Island',
      type: 'andaman',
      image: 'https://images.unsplash.com/photo-1586500036706-41963de24d8b?w=800&q=80',
      gallery: JSON.stringify([
        'https://images.unsplash.com/photo-1586500036706-41963de24d8b?w=800&q=80',
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80',
        'https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=800&q=80',
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80'
      ]),
      highlights: JSON.stringify([
        'Radhanagar Beach — one of Asia finest beaches',
        'Elephant Beach snorkeling included',
        'Neil Island — most tourists skip this',
        'Private AC cruise ferries throughout',
        'Cellular Jail Light and Sound show',
        'Baratang limestone caves — offbeat'
      ]),
      included: JSON.stringify([
        'Airport pickup and drop',
        'Private AC vehicle throughout',
        'All ferry tickets — private cruise ferries',
        'Breakfast daily',
        'All entry tickets and permits',
        'Ground team support throughout'
      ]),
      notIncluded: JSON.stringify([
        'Flight to Port Blair',
        'Scuba diving — available as add-on ₹3,500',
        'Personal expenses',
        'Meals beyond breakfast'
      ]),
      faqs: JSON.stringify([
        {q:'Is flight included?', a:'No — flights to Port Blair are not included. We help you find best flights.'},
        {q:'What ferry is used?', a:'Private AC cruise ferries — Makruzz, Nautika, or Green Ocean. Not government ferries.'},
        {q:'Best time to visit?', a:'October to May is ideal. June to September is monsoon season.'},
        {q:'Is snorkeling included?', a:'Yes — complimentary snorkeling at Elephant Beach included in all tiers.'},
        {q:'Can I customise the itinerary?', a:'Yes — WhatsApp us and we will create a custom package for your group.'},
        {q:'How do promo codes work?', a:'Enter your promo code in the calculator to get ₹2,000 off instantly. Valid codes are shared personally by our team.'}
      ]),
      pricing: JSON.stringify({
        durations: [
          {label:'3N/4D', sub:'Port Blair + Havelock', image:'https://images.unsplash.com/photo-1586500036706-41963de24d8b?w=300&q=80'},
          {label:'4N/5D', sub:'+ Neil Island', image:'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=300&q=80'},
          {label:'5N/6D', sub:'+ Chidiyatapu', image:'https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=300&q=80'},
          {label:'6N/7D', sub:'+ Baratang caves', image:'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=300&q=80'},
          {label:'7N/8D', sub:'+ North Andaman', image:'https://images.unsplash.com/photo-1586500036706-41963de24d8b?w=300&q=80'}
        ],
        tiers: [
          {
            name:'Explorer',
            subtitle:'Budget hotels · Comfortable stay',
            bufferPrice:[24999,29999,34999,39999,44999],
            price:[18999,22999,26999,30999,34999],
            promoPrice:[16999,20999,24999,28999,32999],
            discount:[24,23,23,22,22],
            popular: false,
            hotels:{portblair:'Hotel Vedant / Hotel Kings',havelock:'Hotel Heaven Garden / Radhakrishna Hotel',neil:'Neil Banjara / Neha Palace'},
            ferry:'Private AC cruise ferry',
            meals:'Breakfast included',
            features:['Budget guesthouse','Private cruise ferry','Breakfast daily','All sightseeing','Snorkeling at Elephant Beach','Airport transfers']
          },
          {
            name:'Comfort',
            subtitle:'3-star hotels · Sea view rooms',
            bufferPrice:[29999,35999,41999,47999,53999],
            price:[19999,23999,27999,31999,35999],
            promoPrice:[17999,21999,25999,29999,33999],
            discount:[33,33,33,33,33],
            popular: true,
            hotels:{portblair:'King Safire / Hotel Blue Marlin',havelock:'Golden Pebble / Radhakrishna Resort',neil:'Deep Sea Resort / Save Green Resort'},
            ferry:'Private AC cruise ferry',
            meals:'Breakfast included',
            features:['3-star hotel','Sea view rooms','Private cruise ferry','Breakfast daily','All sightseeing','Snorkeling + glass boat','Complimentary photoshoot']
          },
          {
            name:'Premium',
            subtitle:'Beach resorts · Premium rooms',
            bufferPrice:[35999,41999,47999,53999,59999],
            price:[23999,27999,31999,35999,39999],
            promoPrice:[21999,25999,29999,33999,37999],
            discount:[33,33,33,33,33],
            popular: false,
            hotels:{portblair:'Hotel Darwin City / Hotel SR Castle',havelock:'Arina Island Resort / Shangrilas Beach Resort',neil:'Reef Valley Resort / Silver Pearl Beach Resort'},
            ferry:'Private AC cruise ferry',
            meals:'Breakfast + dinner',
            features:['Beach resort','Premium sea view rooms','Private cruise ferry','Breakfast + dinner','All sightseeing','Snorkeling + glass boat','Photoshoot','Star gazing Neil Island']
          },
          {
            name:'Deluxe',
            subtitle:'Boutique resorts · Sea facing cottages',
            bufferPrice:[42999,49999,56999,63999,70999],
            price:[28999,33999,38999,43999,48999],
            promoPrice:[26999,31999,36999,41999,46999],
            discount:[33,32,32,31,31],
            popular: false,
            hotels:{portblair:'Hotel Bell Elite / Bayleaf Inn',havelock:'White Coral Beach Resort / TSG Blue Resort',neil:'TSG Aura / Pearl Park Beach Resort'},
            ferry:'Private AC cruise ferry',
            meals:'Breakfast + dinner',
            features:['Boutique beach resort','Sea facing cottage','Private cruise ferry','Breakfast + dinner','All sightseeing','Snorkeling + glass boat','Photoshoot','Sunset cruise']
          },
          {
            name:'Luxury',
            subtitle:'Premium resorts · Beachfront villas',
            bufferPrice:[51999,59999,67999,75999,83999],
            price:[34999,39999,44999,49999,54999],
            promoPrice:[32999,37999,42999,47999,52999],
            discount:[33,33,34,34,34],
            popular: false,
            hotels:{portblair:'Hotel Sand Heaven / Mansha Regency',havelock:'Symphony Palms Beach Resort / Sea Shell Havelock',neil:'Sea Shell Neil / Tango Beach Resort'},
            ferry:'Private AC cruise ferry',
            meals:'All meals included',
            features:['Luxury beachfront resort','Premium villa','Private cruise ferry','All meals included','All sightseeing','Scuba diving session','Private photoshoot','Sunset cruise','Star gazing']
          }
        ],
        promoCodes:['KINNI2K','MONU2K','TAPAN2K'],
        promoDiscount: 2000
      })
    }
  })

  await prisma.experience.upsert({
    where: { slug: 'jibhi-waterfalls' },
    update: {},
    create: {
      slug: 'jibhi-waterfalls',
      title: 'Jibhi Waterfalls',
      location: 'Jibhi, Himachal Pradesh',
      category: 'Mountains',
      description: 'Hidden waterfall in the pine forest',
      visited: true,
      status: 'published'
    }
  })

  await prisma.experience.upsert({
    where: { slug: 'jibhi' },
    update: {},
    create: {
      slug: 'jibhi',
      title: 'Jibhi Valley',
      location: 'Jibhi, Himachal Pradesh',
      category: 'Mountains',
      description: 'Pine forests and mountain silence',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80',
      visited: true,
      status: 'published'
    }
  })

  await prisma.experience.upsert({
    where: { slug: 'andaman' },
    update: {},
    create: {
      slug: 'andaman',
      title: 'Andaman Islands',
      location: 'Port Blair, Andaman',
      category: 'Islands',
      description: 'Turquoise water and empty beaches',
      image: 'https://images.unsplash.com/photo-1586500036706-41963de24d8b?w=400&q=80',
      visited: true,
      status: 'published'
    }
  })

  await prisma.experience.upsert({
    where: { slug: 'darjeeling' },
    update: {},
    create: {
      slug: 'darjeeling',
      title: 'Darjeeling',
      location: 'Darjeeling, West Bengal',
      category: 'Hills',
      description: 'Tea gardens and Kanchenjunga views',
      image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=400&q=80',
      visited: true,
      status: 'published'
    }
  })

  // -------- Darjeeling Trip (reference for Multi-Package pricing) --------
  // Status is `draft` so the unverified example prices never render publicly.
  // Change to `published` once pricing has been reviewed.
  const darjeeling = await prisma.trip.upsert({
    where: { slug: 'darjeeling' },
    update: {},
    create: {
      slug: 'darjeeling',
      title: 'Darjeeling Hills Retreat',
      subtitle: 'Toy trains, tea gardens, and sunrise over Kanchenjunga.',
      location: 'West Bengal',
      category: 'Hills',
      duration: 'Flexible',
      difficulty: 'Easy',
      price: 12000,
      status: 'draft',
      route: 'NJP → Darjeeling → Tiger Hill → Mirik',
      image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1200&q=80',
      gallery: JSON.stringify([
        'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1200&q=80',
        'https://images.unsplash.com/photo-1518002054494-3a6f94352e9d?w=1200&q=80',
        'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=1200&q=80'
      ]),
      type: 'calculator',
      highlights: JSON.stringify([
        'Sunrise over Kanchenjunga from Tiger Hill',
        'Darjeeling Himalayan toy train ride',
        'Happy Valley tea estate tour',
        'Mirik Lake and Nepal border point'
      ]),
      included: JSON.stringify([
        'Accommodation on twin-sharing',
        'Daily breakfast',
        'All local transfers in private vehicle',
        'Local guide for sightseeing'
      ]),
      notIncluded: JSON.stringify([
        'Travel to and from NJP / Bagdogra',
        'Monument / entry fees unless noted',
        'Meals beyond breakfast',
        'Personal expenses'
      ]),
      faqs: JSON.stringify([
        { q: 'What is the best time to visit?', a: 'October to December and March to May offer the clearest Kanchenjunga views.' },
        { q: 'Is the toy train ride included?', a: 'The joy ride from Darjeeling to Ghum is included in the Deluxe and Premium packages.' },
        { q: 'What is the cancellation policy?', a: '₹3,000 advance to confirm. Refundable if cancelled 10+ days before departure.' }
      ]),
      pricing: JSON.stringify([]),
      durLabels: JSON.stringify([]),
      durSubLabels: JSON.stringify([]),
      itinerary: JSON.stringify([]),
      tierDetails: JSON.stringify([])
    }
  })

  // Create 3 example packages for Darjeeling only on first seed.
  const existingPackages = await prisma.tripPackage.count({ where: { tripId: darjeeling.id } })
  if (existingPackages === 0) {
    const packages = [
      {
        slug: '3d2n-standard',
        label: '3D/2N Standard',
        days: 3,
        nights: 2,
        priceAdult: 11999,
        priceBasis: 'per adult, twin sharing',
        image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&q=80',
        sortOrder: 0,
        accommodation: 'Comfortable 3-star hotel in central Darjeeling, twin-sharing with daily breakfast.',
        inclusions: JSON.stringify([
          'Pickup and drop from NJP / Bagdogra',
          '2 nights hotel on twin-sharing',
          'Daily breakfast',
          'Tiger Hill sunrise with Batasia Loop',
          'Darjeeling town sightseeing'
        ]),
        exclusions: JSON.stringify([
          'Toy train joy ride',
          'Monument entry fees',
          'Any meals beyond breakfast'
        ]),
        notes: 'Example package — prices pending verification before public release.'
      },
      {
        slug: '4d3n-deluxe',
        label: '4D/3N Deluxe',
        days: 4,
        nights: 3,
        priceAdult: 16499,
        priceBasis: 'per adult, twin sharing',
        image: 'https://images.unsplash.com/photo-1518002054494-3a6f94352e9d?w=800&q=80',
        sortOrder: 1,
        accommodation: 'Boutique hotel with Kanchenjunga-facing deluxe room and daily breakfast.',
        inclusions: JSON.stringify([
          'Pickup and drop from NJP / Bagdogra',
          '3 nights deluxe room with Kanchenjunga view',
          'Daily breakfast',
          'Tiger Hill sunrise + Batasia Loop + Ghum monastery',
          'Darjeeling Himalayan toy train joy ride',
          'Happy Valley tea estate guided tour'
        ]),
        exclusions: JSON.stringify([
          'Monument entry fees',
          'Any meals beyond breakfast'
        ]),
        notes: 'Example package — prices pending verification before public release.'
      },
      {
        slug: '5d4n-premium',
        label: '5D/4N Premium',
        days: 5,
        nights: 4,
        priceAdult: 23499,
        priceBasis: 'per adult, twin sharing',
        image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&q=80',
        sortOrder: 2,
        accommodation: 'Premium heritage property in Darjeeling plus 1 night boutique stay in Mirik.',
        inclusions: JSON.stringify([
          'Pickup and drop from NJP / Bagdogra',
          '3 nights premium room in Darjeeling + 1 night in Mirik',
          'Daily breakfast and 2 dinners',
          'Tiger Hill sunrise + Batasia Loop + Ghum monastery',
          'Darjeeling Himalayan toy train joy ride',
          'Happy Valley tea estate guided tour',
          'Mirik Lake boat ride and Nepal border visit'
        ]),
        exclusions: JSON.stringify([
          'Monument entry fees unless specified',
          'Lunches'
        ]),
        notes: 'Example package — prices pending verification before public release.'
      }
    ]

    const itineraries: Record<string, { day: string; title: string; desc: string }[]> = {
      '3d2n-standard': [
        { day: 'Day 1', title: 'NJP → Darjeeling', desc: 'Pickup from NJP / Bagdogra, scenic drive to Darjeeling, check in and leisure evening around Mall Road.' },
        { day: 'Day 2', title: 'Tiger Hill sunrise + town sightseeing', desc: 'Early morning Tiger Hill sunrise with Batasia Loop and Ghum monastery, afternoon town sightseeing.' },
        { day: 'Day 3', title: 'Darjeeling → NJP', desc: 'Breakfast, drop to NJP / Bagdogra station or airport.' }
      ],
      '4d3n-deluxe': [
        { day: 'Day 1', title: 'NJP → Darjeeling', desc: 'Pickup from NJP / Bagdogra, scenic drive to Darjeeling, check in and leisure evening.' },
        { day: 'Day 2', title: 'Tiger Hill sunrise + toy train', desc: 'Tiger Hill sunrise, Batasia Loop, Ghum monastery and Darjeeling Himalayan Railway joy ride.' },
        { day: 'Day 3', title: 'Happy Valley + town sightseeing', desc: 'Happy Valley tea estate tour, Peace Pagoda, Padmaja Naidu Zoo and Himalayan Mountaineering Institute.' },
        { day: 'Day 4', title: 'Darjeeling → NJP', desc: 'Breakfast, drop to NJP / Bagdogra.' }
      ],
      '5d4n-premium': [
        { day: 'Day 1', title: 'NJP → Darjeeling', desc: 'Pickup from NJP / Bagdogra, scenic drive to Darjeeling, check in and dinner.' },
        { day: 'Day 2', title: 'Tiger Hill sunrise + toy train', desc: 'Tiger Hill sunrise, Batasia Loop, Ghum monastery and Darjeeling Himalayan Railway joy ride.' },
        { day: 'Day 3', title: 'Happy Valley + town sightseeing', desc: 'Happy Valley tea estate tour, Peace Pagoda, Padmaja Naidu Zoo and Himalayan Mountaineering Institute.' },
        { day: 'Day 4', title: 'Darjeeling → Mirik', desc: 'Drive to Mirik via Lepchajagat and Simana viewpoint, Mirik Lake boat ride, Nepal border visit, overnight in Mirik.' },
        { day: 'Day 5', title: 'Mirik → NJP', desc: 'Breakfast, drive to NJP / Bagdogra for drop.' }
      ]
    }

    for (const pkg of packages) {
      await prisma.tripPackage.create({
        data: {
          tripId: darjeeling.id,
          slug: pkg.slug,
          label: pkg.label,
          days: pkg.days,
          nights: pkg.nights,
          priceAdult: pkg.priceAdult,
          priceBasis: pkg.priceBasis,
          image: pkg.image,
          sortOrder: pkg.sortOrder,
          status: 'draft',
          accommodation: pkg.accommodation,
          inclusions: pkg.inclusions,
          exclusions: pkg.exclusions,
          notes: pkg.notes,
          itinerary: JSON.stringify(itineraries[pkg.slug])
        }
      })
    }
  }

  // -------- Family catalogue drafts --------
  // All new trips land as `draft` and all packages as `draft` with `priceOnRequest: true`.
  // Nothing becomes public until an admin reviews the content, verifies supplier costs,
  // sets a published selling price (or confirms enquiry-only mode), and manually publishes.
  const familyCatalogue = buildFamilyCatalogue()
  for (const dest of familyCatalogue) {
    const trip = await prisma.trip.upsert({
      where: { slug: dest.slug },
      update: {},
      create: dest.trip,
    })
    const existing = await prisma.tripPackage.count({ where: { tripId: trip.id } })
    if (existing === 0) {
      for (const pkg of dest.packages) {
        await prisma.tripPackage.create({ data: { ...pkg, tripId: trip.id } })
      }
    }
  }

  // Jibhi already exists as a published Trip with the legacy duration/tier pricing matrix.
  // Publishing a TripPackage on Jibhi would flip the public page from legacy view to the
  // package picker, so this block is gated behind SEED_JIBHI_PACKAGES=yes. The packages
  // are seeded as draft + priceOnRequest=true even then — publication is a separate
  // deliberate step from the admin UI.
  if (process.env.SEED_JIBHI_PACKAGES === 'yes') {
    const jibhi = await prisma.trip.findUnique({ where: { slug: 'jibhi' } })
    if (jibhi) {
      const existing = await prisma.tripPackage.count({ where: { tripId: jibhi.id } })
      if (existing === 0) {
        for (const pkg of buildJibhiPackages()) {
          await prisma.tripPackage.create({ data: { ...pkg, tripId: jibhi.id } })
        }
      }
    }
  }

  await prisma.experience.upsert({
    where: { slug: 'simlipal' },
    update: {},
    create: {
      slug: 'simlipal',
      title: 'Simlipal',
      location: 'Mayurbhanj, Odisha',
      category: 'Wildlife',
      description: 'Ancient forest and wild elephants',
      image: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=400&q=80',
      visited: true,
      status: 'published'
    }
  })

  await prisma.experience.upsert({
    where: { slug: 'rishikesh' },
    update: {},
    create: {
      slug: 'rishikesh',
      title: 'Rishikesh',
      location: 'Rishikesh, Uttarakhand',
      category: 'Mountains',
      description: 'River rafting and yoga capital',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80',
      visited: true,
      status: 'published'
    }
  })

  console.log('Seeded successfully')
}

main().catch(console.error).finally(() => prisma.$disconnect())

/* ---------- Family catalogue fixtures ---------- */

type DraftPackage = {
  slug: string
  label: string
  days: number
  nights: number
  priceAdult: number
  priceBasis: string
  priceOnRequest: boolean
  image: string
  sortOrder: number
  status: string
  accommodation: string
  inclusions: string
  exclusions: string
  notes: string
  itinerary: string
}

type DraftTrip = {
  slug: string
  trip: Prisma.TripCreateInput
  packages: DraftPackage[]
}

const DRAFT_PACKAGE_NOTE =
  'Draft content — supplier cost and selling price pending verification. Publication requires admin review in the trip editor.'

interface DraftPackageInput {
  slug: string
  label: string
  days: number
  nights: number
  accommodation: string
  inclusions: string[]
  exclusions: string[]
  itinerary: { day: string; title: string; desc: string }[]
  image?: string
}

function draftPackage(input: DraftPackageInput, sortOrder: number): DraftPackage {
  return {
    slug: input.slug,
    label: input.label,
    days: input.days,
    nights: input.nights,
    priceAdult: 0,
    priceBasis: 'per adult, twin sharing',
    priceOnRequest: true,
    image: input.image ?? '',
    sortOrder,
    status: 'draft',
    accommodation: input.accommodation,
    inclusions: JSON.stringify(input.inclusions),
    exclusions: JSON.stringify(input.exclusions),
    notes: DRAFT_PACKAGE_NOTE,
    itinerary: JSON.stringify(input.itinerary),
  }
}

function buildFamilyCatalogue(): DraftTrip[] {
  return [
    {
      slug: 'rishikesh',
      trip: {
        slug: 'rishikesh',
        title: 'Rishikesh Family Weekend',
        subtitle: 'Ganga aarti, gentle rafting, and riverside cottages — a family-friendly first mountain trip.',
        location: 'Uttarakhand',
        category: 'Mountains',
        duration: 'Flexible',
        difficulty: 'Easy',
        price: 0,
        status: 'draft',
        route: 'Dehradun / Haridwar → Rishikesh → Neelkanth',
        image: 'https://images.unsplash.com/photo-1545420333-23a22b18b8fa?w=1200&q=80',
        gallery: JSON.stringify([
          'https://images.unsplash.com/photo-1545420333-23a22b18b8fa?w=1200&q=80',
          'https://images.unsplash.com/photo-1588416499018-d8c621e1d502?w=1200&q=80',
        ]),
        type: 'calculator',
        highlights: JSON.stringify([
          'Ganga aarti at Parmarth Niketan',
          'Family-grade (grade I-II) rafting from Shivpuri',
          'Beatles Ashram and Lakshman Jhula',
          'Neer Garh waterfall walk',
          'Riverside stay with easy access',
        ]),
        included: JSON.stringify([
          'Accommodation on twin-sharing',
          'Daily breakfast',
          'All local transfers in private vehicle',
          'Local guide for sightseeing',
        ]),
        notIncluded: JSON.stringify([
          'Travel to and from Dehradun / Haridwar',
          'Rafting fees unless noted',
          'Meals beyond breakfast',
          'Personal expenses',
        ]),
        faqs: JSON.stringify([
          { q: 'Is rafting safe for children?', a: 'The Shivpuri to Rishikesh stretch is grade I-II and generally considered suitable for ages 10+ with the operator\'s discretion. Life jackets and helmets are mandatory.' },
          { q: 'When is the best time to visit?', a: 'September to June — avoid monsoon (July–August) because rafting is suspended and the river is swollen.' },
        ]),
        pricing: JSON.stringify([]),
        durLabels: JSON.stringify([]),
        durSubLabels: JSON.stringify([]),
        itinerary: JSON.stringify([]),
        tierDetails: JSON.stringify([]),
      },
      packages: [
        draftPackage({
          slug: '2d1n-weekend',
          label: '2D/1N Weekend',
          days: 2,
          nights: 1,
          accommodation: 'Riverside cottage on twin-sharing with daily breakfast.',
          inclusions: [
            'Pickup and drop from Dehradun / Haridwar',
            '1 night riverside cottage on twin-sharing',
            'Daily breakfast',
            'Evening Ganga aarti at Parmarth Niketan',
            'Lakshman Jhula and Ram Jhula walk',
          ],
          exclusions: [
            'Rafting fees',
            'Any meals beyond breakfast',
          ],
          itinerary: [
            { day: 'Day 1', title: 'Arrive · Ganga aarti', desc: 'Pickup, check in, Lakshman Jhula walk, evening Ganga aarti at Parmarth Niketan.' },
            { day: 'Day 2', title: 'Riverside morning · Drop', desc: 'Breakfast by the river, Beatles Ashram walk, drop to Dehradun / Haridwar.' },
          ],
          image: 'https://images.unsplash.com/photo-1545420333-23a22b18b8fa?w=800&q=80',
        }, 0),
        draftPackage({
          slug: '3d2n-rafting',
          label: '3D/2N Family + Rafting',
          days: 3,
          nights: 2,
          accommodation: 'Riverside cottage on twin-sharing with daily breakfast and one riverside dinner.',
          inclusions: [
            'Pickup and drop from Dehradun / Haridwar',
            '2 nights riverside cottage on twin-sharing',
            'Daily breakfast and 1 riverside dinner',
            'Grade I-II family rafting from Shivpuri (9km stretch)',
            'Evening Ganga aarti at Parmarth Niketan',
            'Lakshman Jhula and Beatles Ashram walk',
          ],
          exclusions: [
            'Any meals beyond breakfast and the included dinner',
            'Personal expenses',
          ],
          itinerary: [
            { day: 'Day 1', title: 'Arrive · Ganga aarti', desc: 'Pickup, check in, Lakshman Jhula walk, evening Ganga aarti at Parmarth Niketan.' },
            { day: 'Day 2', title: 'Family rafting + Beatles Ashram', desc: 'Shivpuri grade I-II rafting (9km), lunch stop, Beatles Ashram walk, bonfire by the river.' },
            { day: 'Day 3', title: 'Neer Garh falls · Drop', desc: 'Short walk to Neer Garh waterfall, breakfast, drop to Dehradun / Haridwar.' },
          ],
          image: 'https://images.unsplash.com/photo-1588416499018-d8c621e1d502?w=800&q=80',
        }, 1),
      ],
    },
    {
      slug: 'mussoorie',
      trip: {
        slug: 'mussoorie',
        title: 'Mussoorie Hills Comfort',
        subtitle: 'Classic Queen of the Hills — cool weather, Camel\'s Back, Kempty Falls and a cosy ridge-side stay.',
        location: 'Uttarakhand',
        category: 'Hills',
        duration: 'Flexible',
        difficulty: 'Easy',
        price: 0,
        status: 'draft',
        route: 'Dehradun → Mussoorie → Landour',
        image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=1200&q=80',
        gallery: JSON.stringify([
          'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=1200&q=80',
          'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1200&q=80',
        ]),
        type: 'calculator',
        highlights: JSON.stringify([
          'Mall Road and Camel\'s Back Road walk',
          'Gun Hill ropeway',
          'Kempty Falls splash stop',
          'Landour heritage walk and Char Dukan',
          'Lal Tibba viewpoint',
        ]),
        included: JSON.stringify([
          'Accommodation on twin-sharing',
          'Daily breakfast',
          'All local transfers in private vehicle',
          'Local guide for sightseeing',
        ]),
        notIncluded: JSON.stringify([
          'Travel to and from Dehradun',
          'Monument / entry fees unless noted',
          'Meals beyond breakfast',
          'Personal expenses',
        ]),
        faqs: JSON.stringify([
          { q: 'How cold does it get?', a: 'October to February evenings are cold (5-12°C). Carry layers. March to June is pleasant (15-22°C).' },
          { q: 'Is it suitable for elderly parents?', a: 'Yes — most sightseeing is drive-up or short walks. We can request ground-floor rooms and avoid stair-heavy properties.' },
        ]),
        pricing: JSON.stringify([]),
        durLabels: JSON.stringify([]),
        durSubLabels: JSON.stringify([]),
        itinerary: JSON.stringify([]),
        tierDetails: JSON.stringify([]),
      },
      packages: [
        draftPackage({
          slug: '3d2n-classic',
          label: '3D/2N Classic',
          days: 3,
          nights: 2,
          accommodation: 'Comfortable 3-star hotel near Mall Road on twin-sharing with daily breakfast.',
          inclusions: [
            'Pickup and drop from Dehradun',
            '2 nights 3-star hotel on twin-sharing',
            'Daily breakfast',
            'Kempty Falls, Gun Hill ropeway, Mussoorie Lake',
            'Camel\'s Back Road walk',
          ],
          exclusions: [
            'Ropeway tickets and entry fees',
            'Any meals beyond breakfast',
          ],
          itinerary: [
            { day: 'Day 1', title: 'Dehradun → Mussoorie', desc: 'Pickup from Dehradun, scenic drive to Mussoorie, check in, Mall Road evening.' },
            { day: 'Day 2', title: 'Kempty Falls + Gun Hill', desc: 'Kempty Falls, Mussoorie Lake, Gun Hill ropeway and sunset at Camel\'s Back.' },
            { day: 'Day 3', title: 'Mussoorie → Dehradun', desc: 'Breakfast, Mall Road leisure time, drop to Dehradun.' },
          ],
          image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800&q=80',
        }, 0),
        draftPackage({
          slug: '4d3n-landour',
          label: '4D/3N Landour Heritage',
          days: 4,
          nights: 3,
          accommodation: 'Heritage property or boutique cottage in Landour on twin-sharing with daily breakfast.',
          inclusions: [
            'Pickup and drop from Dehradun',
            '3 nights heritage / boutique cottage on twin-sharing',
            'Daily breakfast',
            'Mussoorie town sightseeing (Kempty, Gun Hill, Mall Road)',
            'Landour heritage walk with Char Dukan tea stop',
            'Lal Tibba viewpoint',
          ],
          exclusions: [
            'Ropeway tickets and entry fees',
            'Any meals beyond breakfast',
          ],
          itinerary: [
            { day: 'Day 1', title: 'Dehradun → Mussoorie', desc: 'Pickup, scenic drive, check in, Mall Road evening.' },
            { day: 'Day 2', title: 'Kempty + Gun Hill', desc: 'Kempty Falls, Mussoorie Lake, Gun Hill ropeway, Camel\'s Back sunset.' },
            { day: 'Day 3', title: 'Landour heritage walk', desc: 'Landour Bazaar, Char Dukan, Lal Tibba, Sister\'s Bazaar — quiet heritage day.' },
            { day: 'Day 4', title: 'Mussoorie → Dehradun', desc: 'Breakfast, leisure, drop to Dehradun.' },
          ],
          image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&q=80',
        }, 1),
      ],
    },
    {
      slug: 'munnar-alleppey',
      trip: {
        slug: 'munnar-alleppey',
        title: 'Kerala Family — Munnar & Alleppey',
        subtitle: 'Tea gardens, spice walks and a private houseboat on the backwaters — a classic south India family loop.',
        location: 'Kerala',
        category: 'Hills',
        duration: 'Flexible',
        difficulty: 'Easy',
        price: 0,
        status: 'draft',
        route: 'Kochi → Munnar → Alleppey → Kochi',
        image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=1200&q=80',
        gallery: JSON.stringify([
          'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=1200&q=80',
          'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?w=1200&q=80',
        ]),
        type: 'calculator',
        highlights: JSON.stringify([
          'Tea garden walks in Munnar',
          'Eravikulam National Park (Nilgiri tahr)',
          'Spice plantation tour',
          'Private houseboat night on Alleppey backwaters',
          'Kathakali cultural evening',
        ]),
        included: JSON.stringify([
          'Accommodation on twin-sharing',
          'Daily breakfast',
          'All transfers in private vehicle',
          'Private houseboat with onboard chef (Alleppey leg)',
        ]),
        notIncluded: JSON.stringify([
          'Flight / train to Kochi',
          'National park entry fees unless noted',
          'Meals beyond those noted in the package',
          'Personal expenses',
        ]),
        faqs: JSON.stringify([
          { q: 'When is the best time to visit?', a: 'September to March is the ideal window. Avoid May-August for the monsoon.' },
          { q: 'Is the houseboat air-conditioned?', a: 'Yes — rooms are AC through the night. Common areas use fans during the day.' },
        ]),
        pricing: JSON.stringify([]),
        durLabels: JSON.stringify([]),
        durSubLabels: JSON.stringify([]),
        itinerary: JSON.stringify([]),
        tierDetails: JSON.stringify([]),
      },
      packages: [
        draftPackage({
          slug: '5d4n-family',
          label: '5D/4N Family Classic',
          days: 5,
          nights: 4,
          accommodation: '3-star resort in Munnar on twin-sharing + 1 night deluxe private houseboat in Alleppey.',
          inclusions: [
            'Airport pickup and drop in Kochi',
            '2 nights 3-star resort in Munnar',
            '1 night deluxe private houseboat in Alleppey',
            '1 night in Kochi (optional, before or after)',
            'Daily breakfast + onboard lunch and dinner on the houseboat',
            'Munnar sightseeing — tea estate, Eravikulam, Mattupetty Dam',
            'Spice plantation visit',
          ],
          exclusions: [
            'Flight / train to Kochi',
            'National park entry fees',
            'Meals beyond those noted',
          ],
          itinerary: [
            { day: 'Day 1', title: 'Kochi → Munnar', desc: 'Airport pickup in Kochi, scenic drive to Munnar via waterfalls and spice stops, check in.' },
            { day: 'Day 2', title: 'Munnar sightseeing', desc: 'Eravikulam National Park, tea museum, Mattupetty Dam, Echo Point.' },
            { day: 'Day 3', title: 'Munnar → Alleppey · Houseboat', desc: 'Scenic drive down the ghats to Alleppey, board private houseboat, cruise the backwaters with onboard lunch and dinner.' },
            { day: 'Day 4', title: 'Alleppey → Kochi', desc: 'Houseboat breakfast, disembark, drive to Kochi — Fort Kochi walk, Kathakali evening.' },
            { day: 'Day 5', title: 'Kochi · Drop', desc: 'Breakfast, drop to Kochi airport.' },
          ],
          image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&q=80',
        }, 0),
        draftPackage({
          slug: '6d5n-slow',
          label: '6D/5N Slow Family',
          days: 6,
          nights: 5,
          accommodation: '4-star resort in Munnar + 1-night premium private houseboat + 1 night Fort Kochi heritage stay.',
          inclusions: [
            'Airport pickup and drop in Kochi',
            '3 nights 4-star resort in Munnar',
            '1 night premium private houseboat in Alleppey (AC bedrooms, upper deck)',
            '1 night Fort Kochi heritage stay',
            'Daily breakfast + onboard lunch and dinner on the houseboat',
            'Munnar sightseeing + half-day spice plantation visit',
            'Kathakali cultural evening in Kochi',
          ],
          exclusions: [
            'Flight / train to Kochi',
            'National park entry fees',
            'Meals beyond those noted',
          ],
          itinerary: [
            { day: 'Day 1', title: 'Kochi → Munnar', desc: 'Airport pickup, scenic drive to Munnar, check in and leisure evening.' },
            { day: 'Day 2', title: 'Munnar sightseeing', desc: 'Eravikulam National Park, tea museum, Mattupetty Dam.' },
            { day: 'Day 3', title: 'Spice plantation + leisure', desc: 'Half-day spice plantation tour and leisure afternoon at the resort.' },
            { day: 'Day 4', title: 'Munnar → Alleppey · Houseboat', desc: 'Drive to Alleppey, board premium houseboat, cruise with onboard meals.' },
            { day: 'Day 5', title: 'Alleppey → Fort Kochi', desc: 'Houseboat breakfast, disembark, drive to Fort Kochi — Chinese fishing nets, Kathakali evening.' },
            { day: 'Day 6', title: 'Kochi · Drop', desc: 'Breakfast, Fort Kochi morning walk, drop to Kochi airport.' },
          ],
          image: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?w=800&q=80',
        }, 1),
      ],
    },
  ]
}

function buildJibhiPackages(): DraftPackage[] {
  // NOTE: Jibhi is a published Trip with a legacy duration/tier pricing matrix.
  // Publishing any of these packages will flip the public page from the legacy
  // calculator view to the package picker. Do this only after admin review.
  return [
    draftPackage({
      slug: '3d2n-standard',
      label: '3D/2N Family Standard',
      days: 3,
      nights: 2,
      accommodation: 'Comfortable homestay or 3-star cottage in Jibhi on twin-sharing with daily breakfast.',
      inclusions: [
        'Pickup and drop from Aut',
        '2 nights accommodation on twin-sharing',
        'Daily breakfast',
        'Jibhi waterfall and village walk',
        'Jalori Pass + Serolsar Lake trek (guided)',
      ],
      exclusions: [
        'Delhi to Aut transport',
        'Meals beyond breakfast',
      ],
      itinerary: [
        { day: 'Day 1', title: 'Aut → Jibhi · Arrive', desc: 'Pickup from Aut, check in, Jibhi waterfall walk, bonfire evening.' },
        { day: 'Day 2', title: 'Jalori Pass · Serolsar Lake', desc: 'Drive to Jalori Pass, trek to Serolsar Lake through alpine forest.' },
        { day: 'Day 3', title: 'Shoja · Aut drop', desc: 'Shoja village, Chhoie waterfall, drop to Aut.' },
      ],
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
    }, 0),
    draftPackage({
      slug: '4d3n-family',
      label: '4D/3N Family Deluxe',
      days: 4,
      nights: 3,
      accommodation: 'Wooden cottage or boutique stay in Jibhi on twin-sharing with daily breakfast.',
      inclusions: [
        'Pickup and drop from Aut',
        '3 nights wooden cottage on twin-sharing',
        'Daily breakfast',
        'Jibhi waterfall walk',
        'Jalori Pass + Serolsar Lake trek (guided)',
        'Raghupur Fort trek + Shoja village',
      ],
      exclusions: [
        'Delhi to Aut transport',
        'Meals beyond breakfast',
      ],
      itinerary: [
        { day: 'Day 1', title: 'Aut → Jibhi', desc: 'Pickup, check in, Jibhi waterfall, bonfire.' },
        { day: 'Day 2', title: 'Jalori Pass · Serolsar', desc: 'Jalori Pass, Serolsar Lake trek.' },
        { day: 'Day 3', title: 'Shoja · Raghupur Fort', desc: 'Raghupur Fort trek, Tirthan valley evening.' },
        { day: 'Day 4', title: 'Chhoie Waterfall · Aut', desc: 'Chhoie waterfall trek, drop to Aut.' },
      ],
      image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80',
    }, 1),
  ]
}
