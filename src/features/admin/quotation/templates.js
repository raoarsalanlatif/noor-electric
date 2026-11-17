// Built-in quotation templates. Add another object to BUILT_IN_TEMPLATES to ship a new one;
// the team can also save their own from the editor ("Save as template").

export const STANDARD_TERMS = [
  'No payment shall be withheld due to Net Metering.',
  'Power cable from disconnect switch to Main DB will be charged as per actual if required while installing the WAPDA disconnect switch.',
  'Disconnect switch price will be charged as per actual & will be in client scope.',
  'Sanction load, name and address correction on the electricity bill will be in client scope.',
  'Payment transfer: 100% through bank transfer / cheque / cash upon closing the deal.',
  'Cable & accessories specification: the lengths and quantities of cables and accessories provided by the company for the installation are based on approximate measurements due to the nature of installation. Actual measurements may vary in real time.',
  'Cable & accessories prices: prices are also based on estimates. The company retains ownership of any surplus materials. If the requirement exceeds 10% of the quoted quantity, the customer will be charged for the additional quantity.',
];

export const STANDARD_NOTE = 'NOTE : ABOVE MENTIONED PRICES ARE EXCLUDING OF ANY KIND OF FBR/INCOME TAXES';

const item = (description, warranty, unitPrice, qty) => ({ description, warranty, unitPrice, qty });

export const BUILT_IN_TEMPLATES = [
  {
    id: 'hybrid-10kw',
    name: '10KW Premium Hybrid Solar System',
    quotation: {
      title: '10KW Premium Hybrid Solar System',
      sections: [
        { title: 'Solar Panels', unit: 'Nos.', items: [
          item('Canadian N Type 620w or equivalent', '12 Years Replacement Warranty, 30 Years Linear Performance warranty', 25500, 16),
        ] },
        { title: 'Inverters', unit: 'Nos.', items: [
          item('Inverex 10KW IP-66', '5 year repairing warranty', 425000, 1),
        ] },
        { title: 'Battery', unit: 'Nos.', items: [
          item('DJDC 51.2v, 320ah', '5 year repairing warranty', 630000, 1),
        ] },
        { title: 'Cables', unit: 'Meters', items: [
          item('DC Cables : 6mm2/4mm2 Red/Black 1 Core (KUKA Cables / Equivalent)', '2 Years Replacement Warranty', 330, 150),
          item('AC Cables : 6/10mm2 (Siemen Cable / Fast Cable Equivalent)', '2 Years Replacement Warranty', 570, 50),
          item('Earthing Cables : 750/1000V Yellow Green 1 Core', '2 Years Replacement Warranty', 300, 90),
        ] },
        { title: 'Breakers And Miscellaneous Item', unit: 'Nos.', items: [
          item('AC Breakers (Tomzn, Chint / Equivalent)', '1 Year Replacement Warranty', 1.5, 10000),
          item('DB Box (Rating IP65), Safety Equipment, PVC Pipes, Conduits Tapes, Cable Ties, Elbows, Sockets', '1 Year Replacement Warranty', 1.5, 10000),
          item('MC4 PV Connectors IP65', '1 Year Replacement Warranty', 600, 4),
        ] },
        { title: 'Earthing and Lighting Protection', unit: 'Job', items: [
          item('AC/DC Earthing, Ground Bore 3x3x5-7 Feet, 1x1ft plate, 10mm copper wire 5-8 Feet, Earthing Powder Bags, Coal, U Clamps, PVC Pipe, Brass Nut Bolt', '', 20000, 2),
          item('Lightening Arrestor, Insulator, Nut bolt, U Clamp Large size', '', 0, 1),
        ] },
        { title: 'Installation & Commissioning', unit: 'Job', items: [
          item('Standard Installation & Commissioning of system', '1 Years After Sale Service', 3, 10000),
          item('Transportation, Labour (Loading and Offloading) & Delivery to site (Ex Peshawar)', '', 2.5, 10000),
        ] },
        { title: 'Smart Monitoring Meter', unit: 'Nos.', items: [
          item('Noor Electric Renewables Monitoring System (RS485 RTU)', 'Mobile App, 24/7 System Monitoring', '', ''),
        ] },
        { title: 'Mounting structure', unit: 'Nos.', items: [
          item('Customized Gardar Structure', '', 8500, 18),
          item('1ft x 1ft Civil Pads, Roof Top Dressing', '', 500, 18),
        ] },
        { title: 'Net Metering', unit: 'Job', items: [
          item('Net Metering Services (File, License Generation), Bidirectional Energy Meter', '07 Years Export License', 0, 1),
        ] },
      ],
      discount: '',
      note: STANDARD_NOTE,
      terms: STANDARD_TERMS,
      showSeal: true,
    },
  },
  {
    id: 'blank',
    name: 'Blank quotation',
    quotation: {
      title: '',
      sections: [{ title: 'Solar Panels', unit: 'Nos.', items: [item('', '', '', 1)] }],
      discount: '',
      note: STANDARD_NOTE,
      terms: STANDARD_TERMS,
      showSeal: true,
    },
  },
];
