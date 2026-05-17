import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
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
