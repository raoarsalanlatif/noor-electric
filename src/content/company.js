// Single source of truth for company details shown across the site.
// Sourced from the Noor Electric Renewables Facebook page and project posts.

export const img = (file) => `${import.meta.env.BASE_URL}images/${file}`;

export const company = {
  name: 'Noor Electric Renewables',
  legalName: 'Noor Electric (Pvt.) Ltd.',
  shortName: 'Noor Electric',
  tagline: 'Sunny skies, happy wallets',
  bio:
    'Empowering your home and business with reliable, cost-effective solar solutions. Explore customised packages designed around your energy needs and embrace a brighter, greener future.',
  phones: [
    { label: 'Call / WhatsApp', display: '0342 1946568', tel: '+923421946568' },
    { label: 'Alternate', display: '0340 9566404', tel: '+923409566404' },
  ],
  whatsapp: '923421946568',
  yearsInBusiness: '4+',
  projectsCompleted: '500+',
  address: {
    line1: 'Office No. 3, First Floor, Cantt Mall',
    line2: 'Saddar Road, Peshawar Cantonment',
    city: 'Peshawar, Pakistan 25000',
    mapQuery: 'Cantt Mall, Saddar Road, Peshawar Cantonment, Peshawar',
  },
  serviceAreas: ['Peshawar', 'Islamabad', 'Rawalpindi', 'Khyber Pakhtunkhwa'],
  website: 'www.noorelectric.org',
  socials: {
    facebook: 'https://www.facebook.com/NoorElectricRenewables',
    instagram: 'https://www.instagram.com/noor_electric_renewables',
    linkedin: 'https://www.linkedin.com/company/noor-electric-renewables',
    tiktok: 'https://www.tiktok.com/@noor.electric.ren',
  },
  facebookFollowers: '9.5K',
};

export const whatsappLink = (text = 'Hi Noor Electric, I would like a free solar consultation.') =>
  `https://wa.me/${company.whatsapp}?text=${encodeURIComponent(text)}`;

export const ceo = {
  name: 'Rao Faizan Latif',
  role: 'Chief Executive Officer',
  credential: 'Electrical Engineer',
  experience: '5+ years in solar',
  photo: img('ceo-rao-faizan-latif.jpg'),
  photoPosition: 'center 30%',
  linkedin: null,
  facts: ['Electrical Engineer', '5+ years in solar', '500+ systems delivered'],
  bio: [
    'Rao Faizan Latif is the Chief Executive Officer of Noor Electric (Pvt.) Ltd. An electrical engineer by training, he has spent more than five years designing, commissioning and maintaining solar power systems, and leads Noor Electric’s mission to bring engineering-grade solar to homes and businesses in Khyber Pakhtunkhwa and Islamabad.',
    'He sets the company’s technical standards and leads system design, engineering quality and customer delivery. His approach is simple: size every system from the customer’s real load, use quality components, and install with proper protection and earthing so the system performs safely for decades.',
    'Under his leadership Noor Electric has completed more than 500 domestic and commercial projects — from rooftop on-grid systems with net-metering to multi-inverter hybrid plants with lithium storage — and built a reputation for honest advice, clean workmanship and dependable after-sales support.',
  ],
  focus: ['System design & engineering', 'Quality & safety standards', 'Commercial & industrial projects', 'Net-metering & utility liaison'],
};

export const director = {
  name: 'Rao Arsalan Latif',
  role: 'Director Operations & Board Member',
  photo: img('director-rao-arsalan-latif.jpg'),
  photoPosition: 'center 18%',
  linkedin: 'https://www.linkedin.com/in/rao-arsalan-734057160/',
  facts: ['Board Member', 'Director Operations', 'Technology & finance'],
  bio: [
    'Rao Arsalan Latif is a member of the Board and Director Operations at Noor Electric (Pvt.) Ltd. He oversees the business side of the company — procurement, supply chain, technology, marketing and customer financing — so that the engineering team can focus on delivering excellent installations.',
    'He leads procurement strategy and supplier partnerships with tier-1 manufacturers of panels, inverters and lithium batteries, with a focus on genuine stock, competitive pricing and warranty-backed equipment for every customer. He also shapes the company’s financing options, making it easier for families and businesses to move to solar without a large upfront cost.',
    'With more than five years of experience as a software engineer building high-scale fintech and digital platforms, he drives Noor Electric’s technology and marketing — from the online Solar Planner and digital quotations to the systems the team uses to manage projects, site visits and customer service.',
  ],
  focus: ['Procurement & supplier strategy', 'Technology & digital platforms', 'Marketing & brand growth', 'Customer financing & operations'],
};

export const leaders = [ceo, director];

export const brands = ['Trina Solar', 'Solis', 'Inverex', 'Zilo', 'Dongjin', 'Narada'];

export const projects = [
  {
    id: '12kw-islamabad',
    title: '12 kW Hybrid Solar System',
    location: 'Islamabad · Residential',
    image: img('install-panels.jpg'),
    poster: img('project-12kw.jpg'),
    highlights: ['10.15 kWp solar capacity', '16 kWh battery storage', '24/7 backup power'],
    specs: [
      { label: 'Panels', value: '14 × 725 W Trina Solar N-type bifacial, elevated steel structure' },
      { label: 'Inverter', value: 'Solis 12 kW single-phase hybrid' },
      { label: 'Battery', value: 'Zilo Nexa Smart 51.2 V 314 Ah lithium (16 kWh)' },
    ],
    gallery: [img('install-panels.jpg'), img('install-inverter.jpg'), img('install-battery.jpg')],
  },
  {
    id: '40kw-upgrade',
    title: '40 kW Premium Hybrid Upgrade',
    location: 'Commercial-scale hybrid',
    image: img('install-40kw.jpg'),
    poster: img('project-40kw.jpg'),
    highlights: ['4 hybrid inverters in parallel', '2 lithium battery banks', 'Uninterrupted power'],
    specs: [
      { label: 'Inverters', value: '4 × Inverex 6 kW hybrid' },
      { label: 'Battery bank 1', value: '6 × Dongjin 51.2 V 100 Ah' },
      { label: 'Battery bank 2', value: '2 × Narada 48 V 100 Ah' },
    ],
    gallery: [img('install-40kw.jpg')],
  },
  {
    id: '10kw-ongrid',
    title: '10 kW On-Grid with Green Meter',
    location: 'Residential · Net-metering',
    image: null,
    highlights: ['On-grid system', 'Green meter installed', 'Lower monthly bills'],
    specs: [
      { label: 'Type', value: 'On-grid, net-metered' },
      { label: 'Result', value: 'Customer reports reduced energy bills' },
    ],
    gallery: [],
  },
];

// Real Facebook recommendations (shortened, wording unchanged).
export const reviews = [
  {
    name: 'Muhammad Awais',
    text: "I recently had the pleasure of working with Noor Electric Renewables to install a 10kw On Grid solar system at my home with Green Meter. Their team was professional, efficient, and knowledgeable. The installation process was seamless, and I'm already seeing the benefits of reduced energy bills. Highly recommend.",
  },
  {
    name: 'Muhammad Usman',
    text: 'I recently had Noor Electric Renewables install a solar system for my home, and I couldn’t be happier with the experience. From start to finish, their team was professional, knowledgeable.',
  },
];
