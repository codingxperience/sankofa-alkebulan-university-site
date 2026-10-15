import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import { NgOptimizedImage, NgTemplateOutlet, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiClient, ApiError, newRequestId } from '../core/api/api-client';
import { LAST_ORDER_KEY } from '../core/store-session';

interface ProductDef {
  readonly t: string;
  readonly m?: string;
  readonly au?: string;
  readonly yr?: string;
  readonly p: number;
  readonly ed?: string;
  readonly img?: string;
  /** A second photograph for the product's own page, when it shows more than the card's. */
  readonly detailImg?: string;
  readonly pos?: string;
  readonly kind?: 'apparel' | 'merch' | 'artifact' | 'book' | 'marketplace';
  readonly category?: MarketplaceCategory;
  readonly sizes?: boolean;
  readonly bg?: string;
  readonly imprint?: string;
  readonly icon?: string;
  readonly desc?: string;
  readonly specs?: readonly (readonly [string, string])[];
  readonly cover?: string;
  readonly pdf?: string;
  /** Items ordered directly with the store team rather than through online checkout. */
  readonly requestOnly?: boolean;
}

type MarketplaceCategory =
  | 'electronics'
  | 'kitchen'
  | 'campus'
  | 'office'
  | 'research'
  | 'heritage'
  | 'local'
  | 'digital';

interface MarketplaceCategoryDef {
  readonly id: MarketplaceCategory;
  readonly label: string;
  readonly shortLabel: string;
  readonly intro: string;
}

const SIZES = ['S', 'M', 'L', 'XL', '2XL'] as const;

