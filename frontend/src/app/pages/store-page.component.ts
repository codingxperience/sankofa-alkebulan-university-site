import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

interface ProductDef {
  readonly t: string;
  readonly m?: string;
  readonly au?: string;
  readonly yr?: string;
  readonly p: number;
  readonly ed?: string;
  readonly img?: string;
  readonly pos?: string;
  readonly kind?: 'apparel' | 'artifact' | 'book';
  readonly sizes?: boolean;
  readonly bg?: string;
  readonly imprint?: string;
  readonly icon?: string;
  readonly desc?: string;
  readonly specs?: readonly (readonly [string, string])[];
}

const SIZES = ['S', 'M', 'L', 'XL', '2XL'] as const;

const PRODUCTS: Record<string, ProductDef> = {
  'tee-navy': {
    t: 'Sankofa Tee — Navy', m: 'Adinkra sleeves · gold Alkebulan map', p: 28,
    img: 'assets/store/tshirt-navy.jpg', pos: '50% 40%', kind: 'apparel', sizes: true,
    desc: 'The first piece of Drop 01 — a heavyweight navy tee carrying the gold-foil Alkebulan map on the chest and the Sankofa bird across the back: heritage worn with honor.',
    specs: [['Fabric', '220gsm premium cotton · unisex fit'], ['Print', 'Gold foil + water-based inks'], ['Sleeves', 'Gye Nyame · Sankofa bird · Dwennimmen'], ['Shipping', 'Print-on-demand · ships continent-wide']],
  },
  'tee-colors': {
    t: 'Sankofa Tee — Heritage', m: 'Four colourways · premium cotton', p: 28,
    img: 'assets/store/tshirt-colors.jpg', pos: '50% 30%', kind: 'apparel', sizes: true,
    desc: 'The same drop in four heritage colourways — navy, stone grey, black, and maroon — each sealed with the official merchandise card.',
    specs: [['Fabric', '220gsm premium cotton · unisex fit'], ['Colourways', 'Navy · stone grey · black · maroon'], ['Packaging', 'Official release sleeve + heritage card'], ['Shipping', 'Print-on-demand · ships continent-wide']],
  },
  hoodie: {
    t: 'Alkebulan Hoodie', m: 'Kente-lined hood · embroidered symbols', p: 54,
    img: 'assets/store/hoodie.jpg', pos: '50% 45%', kind: 'apparel', sizes: true,
    desc: 'Brushed black fleece with a kente-lined hood, the cracked-gold Alkebulan map front and centre, and Adinkra symbols embroidered down the sleeve.',
    specs: [['Fabric', '380gsm brushed fleece · kente-lined hood'], ['Embroidery', 'Sleeve Adinkra column + gold cuff bands'], ['Fit', 'Relaxed unisex · pre-shrunk'], ['Shipping', 'Print-on-demand · ships continent-wide']],
  },
  scarf: {
    t: 'Heritage Stole', m: 'Mali · Kush · Kongo · Great Zimbabwe', p: 38,
    img: 'assets/store/heritage-scarf.jpg', pos: '50% 30%', kind: 'apparel',
    desc: 'A fringed ceremonial stole carrying four kingdoms — Mali, Kush, Kongo, and Great Zimbabwe — in aged-parchment panels over kente borders.',
    specs: [['Material', 'Satin-weave · fringed ends'], ['Panels', 'Mali · Kush · Kongo · Great Zimbabwe + crest'], ['Length', '182cm · one size'], ['Occasions', 'Graduation · convocation · diaspora ceremony']],
  },
  tunic: {
    t: 'Sankofa Tunic', m: 'Black cotton · kente trim · Adinkra sleeves', p: 92,
    img: 'assets/store/tunic.jpg', pos: '50% 40%', kind: 'apparel', sizes: true,
    desc: 'A black cotton tunic with the gold-thread Alkebulan map, kente collar bands, and Adinkra symbols in red, gold, and green down each sleeve.',
    specs: [['Fabric', 'Mid-weight cotton twill'], ['Trim', 'Kente collar + hem bands · fringe collar'], ['Embroidery', 'Gold Alkebulan map · sleeve Adinkra'], ['Care', 'Cold wash · line dry']],
  },
  gown: {
    t: 'Graduation Gown', m: 'Sankofa bird · kente hood + stole', p: 148,
    img: 'assets/store/graduation-gown.jpg', pos: '50% 30%', kind: 'apparel', sizes: true,
    desc: 'The official SAU graduation set — gown, cap, and stole. The Sankofa bird above the Alkebulan map, kente yoke and cuffs, and the university crest on the sash.',
    specs: [['Set', 'Gown + mortarboard + crested stole'], ['Detail', 'Kente yoke, cuffs & hem · gold embroidery'], ['Hire', 'Purchase or ceremony hire via registry'], ['Shipping', 'Made to order · 2–3 weeks']],
  },
  suit: {
    t: 'Executive Suit', m: 'Stone linen · kente lapels · gold pins', p: 340,
    img: 'assets/store/executive-suit.jpg', pos: '50% 35%', kind: 'apparel', sizes: true,
    desc: 'Stone linen tailoring with kente lapel facings and cuff bands, a kente tie and pocket square, and gold Adinkra lapel pins with matching cufflinks.',
    specs: [['Cloth', 'Stone linen blend · half-canvas'], ['Facings', 'Kente lapels, cuffs & pocket square'], ['Hardware', 'Gold Adinkra pins + cufflinks'], ['Tailoring', 'Made to measure · 3–4 weeks']],
  },
  robe: {
    t: 'Academic Robe — Chancellor', m: 'Gold-thread embroidery · ceremonial line', p: 189,
    img: 'assets/store/academic-robe.jpg', pos: '50% 30%', kind: 'apparel', sizes: true,
    desc: 'The ceremonial line — black velvet-faced robe with gold-thread borders, the Sankofa bird at the collar, and the gold Alkebulan map across the chest. Worn with the banded cap.',
    specs: [['Cloth', 'Heavy drape · velvet facings'], ['Embroidery', 'Gold-thread borders · Sankofa collar'], ['Set', 'Robe + banded cap with tassel'], ['Line', 'Chancellor · Senate · Faculty variants']],
  },
  cross: {
    t: 'Ethiopian Cross', m: '3D-printed silver polymer · archival NFT documentation', p: 240, ed: 'Edition of 25',
    img: 'assets/store/ethiopian-cross.jpg', pos: '40% 30%', kind: 'artifact',
    desc: 'A processional cross of the Ethiopian Highlands, reborn in hand-gilded print. The paired NFT carries archival documentation and the cultural context the original was separated from.',
    specs: [['Original', 'Processional cross · Ethiopian Highlands, 18th c.'], ['Material', '3D-printed silver polymer · hand-gilded'], ['Edition', '25 numbered casts · plinth engraved'], ['Certificate', 'ERC-721 · archival record on IPFS'], ['Funds', 'Repatriation research + Kahigiriza Memorial']],
  },
  benin: {
    t: 'Benin Bronze Head', m: '3D-printed metallic resin · provenance on-chain', p: 290, ed: 'Edition of 50',
    img: 'assets/store/benin-bronze-head.jpg', pos: '22% 50%', kind: 'artifact',
    desc: 'The court bronze of the Kingdom of Benin, taken in the 1897 raid — reprinted in metallic resin with its full provenance and repatriation status recorded on-chain.',
    specs: [['Original', 'Benin Bronze head · Kingdom of Benin, 16th c.'], ['Material', '3D-printed metallic resin · marble plinth'], ['Edition', '50 numbered casts'], ['Certificate', 'ERC-721 · provenance + IPFS verification'], ['Funds', 'Repatriation research + Kahigiriza Memorial']],
  },
  ashanti: {
    t: 'Ashanti Gold Mask', m: 'Gold-plated polymer · blockchain origin record', p: 340, ed: 'Edition of 25',
    img: 'assets/store/ashanti-gold-mask.jpg', pos: '20% 50%', kind: 'artifact',
    desc: 'A ceremonial mask of the Ashanti court in gold-plated polymer — wisdom, status, and spiritual protection — with a blockchain certificate binding it to its historical origin.',
    specs: [['Original', 'Ceremonial mask · Ashanti Kingdom, Ghana'], ['Material', 'Gold-plated polymer · marble base'], ['Edition', '25 numbered casts'], ['Certificate', 'ERC-721 · origin record + QR verification'], ['Funds', 'Repatriation research + Kahigiriza Memorial']],
  },
  kongo: {
    t: 'Kongo Power Figure', m: 'Wood-texture resin · repatriation narrative NFT', p: 260, ed: 'Edition of 40',
    img: 'assets/store/kongo-power-figure.jpg', pos: '32% 45%', kind: 'artifact',
    desc: 'An nkisi power figure of the Kongo Kingdom, replicated in wood-texture resin. Its NFT records the museum history — and the repatriation narrative now being written.',
    specs: [['Original', 'Nkisi n’kondi · Kongo Kingdom, 19th c.'], ['Material', 'Wood-texture resin · engraved plinth'], ['Edition', '40 numbered casts'], ['Certificate', 'ERC-721 · museum provenance record'], ['Funds', 'Repatriation research + Kahigiriza Memorial']],
  },
  nok: {
    t: 'Nok Terracotta Figure', m: 'Ceramic composite · 360° scan of the original', p: 220, ed: 'Edition of 36',
    img: 'assets/store/nok-terracotta.jpg', pos: '40% 45%', kind: 'artifact',
    desc: 'One of the oldest sculptural traditions on earth — Nok, c. 500 BC — printed in ceramic composite. The certificate includes a 360° digital scan of the original.',
    specs: [['Original', 'Nok terracotta · Nigeria, c. 500 BC'], ['Material', 'Ceramic composite · museum finish'], ['Edition', '36 numbered casts'], ['Certificate', 'ERC-721 · includes 360° scan'], ['Funds', 'Repatriation research + Kahigiriza Memorial']],
  },
  'bk-curriculum': {
    t: 'Curriculum Development for Cultural Relevance', au: 'SAU Faculty of Education', yr: 'SAU Press · 2026', p: 22, kind: 'book', bg: '#0f4c81', imprint: 'SAU Press',
    desc: 'The Liberation Publishing flagship — a working framework for educators decolonizing syllabi, from reading lists to assessment, with case studies from four African universities.',
    specs: [['Format', 'PDF + EPUB · DRM-free'], ['Extent', '214 pages · worksheets included'], ['Imprint', 'SAU Press · Liberation Publishing'], ['License', 'Personal + classroom use']],
  },
  'bk-brics': {
    t: 'Bretton Woods to BRICS: African Trade', au: 'SAU Institute of Political Economy', yr: 'SAU Press · 2026', p: 16, kind: 'book', bg: '#b35c2a', imprint: 'SAU Press',
    desc: 'Africa’s trade position re-read from the inside — from the Bretton Woods order to BRICS realignment, AfCFTA, and the routes to sovereign commerce.',
    specs: [['Format', 'PDF + EPUB · DRM-free'], ['Extent', '188 pages · data appendix'], ['Imprint', 'SAU Press · Liberation Publishing'], ['License', 'Personal + classroom use']],
  },
  'bk-astro': {
    t: 'Astrophysics for the Mind', au: 'Emmanuel Mihiingo Kaija', yr: 'SAU Press · 2025', p: 9, kind: 'book', bg: '#051b2c', imprint: 'SAU Press',
    desc: 'The universe’s greatest mysteries read through telescope and proverb — Dogon star knowledge, black holes, and dark matter beside African philosophies of the unseen.',
    specs: [['Format', 'PDF + EPUB · DRM-free'], ['Extent', '96 pages'], ['Imprint', 'SAU Press · Liberation Publishing'], ['Author', 'Emmanuel Mihiingo Kaija']],
  },
  'bk-maths': {
    t: 'Pre-Colonial Mathematical Equations', au: 'Emmanuel Mihiingo Kaija', yr: 'SAU Press · 2025', p: 9, kind: 'book', bg: '#1f7a4d', imprint: 'SAU Press',
    desc: 'Africa’s forgotten mathematical legacy — number systems, geometry, and astronomy from the Ishango bone to Timbuktu manuscripts.',
    specs: [['Format', 'PDF + EPUB · DRM-free'], ['Extent', '84 pages'], ['Imprint', 'SAU Press · Liberation Publishing'], ['Author', 'Emmanuel Mihiingo Kaija']],
  },
  'bk-ngugi': {
    t: 'Decolonising the Mind', au: 'Ngũgĩ wa Thiong’o', yr: '1986 · Library edition', p: 0, kind: 'book', bg: '#7d4a9e', imprint: 'University Library',
    desc: 'The classic on language and cultural liberation — required reading across SAU. Held in the University Library as a free, open-access PDF.',
    specs: [['Format', 'Free PDF · University Library'], ['Access', 'Open to all readers'], ['Shelf', 'Language & liberation'], ['Status', 'Required reading · Year One']],
  },
  'bk-iliffe': {
    t: 'Africans: The History of a Continent', au: 'John Iliffe', yr: 'Library edition', p: 0, kind: 'book', bg: '#a03a52', imprint: 'University Library',
    desc: 'A single-volume history of the continent, from human origins to the present — held free in the University Library collection.',
    specs: [['Format', 'Free PDF · University Library'], ['Access', 'Open to all readers'], ['Shelf', 'Continental history'], ['Status', 'Core survey text']],
  },
  'bk-aehn': {
    t: 'The History of African Development', au: 'African Economic History Network', yr: 'Open textbook · 2023', p: 0, kind: 'book', bg: '#086b83', imprint: 'University Library',
    desc: 'The AEHN open textbook — African economic history written for African classrooms, updated 2023. Free in the University Library.',
    specs: [['Format', 'Free PDF · open textbook'], ['Access', 'Open to all readers'], ['Shelf', 'Economic history'], ['Edition', 'March 2023']],
  },
  'bk-fondad': {
    t: 'Africa in the World Economy', au: 'Fondad · The Hague', yr: 'Library edition', p: 0, kind: 'book', bg: '#7a5a1c', imprint: 'University Library',
    desc: 'Africa’s position in global finance and trade — policy essays held free in the University Library collection.',
    specs: [['Format', 'Free PDF · University Library'], ['Access', 'Open to all readers'], ['Shelf', 'Political economy'], ['Status', 'Policy reference']],
  },
  'album-digital': { t: 'Liberation Frequency — Digital', m: '11 tracks · lossless + lyric book', p: 12, img: 'assets/store/album-front.jpg' },
  'album-vinyl': { t: 'Liberation Frequency — Vinyl', m: 'Limited gatefold pressing', p: 45, img: 'assets/store/album-back.jpg' },
  'museum-pass': { t: 'Sankofa Museum Pass', m: 'Kahigiriza + Great Zimbabwe + Timbuktu', p: 18, img: 'assets/store/museum-pass-poster.jpg' },
  'language-pack': { t: 'Alkebulan Language Pack', m: 'Monthly · Yoruba, Amharic, Wolof, Runyankore', p: 5, icon: 'fa-language' },
  'vault-cert': { t: 'Alkebulan 101 — Certificate', m: 'Knowledge Vault · self-paced', p: 20, icon: 'fa-book-open' },
  'archive-vol1': { t: 'Oral Archive Vol. 1', m: 'Voices of Nkore Elders · download', p: 10, icon: 'fa-feather' },
  'career-post': { t: 'Career Link — Job Post', m: '30-day listing · SAU graduate pool', p: 200, img: 'assets/store/career-link-poster.jpg' },
};