const PRODUCTS: Record<string, ProductDef> = {
  'bk-research-cultures': {
    t: 'How Universities Can Build Research Cultures', au: 'Emmanuel Mihiingo Kaija', p: 0, kind: 'book', requestOnly: true, imprint: 'SAU Press',
    cover: 'assets/press/covers/how-universities-can-build-research-cultures-cover.webp',
    desc: 'Institutional transformation, intellectual infrastructure, and the future of knowledge production.',
    specs: [['Format', 'Contact SAU Press for available editions'], ['Ordering', 'Price and availability confirmed by WhatsApp'], ['Author', 'Emmanuel Mihiingo Kaija']],
  },
  'bk-republic-shadows': {
    t: 'The Republic of Shadows', au: 'Emmanuel Mihiingo Kaija', p: 0, kind: 'book', requestOnly: true, imprint: 'SAU Press',
    cover: 'assets/press/covers/the-republic-of-shadows-cover.webp',
    desc: 'A novel of power, memory, and Uganda by Emmanuel Mihiingo Kaija.',
    specs: [['Format', 'Contact SAU Press for available editions'], ['Ordering', 'Price and availability confirmed by WhatsApp'], ['Author', 'Emmanuel Mihiingo Kaija']],
  },
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
  'bag-set': {
    t: "Scholar's Bag Set", m: 'Satchel + backpack · crest on both', p: 140,
    img: 'assets/store/bag-set.jpg', pos: '50% 55%', kind: 'merch',
    desc: 'A matched pair for the working scholar: a tan satchel with a top handle and a black backpack, each carrying the university crest and Return · Restore · Reimagine.',
    specs: [['Set', 'Satchel + backpack'], ['Crest', 'Full university crest on both'], ['Motto', 'Return · Restore · Reimagine'], ['Orders', 'Pre-order · ships continent-wide']],
  },
  journal: {
    t: 'Crest Journal', m: 'Black cover · gold crest and motto', p: 24,
    img: 'assets/store/leather-journal.jpg', pos: '50% 50%', kind: 'merch',
    desc: 'A black-bound journal with the crest and the motto in gold on the cover — for lecture notes, field notes, and the ideas in between.',
    specs: [['Cover', 'Black · gold crest'], ['Motto', 'Return · Restore · Reimagine'], ['Orders', 'Pre-order · ships continent-wide']],
  },
  bottle: {
    t: 'Crest Water Bottle', m: 'Brushed metal · full-colour crest', p: 22,
    img: 'assets/store/steel-bottle.jpg', pos: '50% 50%', kind: 'merch',
    desc: 'A brushed-metal bottle carrying the full-colour crest — from the lecture hall to the field and back.',
    specs: [['Finish', 'Brushed metal'], ['Crest', 'Full-colour university crest'], ['Orders', 'Pre-order · ships continent-wide']],
  },
  cap: {
    t: 'Crest Cap', m: 'White cap · crest and motto', p: 22,
    img: 'assets/store/crest-cap.jpg', pos: '50% 50%', kind: 'merch',
    desc: 'A white cap with the university name and crest on the front panel, and Return · Restore · Reimagine beneath.',
    specs: [['Colour', 'White'], ['Front', 'Name, crest and motto'], ['Orders', 'Pre-order · ships continent-wide']],
  },
  umbrella: {
    t: 'Crest Umbrella', m: 'Cream canopy · wooden crook handle', p: 32,
    img: 'assets/store/crest-umbrella.jpg', pos: '50% 50%', kind: 'merch',
    desc: 'A full-size umbrella with a cream canopy, a wooden crook handle, and the university name, crest and motto across one panel.',
    specs: [['Canopy', 'Cream · crest panel'], ['Handle', 'Wooden crook'], ['Orders', 'Pre-order · ships continent-wide']],
  },
  varsity: {
    t: 'Varsity Jacket', m: 'Navy body · white sleeves · crest', p: 95,
    img: 'assets/store/varsity-jacket.jpg', pos: '50% 40%', kind: 'merch', sizes: true,
    desc: 'The varsity jacket in university colours: a navy body, white sleeves, a striped collar, and the crest with Return · Restore · Reimagine on the chest.',
    specs: [['Colours', 'Navy body · white sleeves'], ['Chest', 'Crest and motto'], ['Sizes', 'S to 2XL'], ['Orders', 'Pre-order · ships continent-wide']],
  },
  'athletic-shorts': {
    t: 'Sankofa Athletic Shorts', m: 'Navy · university crest', p: 0, kind: 'apparel', requestOnly: true,
    img: 'assets/store/products/sankofa-athletic-shorts.jpg', pos: '50% 50%',
    desc: 'Navy athletic shorts featuring the Sankofa Alkebulan University crest.',
    specs: [['Colour', 'Navy'], ['Detail', 'University crest'], ['Ordering', 'Confirm size, availability, and price by WhatsApp']],
  },
  'boxer-shorts': {
    t: 'Sankofa Boxer Shorts', m: 'Navy · university name and crest', p: 0, kind: 'apparel', requestOnly: true,
    img: 'assets/store/products/sankofa-boxer-shorts.jpg', pos: '50% 50%',
    desc: 'Navy boxer shorts featuring the university name and crest.',
    specs: [['Colour', 'Navy'], ['Detail', 'University name and crest'], ['Ordering', 'Confirm size, availability, and price by WhatsApp']],
  },
  'slide-sandals': {
    t: 'Sankofa Slide Sandals', m: 'Navy · university crest', p: 0, kind: 'apparel', requestOnly: true,
    img: 'assets/store/products/sankofa-slide-sandals.jpg', pos: '50% 50%',
    desc: 'Navy slide sandals featuring the Sankofa Alkebulan University crest.',
    specs: [['Colour', 'Navy'], ['Detail', 'University crest'], ['Ordering', 'Confirm size, availability, and price by WhatsApp']],
  },
  sneakers: {
    t: 'Sankofa Sneakers', m: 'Navy · university crest', p: 0, kind: 'apparel', requestOnly: true,
    img: 'assets/store/products/sankofa-sneakers-angle-one.jpg',
    detailImg: 'assets/store/products/sankofa-sneakers-angle-two.jpg', pos: '50% 50%',
    desc: 'Navy sneakers featuring the Sankofa Alkebulan University crest.',
    specs: [['Colour', 'Navy with white sole'], ['Detail', 'University crest'], ['Ordering', 'Confirm size, availability, and price by WhatsApp']],
  },
  bracelet: {
    t: 'Crest Bracelet', m: 'Braided band · metal crest plate', p: 18,
    img: 'assets/store/crest-bracelet.jpg', detailImg: 'assets/store/crest-bracelets.jpg', pos: '50% 50%', kind: 'merch',
    desc: 'The full crest on a small metal plate, set on a braided band — the university, worn every day.',
    specs: [['Band', 'Braided'], ['Plate', 'Metal · full-colour crest'], ['Orders', 'Pre-order · ships continent-wide']],
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
  'bk-black-futures': {
    t: 'Black Futures and the Fourth Industrial Revolution', au: 'Emmanuel Mihiingo Kaija', yr: 'SAU Press · 2026', p: 0, kind: 'book', imprint: 'SAU Press',
    cover: 'assets/press/covers/black-futures-fourth-industrial-revolution.png',
    pdf: 'assets/press/publications/black-futures-fourth-industrial-revolution.pdf',
    desc: 'The Liberation Publishing flagship essay — reimagining Black agency in the age of artificial intelligence, from data sovereignty and algorithmic bias to African-authored futures for the Fourth Industrial Revolution.',
    specs: [['Format', 'Free PDF · open access'], ['Edition', 'English · 2026'], ['Imprint', 'SAU Press · Liberation Publishing'], ['Author', 'Emmanuel Mihiingo Kaija']],
  },
  'bk-black-futures-el': {
    t: 'Black Futures and the Fourth Industrial Revolution — Greek edition', au: 'Emmanuel Mihiingo Kaija', yr: 'SAU Press · 2026', p: 0, kind: 'book', imprint: 'SAU Press',
    cover: 'assets/press/covers/black-futures-fourth-industrial-revolution-el.png',
    pdf: 'assets/press/publications/black-futures-fourth-industrial-revolution-el.pdf',
    desc: 'Μαύρα Μέλλοντα και η Τέταρτη Βιομηχανική Επανάσταση — the Greek translation of the Black Agency essay, carrying the argument on African data sovereignty and AI futures to a wider readership.',
    specs: [['Format', 'Free PDF · open access'], ['Edition', 'Greek translation · 2026'], ['Imprint', 'SAU Press · Liberation Publishing'], ['Author', 'Emmanuel Mihiingo Kaija']],
  },
  'bk-quiet-skin': {
    t: 'Beneath the Quiet Skin', au: 'Emmanuel Mihiingo Kaija', yr: 'SAU Press · 2026', p: 22, kind: 'book', imprint: 'SAU Press',
    cover: 'assets/press/covers/beneath-the-quiet-skin.webp',
    desc: 'Understanding Mental Health in African Contexts — an exploration of mind, spirit, and society in Africa, holding indigenous healing traditions and clinical psychology in one frame.',
    specs: [['Format', 'PDF edition'], ['Field', 'Mental health · African contexts'], ['Imprint', 'SAU Press · Liberation Publishing'], ['Author', 'Emmanuel Mihiingo Kaija']],
  },
  'bk-pan-african': {
    t: 'Pan-African Strategic Mobilization in the 21st Century', au: 'Emmanuel Mihiingo Kaija', yr: 'SAU Press · 2026', p: 22, kind: 'book', imprint: 'SAU Press',
    cover: 'assets/press/covers/pan-african-mobilization.webp',
    desc: 'Youth power and the future of continental unity — a 355-page strategy for Pan-African mobilization in a fragmented global order, spanning history, theory, governance, and future pathways.',
    specs: [['Format', 'PDF edition'], ['Extent', '355 pages'], ['Imprint', 'SAU Press · Liberation Publishing'], ['Author', 'Emmanuel Mihiingo Kaija']],
  },
  'bk-next-century': {
    t: "Africa's Next Century: A Grand Strategy", au: 'Emmanuel Mihiingo Kaija', yr: 'SAU Press · 2026', p: 0, kind: 'book', imprint: 'SAU Press',
    cover: 'assets/press/covers/africas-next-century-grand-strategy.webp',
    pdf: 'assets/press/publications/africas-next-century-grand-strategy.pdf',
    desc: 'A grand strategy for prosperity, peace, and global leadership — a framework for Africa’s political, economic, scientific, security, cultural, and institutional transformation across the twenty-first century.',
    specs: [['Format', 'Free PDF · open access'], ['Field', 'Continental strategy'], ['Imprint', 'SAU Press · Liberation Publishing'], ['Author', 'Emmanuel Mihiingo Kaija']],
  },
  'bk-god-ai': {
    t: 'The God of AI: African Digital Futures', au: 'Emmanuel Mihiingo Kaija', yr: 'SAU Press · 2026', p: 18, kind: 'book', imprint: 'SAU Press',
    cover: 'assets/press/covers/god-of-ai-african-digital-futures.webp',
    desc: 'Faith, power, and machine intelligence read from the continent — a reckoning with artificial intelligence, sovereignty, and African digital futures.',
    specs: [['Format', 'Print + PDF edition'], ['Field', 'AI & digital futures'], ['Imprint', 'SAU Press · Liberation Publishing'], ['Author', 'Emmanuel Mihiingo Kaija']],
  },
  'bk-governance': {
    t: 'Reengineering Global Governance', au: 'Emmanuel Mihiingo Kaija', yr: 'SAU Press · 2026', p: 0, kind: 'book', imprint: 'SAU Press',
    cover: 'assets/press/covers/reengineering-global-governance.webp',
    pdf: 'assets/press/publications/reengineering-global-governance.pdf',
    desc: 'A data-driven reform framework for legitimacy, representation, and decision-making bottlenecks in the United Nations system — reengineering global governance for a multipolar world.',
    specs: [['Format', 'Free PDF · open access'], ['Field', 'United Nations reform'], ['Imprint', 'SAU Press · Liberation Publishing'], ['Author', 'Emmanuel Mihiingo Kaija']],
  },
  'bk-strategic-defense': {
    t: 'Strategic Defense Mobilization in Africa', au: 'Emmanuel Mihiingo Kaija', yr: 'SAU Press · 2026', p: 15, kind: 'book', imprint: 'SAU Press',
    cover: 'assets/press/covers/strategic-defense-mobilization-africa.webp',
    desc: 'Continental security on African terms — doctrine, deterrence, and the mobilization of a self-reliant strategic defense across the African Union.',
    specs: [['Format', 'Print + PDF edition'], ['Field', 'Security & strategy'], ['Imprint', 'SAU Press · Liberation Publishing'], ['Author', 'Emmanuel Mihiingo Kaija']],
  },
  'bk-ngugi': {
    t: 'Decolonising the Mind', au: 'Ngũgĩ wa Thiong’o', yr: '1986 · Library edition', p: 0, kind: 'book', imprint: 'University Library',
    cover: 'assets/press/covers/decolonising-the-mind.png',
    desc: 'The classic on language and cultural liberation — required reading across SAU. Held in the University Library as a free, open-access PDF.',
    specs: [['Format', 'Free PDF · University Library'], ['Access', 'Open to all readers'], ['Shelf', 'Language & liberation'], ['Status', 'Required reading · Year One']],
  },
  'bk-iliffe': {
    t: 'Africans: The History of a Continent', au: 'John Iliffe', yr: 'Library edition', p: 0, kind: 'book', imprint: 'University Library',
    cover: 'assets/press/covers/africans-history-continent.png',
    desc: 'A single-volume history of the continent, from human origins to the present — held free in the University Library collection.',
    specs: [['Format', 'Free PDF · University Library'], ['Access', 'Open to all readers'], ['Shelf', 'Continental history'], ['Status', 'Core survey text']],
  },
  'bk-aehn': {
    t: 'The History of African Development', au: 'African Economic History Network', yr: 'Open textbook · 2023', p: 0, kind: 'book', imprint: 'University Library',
    cover: 'assets/press/covers/history-african-development.png',
    desc: 'The AEHN open textbook — African economic history written for African classrooms, updated 2023. Free in the University Library.',
    specs: [['Format', 'Free PDF · open textbook'], ['Access', 'Open to all readers'], ['Shelf', 'Economic history'], ['Edition', 'March 2023']],
  },
  'bk-fondad': {
    t: 'Africa in the World Economy', au: 'Fondad · The Hague', yr: 'Library edition', p: 0, kind: 'book', imprint: 'University Library',
    cover: 'assets/press/covers/africa-in-world-economy.png',
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
  'market-laptop': {
    t: 'Learning Laptop', m: 'Everyday study and office configurations', p: 520, kind: 'marketplace', category: 'electronics', requestOnly: true,
    img: 'assets/store/marketplace/laptop-workspace.jpg', pos: '50% 50%', icon: 'fa-laptop',
    desc: 'A practical starting point for a study or office laptop. Tell the store team your preferred memory, storage, screen size, and operating system so they can source a suitable configuration.',
    specs: [['Estimate', 'USD guide price; model dependent'], ['Configuration', 'Confirm processor, memory, storage, and warranty'], ['Ordering', 'Supplier, availability, and delivery confirmed by WhatsApp']],
  },
  'market-tablet': {
    t: 'Study Tablet', m: 'Reading, notes, and online learning', p: 250, kind: 'marketplace', category: 'electronics', requestOnly: true,
    img: 'assets/store/marketplace/tablet.jpg', pos: '50% 50%', icon: 'fa-tablet-screen-button',
    desc: 'A tablet option for digital reading, class notes, and online learning. Confirm the operating system, storage, accessories, and warranty before ordering.',
    specs: [['Estimate', 'USD guide price; model dependent'], ['Options', 'Confirm size, storage, pen, and keyboard support'], ['Ordering', 'Supplier, availability, and delivery confirmed by WhatsApp']],
  },
  'market-smartphone': {
    t: 'Smartphone', m: 'Android and iOS options by request', p: 190, kind: 'marketplace', category: 'electronics', requestOnly: true,
    img: 'assets/store/marketplace/android-phone.jpg', pos: '50% 50%', icon: 'fa-mobile-screen-button',
    desc: 'A phone listing for sourcing across entry, mid-range, and premium models. Share a preferred brand, storage size, and budget for a current supplier quote.',
    specs: [['Estimate', 'USD guide price; model dependent'], ['Options', 'Android and iOS models by request'], ['Ordering', 'Confirm model, condition, warranty, and delivery']],
  },
  'market-power-kit': {
    t: 'Charging & Power Kit', m: 'Power bank, wall charger, and cable options', p: 24, kind: 'marketplace', category: 'electronics', requestOnly: true,
    img: 'assets/store/marketplace/power-bank.jpg', pos: '50% 50%', icon: 'fa-battery-full',
    desc: 'A small charging essentials range for phones and tablets. Capacity, cable type, charging speed, and compatibility are confirmed before purchase.',
    specs: [['Estimate', 'USD guide price; capacity dependent'], ['Options', 'Power banks, chargers, USB-C and Lightning cables'], ['Ordering', 'Confirm capacity, compatibility, and availability']],
  },
  'market-computer-kit': {
    t: 'Computer Essentials Kit', m: 'Keyboard, mouse, flash drive, and cables', p: 32, kind: 'marketplace', category: 'electronics', requestOnly: true,
    img: 'assets/store/marketplace/wireless-keyboard-mouse.jpg', pos: '50% 50%', icon: 'fa-keyboard',
    desc: 'A practical bundle of everyday computer accessories. The exact keyboard layout, mouse connection, storage capacity, and cable types are selected with the buyer.',
    specs: [['Estimate', 'USD guide price; bundle contents vary'], ['Includes', 'Keyboard and mouse; storage and cables on request'], ['Ordering', 'Confirm compatible devices and current supplier price']],
  },
  'market-headphones': {
    t: 'Headphones & Headsets', m: 'Wired and wireless options', p: 28, kind: 'marketplace', category: 'electronics', requestOnly: true,
    img: 'assets/store/marketplace/wireless-headphones.jpg', pos: '50% 50%', icon: 'fa-headphones',
    desc: 'Audio options for study, calls, and media work. Ask for a model matched to your device, microphone needs, and preferred connection.',
    specs: [['Estimate', 'USD guide price; model dependent'], ['Options', 'Wired, Bluetooth, microphone, and noise-isolating models'], ['Ordering', 'Confirm compatibility, warranty, and availability']],
  },
  'market-wifi-router': {
    t: 'Wi-Fi Router', m: 'Home, office, and mobile data options', p: 48, kind: 'marketplace', category: 'electronics', requestOnly: true,
    img: 'assets/store/marketplace/wifi-router.jpg', pos: '50% 50%', icon: 'fa-wifi',
    desc: 'Connectivity devices for home study, small offices, and campus work. Tell us your network provider and coverage needs before a model is quoted.',
    specs: [['Estimate', 'USD guide price; network dependent'], ['Options', 'Wi-Fi routers and mobile hotspots'], ['Ordering', 'Confirm network compatibility, data plan, and availability']],
  },
  'market-projector': {
    t: 'Presentation & Projection Equipment', m: 'Projectors, speakers, and meeting accessories', p: 340, kind: 'marketplace', category: 'electronics', requestOnly: true,
    img: 'assets/store/marketplace/presentation-projector.jpg', pos: '50% 50%', icon: 'fa-video',
    desc: 'Presentation equipment for lecture rooms, workshops, and small events. Ask for a quote based on room size, brightness, ports, and any sound equipment needed.',
    specs: [['Estimate', 'USD guide price; specification dependent'], ['Options', 'Projectors, speakers, screens, webcams, and microphones'], ['Ordering', 'Confirm room requirements and warranty before purchase']],
  },
  'market-kettle': {
    t: 'Electric Kettle', m: 'Everyday kitchen and residence essential', p: 26, kind: 'marketplace', category: 'kitchen', requestOnly: true,
    img: 'assets/store/marketplace/electric-kettle.jpg', pos: '50% 50%', icon: 'fa-mug-hot',
    desc: 'A basic countertop kettle for student rooms, staff kitchens, and homes. Capacity, voltage, material, and warranty vary by supplier.',
    specs: [['Estimate', 'USD guide price; capacity dependent'], ['Options', 'Compact and family-size models'], ['Ordering', 'Confirm voltage, capacity, stock, and delivery']],
  },
  'market-blender': {
    t: 'Kitchen Blender', m: 'Home food preparation', p: 42, kind: 'marketplace', category: 'kitchen', requestOnly: true,
    img: 'assets/store/marketplace/blender-option-three.jpg', pos: '50% 50%', icon: 'fa-blender',
    desc: 'A blender listing for smoothies, sauces, and everyday food preparation. Jar size, power, attachments, and warranty should be confirmed for the selected model.',
    specs: [['Estimate', 'USD guide price; power and capacity dependent'], ['Options', 'Compact and family-size models'], ['Ordering', 'Confirm accessories, warranty, and availability']],
  },
  'market-rice-cooker': {
    t: 'Rice Cooker', m: 'Simple cooking for shared and family kitchens', p: 36, kind: 'marketplace', category: 'kitchen', requestOnly: true,
    img: 'assets/store/marketplace/rice-cooker.jpg', pos: '50% 50%', icon: 'fa-bowl-rice',
    desc: 'A countertop rice cooker option for student accommodation and home kitchens. Capacity, power, and included accessories vary by model.',
    specs: [['Estimate', 'USD guide price; capacity dependent'], ['Options', 'Compact, family-size, and multi-function models'], ['Ordering', 'Confirm voltage, warranty, and delivery']],
  },
  'market-cookware': {
    t: 'Cookware Set', m: 'Saucepans, frying pans, and utensils', p: 68, kind: 'marketplace', category: 'kitchen', requestOnly: true,
    img: 'assets/store/marketplace/cookware.jpg', pos: '50% 50%', icon: 'fa-kitchen-set',
    desc: 'A practical cookware range for residence kitchens and households. Set size, materials, and included cooking utensils are confirmed with the store team.',
    specs: [['Estimate', 'USD guide price; set dependent'], ['Options', 'Saucepans, frying pans, and cooking utensils'], ['Ordering', 'Confirm material, set size, and availability']],
  },
  'market-kitchen-set': {
    t: 'Kitchen Starter Set', m: 'Tableware, cutlery, and food containers', p: 34, kind: 'marketplace', category: 'kitchen', requestOnly: true,
    img: 'assets/store/marketplace/kitchen-appliances.jpg', pos: '50% 50%', icon: 'fa-utensils',
    desc: 'A useful starter selection for shared kitchens: plates, cups, cutlery, and food containers. Buyers can request a set sized for one person, a residence room, or a household.',
    specs: [['Estimate', 'USD guide price; set size dependent'], ['Options', 'Plates, cups, cutlery, and storage containers'], ['Ordering', 'Confirm item count, material, and current price']],
  },
  'market-home-iron': {
    t: 'Home Iron & Extension Leads', m: 'Small appliances and practical electricals', p: 28, kind: 'marketplace', category: 'kitchen', requestOnly: true,
    img: 'assets/store/marketplace/clothes-iron.jpg', pos: '50% 50%', icon: 'fa-plug',
    desc: 'A practical home utility listing for irons and approved extension leads. The selected voltage, cable rating, plug type, and safety certification are confirmed before a quote is accepted.',
    specs: [['Estimate', 'USD guide price; item dependent'], ['Options', 'Steam irons, extension leads, and small appliances'], ['Ordering', 'Confirm voltage, safety rating, and availability']],
  },
  'market-flask': {
    t: 'Thermos & Water Bottles', m: 'Reusable options for class and work', p: 18, kind: 'marketplace', category: 'kitchen', requestOnly: true,
    img: 'assets/store/marketplace/water-bottle.jpg', pos: '50% 50%', icon: 'fa-bottle-water',
    desc: 'Reusable bottles and insulated flasks for class, campus, and field work. Capacity and insulation time depend on the selected item.',
    specs: [['Estimate', 'USD guide price; capacity dependent'], ['Options', 'Water bottles, flasks, and travel mugs'], ['Ordering', 'Confirm material, size, and availability']],
  },
  'market-campus-backpack': {
    t: 'Campus Backpack', m: 'Daily carry and laptop bag options', p: 38, kind: 'marketplace', category: 'campus', requestOnly: true,
    img: 'assets/store/marketplace/campus-backpack.jpg', pos: '50% 50%', icon: 'fa-backpack',
    desc: 'Backpacks and laptop bags for commuting, lectures, and field work. Laptop compartment size, material, and pockets are confirmed before ordering.',
    specs: [['Estimate', 'USD guide price; size and material dependent'], ['Options', 'Backpacks, laptop bags, and lunch bags'], ['Ordering', 'Confirm dimensions, features, and availability']],
  },
  'market-desk-lamp': {
    t: 'Study Desk Lamp', m: 'Focused light for reading and revision', p: 22, kind: 'marketplace', category: 'campus', requestOnly: true,
    img: 'assets/store/marketplace/desk-lamp.jpg', pos: '50% 50%', icon: 'fa-lightbulb',
    desc: 'A compact study lamp option for desks and residence rooms. Buyers can ask about LED, adjustable, and rechargeable models.',
    specs: [['Estimate', 'USD guide price; model dependent'], ['Options', 'LED, adjustable, and rechargeable lamps'], ['Ordering', 'Confirm power type, features, and availability']],
  },
  'market-bedding': {
    t: 'Student Bedding Set', m: 'Basic residence and accommodation supplies', p: 48, kind: 'marketplace', category: 'campus', requestOnly: true,
    img: 'assets/store/marketplace/bedding.jpg', pos: '50% 50%', icon: 'fa-bed',
    desc: 'A basic bedding option for student accommodation. Bed size, included linen, and material are confirmed before a quote is accepted.',
    specs: [['Estimate', 'USD guide price; bed size dependent'], ['Options', 'Sheets, pillowcases, and basic bedding bundles'], ['Ordering', 'Confirm bed size, contents, and delivery']],
  },
  'market-stationery': {
    t: 'Student Stationery Bundle', m: 'Notebooks, pens, files, and planners', p: 16, kind: 'marketplace', category: 'campus', requestOnly: true,
    img: 'assets/store/marketplace/research-notebook.jpg', pos: '50% 50%', icon: 'fa-pen-ruler',
    desc: 'An affordable stationery bundle for new students or everyday study. Contents can be adjusted for course, year, or budget.',
    specs: [['Estimate', 'USD guide price; bundle contents vary'], ['Options', 'Notebooks, pens, files, planners, and folders'], ['Ordering', 'Confirm bundle contents and current price']],
  },
  'market-printer': {
    t: 'Office Printer', m: 'Printing and scanning options', p: 185, kind: 'marketplace', category: 'office', requestOnly: true,
    img: 'assets/store/marketplace/office-printer.jpg', pos: '50% 50%', icon: 'fa-print',
    desc: 'A printer listing for offices, student projects, and small departments. Print volume, colour needs, scanning, ink cost, and connectivity guide the quote.',
    specs: [['Estimate', 'USD guide price; type dependent'], ['Options', 'Inkjet, laser, print-only, and all-in-one models'], ['Ordering', 'Confirm consumables, warranty, and delivery']],
  },
  'market-office-supplies': {
    t: 'Office Stationery Pack', m: 'Paper, files, folders, and writing supplies', p: 28, kind: 'marketplace', category: 'office', requestOnly: true,
    img: 'assets/store/marketplace/student-notes.jpg', pos: '50% 50%', icon: 'fa-folder-open',
    desc: 'An adjustable office supply pack for departments, schools, NGOs, and small businesses. Bulk quantities can be quoted against a requested list.',
    specs: [['Estimate', 'USD guide price; quantities vary'], ['Options', 'Paper, files, folders, pens, and markers'], ['Ordering', 'Request a detailed quote for bulk supplies']],
  },
  'market-office-furniture': {
    t: 'Office Furniture', m: 'Chairs, desks, and storage by specification', p: 140, kind: 'marketplace', category: 'office', requestOnly: true,
    img: 'assets/store/marketplace/office-furniture.jpg', pos: '50% 50%', icon: 'fa-chair',
    desc: 'A sourcing route for office chairs, desks, and storage equipment. Dimensions, materials, delivery access, and quantity determine the final supplier quote.',
    specs: [['Estimate', 'USD guide price; item and quantity dependent'], ['Options', 'Office chairs, desks, and storage'], ['Ordering', 'Confirm dimensions, quantity, and delivery']],
  },
  'market-teaching-aids': {
    t: 'Teaching & Presentation Aids', m: 'Whiteboards, markers, and classroom tools', p: 54, kind: 'marketplace', category: 'office', requestOnly: true,
    img: 'assets/store/marketplace/whiteboard-teaching.jpg', pos: '50% 50%', icon: 'fa-chalkboard',
    desc: 'Classroom and meeting tools for teaching teams and institutions. Whiteboard sizes, mounting, markers, and other teaching aids can be quoted together.',
    specs: [['Estimate', 'USD guide price; size dependent'], ['Options', 'Whiteboards, markers, easels, and teaching aids'], ['Ordering', 'Confirm room size, quantity, and delivery']],
  },
  'market-camera': {
    t: 'Camera & Field Media Kit', m: 'Camera bodies and accessories by request', p: 390, kind: 'marketplace', category: 'research', requestOnly: true,
    img: 'assets/store/marketplace/camera-kit.jpg', pos: '50% 50%', icon: 'fa-camera',
    desc: 'A camera and media equipment range for research documentation, communications, and creative work. The store team can quote camera bodies, lenses, and a suitable kit to the brief.',
    specs: [['Estimate', 'USD guide price; kit dependent'], ['Options', 'Cameras, tripods, lighting, and accessories'], ['Ordering', 'Confirm specification, warranty, and delivery']],
  },
  'market-podcast-kit': {
    t: 'Podcast & Teaching Audio Kit', m: 'Microphones and recording accessories', p: 110, kind: 'marketplace', category: 'research', requestOnly: true,
    img: 'assets/store/marketplace/podcast-microphone.jpg', pos: '50% 50%', icon: 'fa-microphone-lines',
    desc: 'Audio tools for interviews, podcasts, online teaching, and field recording. Select USB or XLR equipment according to the recording setup.',
    specs: [['Estimate', 'USD guide price; setup dependent'], ['Options', 'Microphones, headsets, recorders, and accessories'], ['Ordering', 'Confirm device compatibility and warranty']],
  },
  'market-field-notes': {
    t: 'Field Research Notebook Set', m: 'Durable notes for interviews and site visits', p: 14, kind: 'marketplace', category: 'research', requestOnly: true,
    img: 'assets/store/marketplace/research-notebook.jpg', pos: '50% 50%', icon: 'fa-book-open',
    desc: 'A practical note-taking set for field research, interviews, and site visits. Waterproof and archival options can be requested where needed.',
    specs: [['Estimate', 'USD guide price; bundle dependent'], ['Options', 'Notebooks, pens, clipboards, and organizers'], ['Ordering', 'Confirm quantity and specifications']],
  },
  'market-creative-kit': {
    t: 'Creative & Demonstration Materials', m: 'Art, design, and educational project supplies', p: 32, kind: 'marketplace', category: 'research', requestOnly: true,
    img: 'assets/store/marketplace/creative-supplies.jpg', pos: '50% 50%', icon: 'fa-palette',
    desc: 'A request-based supply listing for drawing, design, and basic educational demonstration materials. The contents are tailored to the course, project, and suitable use case.',
    specs: [['Estimate', 'USD guide price; supply list dependent'], ['Options', 'Drawing materials, design accessories, and approved demonstration supplies'], ['Ordering', 'Share a list and intended use for a quote']],
  },
  'market-african-textile': {
    t: 'African Textile & Fabric', m: 'Prints and fabrics from African makers', p: 24, kind: 'marketplace', category: 'heritage', requestOnly: true,
    img: 'assets/store/marketplace/african-textile.jpg', pos: '50% 50%', icon: 'fa-shirt',
    desc: 'A fabric and accessory listing that can be sourced from African makers. Patterns, fabric type, length, and origin are confirmed with the supplier before purchase.',
    specs: [['Estimate', 'USD guide price; length and fabric dependent'], ['Options', 'Textiles, wraps, and accessories'], ['Ordering', 'Confirm maker, pattern, and available quantity']],
  },
  'market-woven-craft': {
    t: 'Woven Basket & Handmade Craft', m: 'Locally made home and gift pieces', p: 26, kind: 'marketplace', category: 'heritage', requestOnly: true,
    img: 'assets/store/marketplace/woven-basket.jpg', pos: '50% 50%', icon: 'fa-basket-shopping',
    desc: 'Handmade baskets and selected craft pieces sourced from local artisans and community enterprises. Each item may vary because it is individually made.',
    specs: [['Estimate', 'USD guide price; craft and size dependent'], ['Options', 'Baskets, beadwork, decor, and artisan gifts'], ['Ordering', 'Confirm maker, dimensions, and delivery']],
  },
  'market-soap': {
    t: 'Locally Made Soap & Personal Care', m: 'Everyday products from local makers', p: 9, kind: 'marketplace', category: 'local', requestOnly: true,
    img: 'assets/store/marketplace/handmade-soap.jpg', pos: '50% 50%', icon: 'fa-soap',
    desc: 'A local maker product listing for soaps and simple personal-care goods. Ingredients, skin suitability, maker, and pack size must be confirmed before order.',
    specs: [['Estimate', 'USD guide price; pack dependent'], ['Options', 'Soap and approved personal-care products'], ['Ordering', 'Confirm ingredients, maker, and availability']],
  },
  'market-local-coffee': {
    t: 'Locally Sourced Coffee', m: 'Coffee and other approved local products', p: 12, kind: 'marketplace', category: 'local', requestOnly: true,
    img: 'assets/store/marketplace/local-coffee.jpg', pos: '50% 50%', icon: 'fa-mug-saucer',
    desc: 'A listing for coffee and other locally produced goods from approved suppliers. Origin, roast, package size, and delivery options are confirmed before order.',
    specs: [['Estimate', 'USD guide price; pack dependent'], ['Options', 'Coffee and compliant locally processed products'], ['Ordering', 'Confirm origin, pack size, and current price']],
  },
  'market-editing': {
    t: 'Research Editing & Formatting', m: 'Academic documents and submission preparation', p: 25, kind: 'marketplace', category: 'digital', requestOnly: true,
    icon: 'fa-file-pen', bg: 'linear-gradient(145deg, #153c4a, #2c7580)',
    desc: 'A quotation-based service for editing and formatting research documents. Scope, turnaround, and academic integrity expectations are agreed before work begins.',
    specs: [['Estimate', 'USD guide price; document scope dependent'], ['Options', 'Formatting, proofreading, references, and layout'], ['Ordering', 'Share the document type and deadline for a quote']],
  },
  'market-web-skills': {
    t: 'Website & Digital Skills Services', m: 'Web design and practical digital support', p: 180, kind: 'marketplace', category: 'digital', requestOnly: true,
    icon: 'fa-laptop-code', bg: 'linear-gradient(145deg, #254a38, #6e9a6e)',
    desc: 'A service listing for website design and digital skills support. Scope, deliverables, ownership, and support period are confirmed in a written quote.',
    specs: [['Estimate', 'USD guide price; scope dependent'], ['Options', 'Web design, training, and digital skills support'], ['Ordering', 'Share goals, timeline, and requirements for a quote']],
  },
  'market-printing': {
    t: 'Printing, Scanning & Binding', m: 'Student, research, and office documents', p: 4, kind: 'marketplace', category: 'digital', requestOnly: true,
    icon: 'fa-copy', bg: 'linear-gradient(145deg, #4b3c2a, #ae8451)',
    desc: 'A quotation-based service for printing, scanning, and binding. Final cost depends on page count, colour, paper, and finishing.',
    specs: [['Estimate', 'USD guide price; job dependent'], ['Options', 'Printing, scanning, binding, and document preparation'], ['Ordering', 'Confirm file, quantity, finish, and pickup/delivery']],
  },
  'market-learning': {
    t: 'Short Courses & Learning Guides', m: 'Digital study resources and workshops', p: 15, kind: 'marketplace', category: 'digital', requestOnly: true,
    icon: 'fa-graduation-cap', bg: 'linear-gradient(145deg, #47375d, #9178b2)',
    desc: 'A directory for downloadable study guides and short workshops. The store team will confirm the course outline, format, dates, and any certificate details.',
    specs: [['Estimate', 'USD guide price; course dependent'], ['Options', 'Learning guides, workshops, and online short courses'], ['Ordering', 'Confirm the current programme and access details']],
  },
  'market-event-registration': {
    t: 'Event & Conference Registration', m: 'Tickets and registration by event', p: 22, kind: 'marketplace', category: 'digital', requestOnly: true,
    icon: 'fa-ticket', bg: 'linear-gradient(145deg, #4c3e2c, #b2884a)',
    desc: 'A route to event tickets and conference registration when a programme is open. The organiser, dates, venue, inclusions, and payment terms are confirmed for each event.',
    specs: [['Estimate', 'USD guide price; event dependent'], ['Options', 'Event tickets and conference registration'], ['Ordering', 'Confirm the live event and registration terms']],
  },
};

const TRACKS = [
  { name: 'I — Memory', tracks: [['01', 'Echoes of the Motherland', '3:58'], ['02', 'Drums of Our Fathers', '4:12'], ['03', 'Blood of Our Ancestors', '3:44'], ['04', 'Sons of the Soil', '4:05']] },
  { name: 'II — Disruption', tracks: [['05', 'They Stole the Drum', '3:37'], ['06', 'Concrete Horizons', '4:21'], ['07', 'The Soul of Africa', '3:52']] },
  { name: 'III — Awakening', tracks: [['08', 'Indigenous Mind Frequency', '4:44'], ['09', 'Sovereignty Code', '3:29'], ['10', 'Liberation Frequency', '4:58']] },
  { name: 'IV — Renaissance', tracks: [['11', 'Rise Africa Rise', '5:12']] },
] as const;

const DIGITAL_IDS = ['album-digital', 'museum-pass', 'language-pack', 'vault-cert', 'archive-vol1', 'career-post'];

const BAG_KEY = 'sau_store_bag_v1';

/** Price and availability as the store's database has them right now. */
interface LiveProduct {
  readonly sku: string;
  readonly status: 'AVAILABLE' | 'PREORDER' | 'SOLD_OUT';
  readonly priceCents: number;
  readonly hasSizes: boolean;
  readonly isDigital: boolean;
  readonly stockRemaining: number | null;
}

interface Catalog {
  readonly cardCheckout: boolean;
  readonly products: LiveProduct[];
}

type Fulfilment = 'PICKUP' | 'COURIER' | 'EXPRESS';
type Rail = 'MOBILE_MONEY' | 'CARD';

interface PlacedOrder {
  readonly order: { number: string; totalCents: number; currency: string };
  readonly accessKey: string;
  readonly payment: { mode: 'hosted'; url: string } | { mode: 'manual'; message: string };
  readonly confirmationEmailed: boolean;
}

const fmt = (n: number) => '$' + n.toLocaleString('en-US');

/** Slugify a track title into its audio filename stem. */
const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** Album movements with a resolved audio source per track (assets/audio/NN-title.mp3). */
const ALBUM_MOVEMENTS = TRACKS.map((mv) => ({
  name: mv.name,
  tracks: mv.tracks.map(([num, title, len]) => ({
    num,
    title,
    len,
    src: 'assets/audio/' + num + '-' + slug(title) + '.mp3',
  })),
}));

@Component({
  selector: 'app-store-page',
  imports: [RouterLink, NgTemplateOutlet, NgOptimizedImage],
  templateUrl: './store-page.component.html',
  styleUrl: './store-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StorePageComponent implements OnInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly api = inject(ApiClient);
  private audioEl?: HTMLAudioElement;

  readonly products = PRODUCTS;
  readonly sizes = SIZES;
  readonly preorderMode = true;
  readonly albumMovements = ALBUM_MOVEMENTS;
  readonly storeContacts = [
    { name: 'Mrs. Vique Oceans', cardName: 'Mrs. Vique', phone: '256753617061', displayPhone: '+256 753 617061' },
    { name: 'Emmanuel', cardName: 'Emmanuel', phone: '256765871126', displayPhone: '+256 765 871126' },
  ] as const;

  /** The bag, keyed by product id — or `id|size` for clothing, so two sizes are two lines. */
  readonly cart = signal<Record<string, number>>({});
  readonly cartOpen = signal(false);
  readonly playing = signal('');
  readonly detail = signal('');
  readonly detailQty = signal(1);
  readonly detailSize = signal('M');

  readonly live = signal<Record<string, LiveProduct>>({});
  readonly cardCheckout = signal(false);

  readonly coOpen = signal(false);
  readonly coStep = signal(0);
  readonly coName = signal('');
  readonly coEmail = signal('');
  readonly coPhone = signal('');
  readonly coAddress = signal('');
  readonly coWebsite = signal('');
  readonly coShip = signal<Fulfilment>('PICKUP');
  readonly coRail = signal<Rail>('MOBILE_MONEY');
  readonly coSending = signal(false);
  readonly coError = signal<ApiError | null>(null);
  readonly coResult = signal<PlacedOrder | null>(null);
  private coRequestId = newRequestId();

  readonly regaliaIds = ['tee-navy', 'tee-colors', 'hoodie', 'scarf', 'tunic', 'gown', 'suit', 'robe'];
  readonly collectionIds = ['bag-set', 'journal', 'bottle', 'cap', 'umbrella', 'varsity', 'bracelet', 'athletic-shorts', 'boxer-shorts', 'slide-sandals', 'sneakers'];
  readonly bookIds = ['bk-research-cultures', 'bk-republic-shadows', 'bk-black-futures', 'bk-black-futures-el', 'bk-next-century', 'bk-governance', 'bk-quiet-skin', 'bk-pan-african', 'bk-god-ai', 'bk-strategic-defense', 'bk-ngugi', 'bk-iliffe', 'bk-aehn', 'bk-fondad'];
  readonly artifactIds = ['cross', 'benin', 'ashanti', 'kongo', 'nok'];
  readonly marketplaceCategories: readonly MarketplaceCategoryDef[] = [
    { id: 'electronics', label: 'Electronics & digital learning', shortLabel: 'Electronics', intro: 'Devices and practical tools for learning, teaching, and work.' },
    { id: 'kitchen', label: 'Kitchenware & home equipment', shortLabel: 'Kitchen & home', intro: 'Useful equipment for student residences, staff kitchens, and households.' },
    { id: 'campus', label: 'Student & campus essentials', shortLabel: 'Campus essentials', intro: 'Simple, useful goods for everyday campus life.' },
    { id: 'office', label: 'Office & institutional supplies', shortLabel: 'Office supplies', intro: 'Supply options for departments, schools, NGOs, and small organisations.' },
    { id: 'research', label: 'Research, media & creative equipment', shortLabel: 'Research & media', intro: 'Tools for field research, documentation, creative work, and online teaching.' },
    { id: 'heritage', label: 'African heritage & cultural products', shortLabel: 'African heritage', intro: 'A route to locally made textiles, craft, and cultural goods.' },
    { id: 'local', label: 'Local enterprise & everyday products', shortLabel: 'Local makers', intro: 'Everyday products sourced from local makers and approved suppliers.' },
    { id: 'digital', label: 'Digital products & services', shortLabel: 'Digital services', intro: 'Learning, research, document, and digital support services by inquiry.' },
  ];
  readonly marketplaceFilter = signal<'all' | MarketplaceCategory>('all');
  readonly marketplaceIdsCount = Object.values(PRODUCTS).filter((product) => product.kind === 'marketplace').length;
  readonly visibleMarketplaceIds = computed(() => {
    const category = this.marketplaceFilter();
    return Object.entries(PRODUCTS)
      .filter(([, product]) => product.kind === 'marketplace' && (category === 'all' || product.category === category))
      .map(([id]) => id);
  });
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

  /** Mirrors the API's delivery prices; the API charges what it holds, not what this list says. */
  readonly shipOptions: ReadonlyArray<{ id: Fulfilment; label: string; meta: string; cost: number }> = [
    { id: 'PICKUP', label: 'Campus pickup — Mbarara', meta: 'Ready in 2 days · bring student ID', cost: 0 },
    { id: 'COURIER', label: 'Continental courier', meta: '3–7 days · 54 states', cost: 6 },
    { id: 'EXPRESS', label: 'Diaspora express', meta: '5–10 days · worldwide', cost: 18 },
  ];

  readonly rails = computed(() => [
    { id: 'MOBILE_MONEY' as Rail, label: 'Mobile money', meta: 'M-Pesa · MTN · Airtel', icon: 'fa-mobile-screen', phone: true },
    {
      id: 'CARD' as Rail,
      label: 'Card',
      meta: this.cardCheckout() ? 'Visa · Mastercard — on a secure Flutterwave page' : 'Visa · Mastercard — secure payment link by email',
      icon: 'fa-credit-card',
      phone: false,
    },
  ]);

  readonly stepLabels = ['Details', 'Delivery', 'Payment', 'Review'];

  readonly entries = computed(() => Object.entries(this.cart()));
  readonly cartCount = computed(() => this.entries().reduce((a, [, q]) => a + q, 0));
  readonly cartSum = computed(() => this.entries().reduce((a, [key, q]) => a + this.price(this.idOf(key)) * q, 0));

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    try {
      const saved = JSON.parse(localStorage.getItem(BAG_KEY) || '{}') as Record<string, number>;
      // A book that has since become free to read cannot be ordered, so it leaves the bag.
      const valid = Object.entries(saved).filter(([key, qty]) => {
        const product = PRODUCTS[this.idOf(key)];
        return product?.p && !product.requestOnly && Number.isInteger(qty) && qty > 0;
      });
      this.cart.set(Object.fromEntries(valid));
    } catch {
      /* a corrupt bag is simply an empty bag */
    }
    void this.loadCatalog();
  }

  private async loadCatalog(): Promise<void> {
    try {
      const catalog = await this.api.get<Catalog>('/store/catalog');
      this.live.set(Object.fromEntries(catalog.products.map((p) => [p.sku, p])));
      this.cardCheckout.set(catalog.cardCheckout);
    } catch {
      // The storefront still shows its printed prices; checkout will confirm the real ones.
    }
  }

  private saveBag(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    try {
      localStorage.setItem(BAG_KEY, JSON.stringify(this.cart()));
    } catch {
      /* storage may be unavailable */
    }
  }

  private idOf(key: string): string {
    return key.split('|')[0];
  }

  private sizeOf(key: string): string | undefined {
    return key.split('|')[1];
  }

  /** Dollars, from the live catalogue when it has loaded. */
  price(id: string): number {
    const live = this.live()[id];
    return live ? live.priceCents / 100 : PRODUCTS[id].p;
  }

  isSoldOut(id: string): boolean {
    return this.live()[id]?.status === 'SOLD_OUT';
  }

  /** "Only 3 left" for limited editions running low; nothing otherwise. */
  stockNote(id: string): string {
    const live = this.live()[id];
    if (!live) return '';
    if (live.status === 'SOLD_OUT') return 'Sold out';
    if (live.stockRemaining !== null && live.stockRemaining <= 10) return `Only ${live.stockRemaining} left`;
    return '';
  }

  fmt(n: number): string {
    return fmt(n);
  }

  get dropStatus(): string {
    return this.preorderMode ? 'pre-orders open' : 'in stock';
  }

  get dropCta(): string {
    return this.preorderMode ? 'Pre-order' : 'Add to cart';
  }

  /** The Campus Collection follows each product's status: pre-order until staff mark it in stock. */
  collectionCta(id: string): string {
    const status = this.live()[id]?.status;
    return !status || status === 'PREORDER' ? 'Pre-order' : 'Add to cart';
  }

  get cartCountLabel(): string {
    const count = this.cartCount();
    return count + (count === 1 ? ' item' : ' items');
  }

  readonly marketplaceFilterIntro = computed(() => {
    const active = this.marketplaceFilter();
    return this.marketplaceCategories.find((category) => category.id === active)?.intro || '';
  });

  get cartItems() {
    return this.entries().map(([key, q]) => {
      const id = this.idOf(key);
      const size = this.sizeOf(key);
      const p = PRODUCTS[id];
      const meta = size ? `Size ${size}${p.m ? ' · ' + p.m : ''}` : p.m || '';
      return { key, id, size, t: p.t, m: meta, qty: q, line: fmt(this.price(id) * q), hasImg: !!p.img, img: p.img, icon: p.icon || 'fa-bag-shopping' };
    });
  }

  product(id: string): ProductDef {
    return PRODUCTS[id];
  }

  priceLabel(id: string): string {
    if (PRODUCTS[id].requestOnly) {
      return PRODUCTS[id].p > 0 ? `Est. ${fmt(PRODUCTS[id].p)}` : 'Price on request';
    }
    const price = this.price(id);
    return price === 0 ? 'Free' : fmt(price);
  }

  isRequestOnly(id: string): boolean {
    return PRODUCTS[id]?.requestOnly === true;
  }

  showWhatsapp(id: string): boolean {
    return !!PRODUCTS[id];
  }

  whatsappHref(id: string, name: string, phone: string): string {
    const product = PRODUCTS[id];
    const title = product?.t || 'this item';
    const request = product?.kind === 'marketplace'
      ? 'Please confirm the current price, exact model or specification, supplier availability, and delivery options.'
      : 'Please share the price and availability.';
    const message = `Hello ${name}, I am interested in ${title}. ${request}`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  }

  /** Adds one of a bag line. Clothing needs a size, so it opens the product to choose one. */
  add(key: string, open = true): void {
    const id = this.idOf(key);
    if (PRODUCTS[id].requestOnly || this.isSoldOut(id)) {
      return;
    }
    if (PRODUCTS[id].sizes && !this.sizeOf(key)) {
      this.openDetail(id);
      return;
    }
    this.cart.update((c) => ({ ...c, [key]: (c[key] || 0) + 1 }));
    this.saveBag();
    if (open) {
      this.cartOpen.set(true);
    }
  }

  addFromCard(event: Event, id: string): void {
    event.stopPropagation();
    this.add(id);
  }

  dec(key: string): void {
    this.cart.update((c) => {
      const cart = { ...c };
      if (cart[key] > 1) {
        cart[key] -= 1;
      } else {
        delete cart[key];
      }
      return cart;
    });
    this.saveBag();
  }

  /** Play a 45-second sample of a track (or pause it if already playing). */
  playTrack(num: string, src: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    if (this.playing() === num) {
      this.audioEl?.pause();
      this.playing.set('');
      return;
    }
    if (!this.audioEl) {
      this.audioEl = new Audio();
      this.audioEl.preload = 'none';
      this.audioEl.addEventListener('ended', () => this.playing.set(''));
      this.audioEl.addEventListener('error', () => this.playing.set(''));
      // Keep it to a sample: stop after ~45 seconds.
      this.audioEl.addEventListener('timeupdate', () => {
        if (this.audioEl && this.audioEl.currentTime >= 45) {
          this.audioEl.pause();
          this.playing.set('');
        }
      });
    }
    this.audioEl.src = src;
    this.audioEl.currentTime = 0;
    this.playing.set(num);
    this.audioEl.play().catch(() => this.playing.set(''));
  }

  ngOnDestroy(): void {
    this.audioEl?.pause();
    this.audioEl = undefined;
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
    const id = this.detail();
    return !!id && !PRODUCTS[id].requestOnly && this.price(id) === 0;
  }

  get detailCrumb(): string {
    const p = this.detailProduct;
    if (!p) {
      return '';
    }
    if (p.requestOnly) {
      if (p.kind === 'marketplace' && p.category) {
        return this.marketplaceCategories.find((category) => category.id === p.category)?.label || 'Store Marketplace';
      }
      return p.kind === 'book' ? 'The Bookshop — SAU Press' : 'Campus Collection · WhatsApp orders';
    }
    if (p.kind === 'apparel') {
      return 'Drop 01 — Sankofa Regalia';
    }
    if (p.kind === 'merch') {
      return 'Campus Collection';
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
    if (p.requestOnly) {
      if (p.kind === 'marketplace') {
        return 'Indicative USD estimate · confirm exact item, supplier, availability, and delivery on WhatsApp';
      }
      return 'Price and availability are confirmed directly with the store team';
    }
    if (p.kind === 'apparel') {
      return 'Print-on-demand · margin funds scholarships';
    }
    if (p.kind === 'merch') {
      return 'Made to order · margin funds scholarships';
    }
    if (p.kind === 'artifact') {
      return 'Every sale funds repatriation research + the Kahigiriza Memorial';
    }
    return this.detailIsFree
      ? 'Open access — knowledge without a paywall'
      : 'Royalties fund the African PhD thesis library';
  }

  get detailTotal(): string {
    const id = this.detail();
    return id ? fmt(this.price(id) * this.detailQty()) : '';
  }

  get related() {
    const id = this.detail();
    const p = this.detailProduct;
    if (!p) {
      return [];
    }
    const free = p.p === 0 && !p.requestOnly;
    return Object.keys(PRODUCTS)
      .filter((k) => k !== id && PRODUCTS[k].kind === p.kind && (p.kind !== 'marketplace' || PRODUCTS[k].category === p.category) && !(p.kind === 'book' && (PRODUCTS[k].p === 0 && !PRODUCTS[k].requestOnly) !== free))
      .slice(0, 3)
      .map((k) => {
        const r = PRODUCTS[k];
        return { id: k, t: r.t, priceLabel: this.priceLabel(k), hasImg: !!r.img, img: r.img, bg: r.bg || '#eef3f8' };
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
    if (!id || PRODUCTS[id].requestOnly || this.isSoldOut(id)) {
      return;
    }
    const key = PRODUCTS[id].sizes ? `${id}|${this.detailSize()}` : id;
    const qty = this.detailQty();
    this.cart.update((c) => ({ ...c, [key]: (c[key] || 0) + qty }));
    this.saveBag();
    this.detail.set('');
    this.cartOpen.set(true);
  }

  /* ---- Checkout ---- */
  get coAllDigital(): boolean {
    return this.entries().every(([key]) => {
      const id = this.idOf(key);
      const live = this.live()[id];
      if (live) return live.isDigital;
      const p = PRODUCTS[id];
      return !p.img || p.kind === 'book' || DIGITAL_IDS.includes(id);
    });
  }

  get activeShip(): { id: string; label: string; meta?: string; cost: number } {
    if (this.coAllDigital) {
      return { id: 'DIGITAL', label: 'Delivered by email', cost: 0 };
    }
    return this.shipOptions.find((o) => o.id === this.coShip()) || this.shipOptions[0];
  }

  get activeRail() {
    return this.rails().find((r) => r.id === this.coRail()) || this.rails()[0];
  }

  get needsAddress(): boolean {
    return !this.coAllDigital && (this.coShip() === 'COURIER' || this.coShip() === 'EXPRESS');
  }

  get coTotal(): number {
    return this.cartSum() + this.activeShip.cost;
  }

  get coValid(): boolean {
    const step = this.coStep();
    if (step === 0) {
      return this.coName().trim().length > 1 && /.+@.+\..+/.test(this.coEmail().trim());
    }
    if (step === 1) {
      return !this.needsAddress || this.coAddress().trim().length >= 5;
    }
    if (step === 2) {
      return !this.activeRail.phone || this.coPhone().replace(/\D/g, '').length >= 7;
    }
    return true;
  }

  get coNextLabel(): string {
    if (this.coResult()) {
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
    return this.coSending() ? 'Placing order…' : 'Place order — ' + fmt(this.coTotal);
  }

  startCheckout(): void {
    if (this.entries().length) {
      this.cartOpen.set(false);
      this.coOpen.set(true);
      this.coStep.set(0);
      this.coResult.set(null);
      this.coError.set(null);
    }
  }

  async coNext(): Promise<void> {
    if (this.coResult()) {
      this.coOpen.set(false);
      return;
    }
    if (!this.coValid || this.coSending()) {
      return;
    }
    if (this.coStep() < 3) {
      this.coStep.update((s) => s + 1);
      return;
    }
    await this.placeOrder();
  }

  private async placeOrder(): Promise<void> {
    this.coSending.set(true);
    this.coError.set(null);
    try {
      const placed = await this.api.post<PlacedOrder>('/store/orders', {
        items: this.entries().map(([key, quantity]) => ({ sku: this.idOf(key), size: this.sizeOf(key), quantity })),
        customer: {
          name: this.coName(),
          email: this.coEmail(),
          phone: this.coPhone(),
          address: this.needsAddress ? this.coAddress() : '',
        },
        fulfilment: this.coAllDigital ? 'DIGITAL' : this.coShip(),
        rail: this.coRail(),
        website: this.coWebsite(),
        clientRequestId: this.coRequestId,
      });
      this.coResult.set(placed);
      this.cart.set({});
      this.saveBag();
      this.coRequestId = newRequestId();
      if (isPlatformBrowser(this.platformId)) {
        // Lets the order page open this order after a trip to the payment page and back.
        sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify({ number: placed.order.number, key: placed.accessKey }));
      }
    } catch (error) {
      const apiError = ApiError.from(error);
      this.coError.set(apiError);
      if (['sold_out', 'insufficient_stock', 'unknown_product'].includes(apiError.code)) {
        void this.loadCatalog();
      }
    } finally {
      this.coSending.set(false);
    }
  }

  coBack(): void {
    this.coError.set(null);
    this.coStep.update((s) => Math.max(0, s - 1));
  }

  bind(target: 'coName' | 'coEmail' | 'coPhone' | 'coAddress' | 'coWebsite', event: Event): void {
    this[target].set((event.target as HTMLInputElement).value);
  }

  stopEvent(event: Event): void {
    event.stopPropagation();
  }
}