const TRACKS = [
  { name: 'I — Memory', tracks: [['01', 'Echoes of the Motherland', '3:58'], ['02', 'Drums of Our Fathers', '4:12'], ['03', 'Blood of Our Ancestors', '3:44'], ['04', 'Sons of the Soil', '4:05']] },
  { name: 'II — Disruption', tracks: [['05', 'They Stole the Drum', '3:37'], ['06', 'Concrete Horizons', '4:21'], ['07', 'The Soul of Africa', '3:52']] },
  { name: 'III — Awakening', tracks: [['08', 'Indigenous Mind Frequency', '4:44'], ['09', 'Sovereignty Code', '3:29'], ['10', 'Liberation Frequency', '4:58']] },
  { name: 'IV — Renaissance', tracks: [['11', 'Rise Africa Rise', '5:12']] },
] as const;

const DIGITAL_IDS = ['album-digital', 'museum-pass', 'language-pack', 'vault-cert', 'archive-vol1', 'career-post'];

const fmt = (n: number) => '$' + n.toLocaleString('en-US');

@Component({
  selector: 'app-store-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './store-page.component.html',
  styleUrl: './store-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StorePageComponent {
  readonly products = PRODUCTS;
  readonly sizes = SIZES;
  readonly preorderMode = true;

  readonly cart = signal<Record<string, number>>({});
  readonly cartOpen = signal(false);
  readonly playing = signal('');
  readonly detail = signal('');
  readonly detailQty = signal(1);
  readonly detailSize = signal('M');

  readonly coOpen = signal(false);
  readonly coStep = signal(0);
  readonly coDone = signal(false);
  readonly coName = signal('');
  readonly coEmail = signal('');
  readonly coPlace = signal('');
  readonly coShip = signal('pickup');
  readonly coRail = signal('mpesa');
  readonly coPhone = signal('');
  readonly coCard = signal('');
  readonly orderNo = signal('');

  readonly regaliaIds = ['tee-navy', 'tee-colors', 'hoodie', 'scarf', 'tunic', 'gown', 'suit', 'robe'];
  readonly bookIds = ['bk-curriculum', 'bk-brics', 'bk-astro', 'bk-maths', 'bk-ngugi', 'bk-iliffe', 'bk-aehn', 'bk-fondad'];
  readonly artifactIds = ['cross', 'benin', 'ashanti', 'kongo', 'nok'];
  readonly movements = TRACKS;

  readonly flagship = [
    { n: '01', t: 'Sankofa Regalia', d: 'Hoodies, tunics, and gowns carrying Adinkra and the Alkebulan map — identity you can wear.', meta: 'Print-on-demand, ships continent-wide · for students, diaspora, allies', price: 'from $28', img: 'assets/store/tshirt-navy.jpg', href: '#drop', route: null as string | null, frag: 'drop', cta: 'Shop the drop', addId: null as string | null },
    { n: '02', t: 'Alkebulan Knowledge Vault', d: 'Decolonized short courses: Pre-Colonial Governance, Runyankore for Diaspora, Swahili Tech Terms.', meta: 'Digital, self-paced + certificate · for diaspora, NGOs, partner universities', price: 'from free', icon: 'fa-book-open', route: '/knowledge-vault', frag: null as string | null, cta: 'Browse courses', addId: null as string | null },
    { n: '03', t: 'Repatriation Editions', d: '3D-printed replicas of looted artifacts from Nkore, Benin, and Kemet — each sale funds repatriation.', meta: 'Physical + NFT certificate · for museums, collectors, diaspora', price: 'from $220', img: 'assets/store/ethiopian-cross.jpg', href: '#repatriation', route: null as string | null, frag: 'repatriation', cta: 'View editions', addId: null as string | null },
    { n: '04', t: 'Pan-African Career Link', d: 'Jobs at the AU, AfDB, and African startups — employers pay to reach SAU graduates; grads apply free.', meta: 'Digital portal · for employers across Africa', price: '$200 / post', img: 'assets/store/career-link-poster.jpg', route: '/career-link', frag: null as string | null, cta: 'Enter the portal', addId: null as string | null },
    { n: '05', t: 'Sankofa Museum Pass', d: 'One pass, three experiences: the Kahigiriza Memorial plus virtual Great Zimbabwe and Timbuktu.', meta: 'Digital + physical ticket · for tourists, schools, diaspora', price: '$18', img: 'assets/store/museum-pass-poster.jpg', route: null as string | null, frag: null as string | null, cta: 'Add pass', addId: 'museum-pass' },
    { n: '06', t: 'Alkebulan Language Packs', d: 'One African language per semester — Yoruba, Amharic, Wolof, Runyankore — in a gamified app.', meta: 'App subscription · for diaspora youth, diplomats', price: '$5 / mo', img: 'assets/store/language-packs.jpg', route: null as string | null, frag: null as string | null, cta: 'Subscribe', addId: 'language-pack' },
    { n: '07', t: 'Liberation Publishing', d: 'Curriculum ebooks, the African PhD thesis library, and Oral Archive Vol. 1 — Voices of Nkore Elders.', meta: 'Digital download · for scholars, activists', price: '$10 / volume', icon: 'fa-feather', route: null as string | null, frag: null as string | null, cta: 'Download Vol. 1', addId: 'archive-vol1' },
  ];

  readonly essentials = [
    { icon: 'fa-book', t: 'Textbooks', tag: 'Used market + SAU Press', d: 'African authors first — Things Fall Apart over Animal Farm. A used market alongside the SAU Press imprint.' },
    { icon: 'fa-jar', t: 'Alkebulan Pantry', tag: 'From student co-ops', d: 'Shea butter, millet, hibiscus, and coffee from African student co-operatives — shipped to diaspora students.' },
    { icon: 'fa-laptop-code', t: 'Tech Hub', tag: 'Repair by ICT students', d: 'Refurbished laptops loaded with Ubuntu and African-language keyboards, serviced on campus.' },
    { icon: 'fa-hands-holding-circle', t: 'Ubuntu Services', tag: 'Book a session', d: 'Peer tutoring in indigenous languages, Okwevuga poetry coaching, and spiritual chaplaincy booking.' },
    { icon: 'fa-box-open', t: 'Diaspora Care Packs', tag: 'For the August intake', d: 'Freshers from Nigeria and Ghana land with an SAU kente starter kit and a local SIM already sorted.' },
  ];

  readonly depts = [
    { dept: 'History / African Studies', icon: 'fa-landmark', color: '#b35c2a', tint: 'rgba(179,92,42,0.10)', product: 'Sankofa Oral Archive', d: 'Elders’ testimonies recorded, annotated, and sold as paid downloads.', value: 'Combat epistemicide' },
    { dept: 'Agriculture', icon: 'fa-seedling', color: '#1f7a4d', tint: 'rgba(31,122,77,0.10)', product: 'Indigenous Seed Bank', d: 'Enkungu, fonio, and teff — every packet ships with a planting course.', value: 'Food sovereignty' },
    { dept: 'Law', icon: 'fa-scale-balanced', color: '#0f4c81', tint: 'rgba(15,76,129,0.10)', product: 'AU Legal Templates', d: 'Model contracts drafted for African SMEs — not UK boilerplate.', value: 'Decolonize commerce' },
    { dept: 'Medicine', icon: 'fa-mortar-pestle', color: '#a03a52', tint: 'rgba(160,58,82,0.10)', product: 'Alkebulan Pharmacopeia', d: 'Traditional medicine research with certified herbal kits.', value: 'Validate African science' },
    { dept: 'Engineering', icon: 'fa-solar-panel', color: '#086b83', tint: 'rgba(8,107,131,0.10)', product: 'Off-Grid Solar Kits', d: 'Designed for African villages and built by students, end to end.', value: 'Tech independence' },
    { dept: 'Arts', icon: 'fa-palette', color: '#7d4a9e', tint: 'rgba(125,74,158,0.10)', product: 'New Alkebulan Aesthetic', d: 'Student art, fashion, and music — royalties flow back to creators.', value: 'Cultural economy' },
  ];

  readonly shipOptions = [
    { id: 'pickup', label: 'Campus pickup — Mbarara', meta: 'Ready in 2 days · bring student ID', cost: 0 },
    { id: 'courier', label: 'Continental courier', meta: '3–7 days · 54 states', cost: 6 },
    { id: 'express', label: 'Diaspora express', meta: '5–10 days · worldwide', cost: 18 },
  ];

  readonly rails = [
    { id: 'mpesa', label: 'M-Pesa', meta: 'Mobile money', icon: 'fa-mobile-screen', phone: true },
    { id: 'flutterwave', label: 'Flutterwave', meta: 'Mobile + cards', icon: 'fa-bolt', phone: true },
    { id: 'afropay', label: 'AfroPay', meta: 'Pan-African wallet', icon: 'fa-wallet', phone: true },
    { id: 'card', label: 'Card', meta: 'Visa · Mastercard', icon: 'fa-credit-card', phone: false },
  ];

  readonly stepLabels = ['Details', 'Delivery', 'Payment', 'Review'];

  readonly entries = computed(() => Object.entries(this.cart()));
  readonly cartCount = computed(() => this.entries().reduce((a, [, q]) => a + q, 0));
  readonly cartSum = computed(() => this.entries().reduce((a, [id, q]) => a + PRODUCTS[id].p * q, 0));

  fmt(n: number): string {
    return fmt(n);
  }

  get dropStatus(): string {
    return this.preorderMode ? 'pre-orders open' : 'in stock';
  }

  get dropCta(): string {
    return this.preorderMode ? 'Pre-order' : 'Add to cart';
  }

  get cartCountLabel(): string {
    const count = this.cartCount();
    return count + (count === 1 ? ' item' : ' items');
  }

  get cartItems() {
    return this.entries().map(([id, q]) => {
      const p = PRODUCTS[id];
      return { id, t: p.t, m: p.m || '', qty: q, line: fmt(p.p * q), hasImg: !!p.img, img: p.img, icon: p.icon || 'fa-bag-shopping' };
    });
  }

  product(id: string): ProductDef {
    return PRODUCTS[id];
  }

  priceLabel(id: string): string {
    const p = PRODUCTS[id];
    return p.p === 0 ? 'Free' : fmt(p.p);
  }

  add(id: string, open = true): void {
    this.cart.update((c) => ({ ...c, [id]: (c[id] || 0) + 1 }));
    if (open) {
      this.cartOpen.set(true);
    }
  }

  addFromCard(event: Event, id: string): void {
    event.stopPropagation();
    this.add(id);
  }

  dec(id: string): void {
    this.cart.update((c) => {
      const cart = { ...c };
      if (cart[id] > 1) {
        cart[id] -= 1;
      } else {
        delete cart[id];
      }
      return cart;
    });
  }

  togglePlaying(n: string): void {
    this.playing.update((p) => (p === n ? '' : n));
  }

  /* ---- Product detail ---- */
  openDetail(id: string): void {
    this.detail.set(id);
    this.detailQty.set(1);
    this.detailSize.set('M');
  }

  closeDetail(): void {
    this.detail.set('');
  }

  get detailProduct(): ProductDef | null {
    const id = this.detail();
    return id ? PRODUCTS[id] : null;
  }

  get detailIsFree(): boolean {
    const p = this.detailProduct;
    return !!p && p.p === 0;
  }

  get detailCrumb(): string {
    const p = this.detailProduct;
    if (!p) {
      return '';
    }
    if (p.kind === 'apparel') {
      return 'Drop 01 — Sankofa Regalia';
    }
    if (p.kind === 'artifact') {
      return 'Repatriation Editions';
    }
    return p.imprint === 'SAU Press' ? 'The Bookshop — SAU Press' : 'The Bookshop — University Library';
  }

  get detailFund(): string {
    const p = this.detailProduct;
    if (!p) {
      return '';
    }
    if (p.kind === 'apparel') {
      return 'Print-on-demand · margin funds scholarships';
    }
    if (p.kind === 'artifact') {
      return 'Every sale funds repatriation research + the Kahigiriza Memorial';
    }
    return this.detailIsFree
      ? 'Open access — knowledge without a paywall'
      : 'Royalties fund the African PhD thesis library';
  }

  get detailTotal(): string {
    const p = this.detailProduct;
    return p ? fmt(p.p * this.detailQty()) : '';
  }

  get related() {
    const id = this.detail();
    const p = this.detailProduct;
    if (!p) {
      return [];
    }
    const free = p.p === 0;
    return Object.keys(PRODUCTS)
      .filter((k) => k !== id && PRODUCTS[k].kind === p.kind && !(p.kind === 'book' && (PRODUCTS[k].p === 0) !== free))
      .slice(0, 3)
      .map((k) => {
        const r = PRODUCTS[k];
        return { id: k, t: r.t, priceLabel: r.p === 0 ? 'Free' : fmt(r.p), hasImg: !!r.img, img: r.img, bg: r.bg || '#eef3f8' };
      });
  }

  detailInc(): void {
    this.detailQty.update((q) => q + 1);
  }

  detailDec(): void {
    this.detailQty.update((q) => Math.max(1, q - 1));
  }

  detailAdd(): void {
    const id = this.detail();
    if (!id) {
      return;
    }
    const qty = this.detailQty();
    this.cart.update((c) => ({ ...c, [id]: (c[id] || 0) + qty }));
    this.detail.set('');
    this.cartOpen.set(true);
  }

  /* ---- Checkout ---- */
  get coAllDigital(): boolean {
    return this.entries().every(
      ([id]) => !PRODUCTS[id].img || PRODUCTS[id].kind === 'book' || DIGITAL_IDS.includes(id),
    );
  }

  get activeShip(): { id: string; label: string; meta?: string; cost: number } {
    if (this.coAllDigital) {
      return { id: 'digital', label: 'Instant delivery', cost: 0 };
    }
    return this.shipOptions.find((o) => o.id === this.coShip()) || this.shipOptions[0];
  }

  get activeRail() {
    return this.rails.find((r) => r.id === this.coRail()) || this.rails[0];
  }

  get coTotal(): number {
    return this.cartSum() + this.activeShip.cost;
  }

  get coValid(): boolean {
    const step = this.coStep();
    if (step === 0) {
      return this.coName().trim().length > 1 && this.coEmail().includes('@');
    }
    if (step === 2) {
      return this.activeRail.phone ? this.coPhone().trim().length > 6 : this.coCard().trim().length > 8;
    }
    return true;
  }

  get coNextLabel(): string {
    if (this.coDone()) {
      return 'Keep shopping';
    }
    const step = this.coStep();
    if (step === 0) {
      return 'Continue to delivery';
    }
    if (step === 1) {
      return 'Continue to payment';
    }
    if (step === 2) {
      return 'Review order';
    }
    return 'Place order — ' + fmt(this.coTotal);
  }

  startCheckout(): void {
    if (this.entries().length) {
      this.cartOpen.set(false);
      this.coOpen.set(true);
      this.coStep.set(0);
      this.coDone.set(false);
    }
  }

  coNext(): void {
    if (this.coDone()) {
      this.coOpen.set(false);
      return;
    }
    if (!this.coValid) {
      return;
    }
    if (this.coStep() === 3) {
      this.coDone.set(true);
      this.cart.set({});
      this.orderNo.set('SAU-' + String(Date.now()).slice(-6));
    } else {
      this.coStep.update((s) => s + 1);
    }
  }

  coBack(): void {
    this.coStep.update((s) => Math.max(0, s - 1));
  }

  bind(target: 'coName' | 'coEmail' | 'coPlace' | 'coPhone' | 'coCard', event: Event): void {
    this[target].set((event.target as HTMLInputElement).value);
  }

  stopEvent(event: Event): void {
    event.stopPropagation();
  }
}
