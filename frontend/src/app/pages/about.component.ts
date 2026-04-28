import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';

interface MissionCard {
  title: string;
  text: string;
}

interface CoreValue {
  title: string;
  description: string;
}

interface PhilosophyItem {
  title: string;
  summary: string;
  details: string;
}

interface GovernanceCard {
  id: string;
  title: string;
  description: string;
  people?: string[];
}

interface HighlightItem {
  title: string;
  description: string;
}

@Component({
  selector: 'app-about',
  imports: [NgOptimizedImage, RouterLink],
  template: `
    <div class="about-page">
      <section class="about-hero" aria-labelledby="about-title">
        <img
          class="about-hero__image"
          ngSrc="/assets/hero/hero-campus-source.jpg"
          width="5184"
          height="3456"
          sizes="100vw"
          alt=""
          aria-hidden="true"
          priority
        />
        <div class="about-hero__overlay"></div>
        <div class="container about-hero__content">
          <p class="about-hero__eyebrow">Sankofa Alkebulan University</p>
          <h1 id="about-title">About</h1>
          <nav class="breadcrumb" aria-label="Breadcrumb">
            <a routerLink="/home">Home</a>
            <span aria-hidden="true">/</span>
            <span>About</span>
          </nav>
        </div>
      </section>

      <section class="about-section about-intro" id="about-sankofa">
        <div class="container">
          <header class="section-heading section-heading--center">
            <p class="section-kicker">About Us</p>
            <h2>Welcome Message</h2>
          </header>
          <div class="intro-grid">
            <div class="intro-copy">
              <p>
                Sankofa Alkebulan University is an independent intellectual and educational initiative dedicated to
                advancing African knowledge systems, critical scholarship, and transformative research.
              </p>
              <p>
                Founded on the Akan principle of Sankofa, meaning "to go back and retrieve what has been lost," we
                believe societies must draw wisdom from their past to build a stronger and more enlightened future.
              </p>
              <p>
                We cultivate a scholarly environment where African history, philosophy, spirituality, governance
                traditions, and indigenous knowledge are studied with intellectual rigor and dignity. Our
                multidisciplinary research bridges theology, philosophy, social sciences, political analysis, and
                cultural studies to address contemporary African realities.
              </p>
              <p>
                Sankofa Alkebulan University also nurtures a community of thinkers committed to ethical leadership,
                intellectual independence, and public engagement that informs policy, social transformation, and
                cultural renewal.
              </p>
            </div>
            <div class="intro-media">
              <div class="video-card" role="presentation">
                <img
                  class="video-card__image"
                  ngSrc="/wp-content/uploads/2025/10/sankofa_hero_big.jpg"
                  width="1080"
                  height="720"
                  sizes="(max-width: 900px) 100vw, 32vw"
                  alt="Sankofa Alkebulan University lecture series"
                />
                <button type="button" class="video-card__play" aria-label="Play welcome message video"></button>
                <span class="video-card__label">Welcome from our Founder and Chancellor</span>
              </div>
            </div>
          </div>
          <figure class="intro-quote">
            <blockquote>Knowledge must serve both truth and human flourishing.</blockquote>
            <figcaption>Sankofa Alkebulan University Charter</figcaption>
          </figure>
        </div>
      </section>

      <section class="about-section about-history" id="history">
        <div class="container">
          <header class="section-heading section-heading--center">
            <p class="section-kicker">Our Story</p>
            <h2>History of Sankofa</h2>
          </header>
          <div class="section-text">
            <p>
              Sankofa Alkebulan University was established as an intellectual and academic initiative grounded in the
              conviction that Africa's future must be built upon a conscious recovery of its intellectual, spiritual,
              and cultural heritage.
            </p>
            <p>
              Its origins lie in a broader movement to reclaim African knowledge traditions that were marginalized
              during the colonial and post-colonial eras. The university emerged to create a scholarly platform where
              African thought could be studied, preserved, and developed with academic rigor.
            </p>
            <p>
              Over time, the vision expanded to promote publication, independent research, public intellectual
              dialogue, and initiatives that strengthen African intellectual sovereignty. Today, Sankofa continues to
              advance African scholarship while contributing to global conversations on knowledge, identity, and
              cultural renewal.
            </p>
          </div>
        </div>
      </section>
      <section class="about-section about-values" id="mission">
        <div class="container values-grid">
          <figure class="values-media">
            <img
              ngSrc="/wp-content/uploads/2025/10/miss_mimie.jpg"
              width="1080"
              height="1080"
              sizes="(max-width: 900px) 100vw, 28vw"
              alt="Sankofa student"
            />
            <figcaption>Scholarship grounded in heritage and renewal.</figcaption>
          </figure>
          <div class="values-content">
            <header class="section-heading">
              <p class="section-kicker">Our Purpose</p>
              <h2>Our Vision, Mission and Core Functions</h2>
            </header>
            <div class="vision-grid">
              @for (card of missionCards; track card.title) {
                <article class="vision-card">
                  <h3>{{ card.title }}</h3>
                  <p>{{ card.text }}</p>
                </article>
              }
            </div>
            <div class="core-values">
              <h3>Our Core Values</h3>
              <ul>
                @for (value of coreValues; track value.title) {
                  <li>
                    <strong>{{ value.title }}:</strong>
                    <span>{{ value.description }}</span>
                  </li>
                }
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section class="about-section about-philosophy" id="philosophy">
        <div class="container">
          <header class="section-heading section-heading--center">
            <p class="section-kicker">Our Philosophy</p>
            <h2>Guided by Sankofa</h2>
            <p class="section-lead">
              The Sankofa principle calls us to return to historical memory, reclaim wisdom, and apply it to the
              present. Explore the pillars that shape our academic culture.
            </p>
          </header>
          <div class="philosophy-grid">
            <div class="philosophy-tabs" role="tablist" aria-label="Sankofa philosophy">
              @for (item of philosophyItems; track item.title; let idx = $index) {
                <button
                  type="button"
                  class="philosophy-tab"
                  [class.is-active]="activePhilosophyIndex() === idx"
                  (click)="setPhilosophy(idx)"
                  [attr.aria-selected]="activePhilosophyIndex() === idx"
                  [attr.aria-controls]="'philosophy-panel'"
                  role="tab"
                >
                  {{ item.title }}
                </button>
              }
            </div>
            <div class="philosophy-panel" id="philosophy-panel" role="tabpanel">
              <h3>{{ philosophyItems[activePhilosophyIndex()].title }}</h3>
              <p>{{ philosophyItems[activePhilosophyIndex()].summary }}</p>
              <p>{{ philosophyItems[activePhilosophyIndex()].details }}</p>
            </div>
          </div>
        </div>
      </section>

      <section class="about-section about-governance" id="governance">
        <div class="container">
          <header class="section-heading section-heading--center">
            <p class="section-kicker">Leadership</p>
            <h2>Governance Structure</h2>
          </header>
          <p class="section-lead">
            The governance system of Sankofa Alkebulan University promotes institutional integrity, academic
            excellence, and responsible leadership through a coordinated framework of strategic oversight and
            executive administration.
          </p>
          <div class="governance-grid">
            @for (card of governanceCards; track card.id) {
              <article class="governance-card" [attr.id]="card.id">
                <h3>{{ card.title }}</h3>
                <p>{{ card.description }}</p>
                @if (card.people?.length) {
                  <ul class="name-list">
                    @for (person of card.people; track person) {
                      <li>{{ person }}</li>
                    }
                  </ul>
                }
              </article>
            }
          </div>
        </div>
      </section>

      <section class="about-section about-charter" id="charter">
        <div class="container">
          <header class="section-heading section-heading--center">
            <p class="section-kicker">Charter</p>
            <h2>Charter of Sankofa Alkebulan University</h2>
          </header>
          <div class="info-grid">
            <div class="info-panel">
              <p>
                The Charter is the supreme governing instrument of the University. It establishes our mission,
                governance framework, academic standards, ethical commitments, and institutional ceremonies, ensuring
                alignment with international standards of higher education.
              </p>
              <p>
                Guided by the principle of Sankofa, the Charter affirms our commitment to intellectual inquiry,
                ethical leadership, and the revitalization of African thought within the global academic community.
              </p>
            </div>
            <div class="info-panel info-panel--accent">
              <h3>Charter Highlights</h3>
              <ul class="highlight-list">
                @for (item of charterHighlights; track item.title) {
                  <li>
                    <strong>{{ item.title }}:</strong>
                    <span>{{ item.description }}</span>
                  </li>
                }
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section class="about-section about-law" id="law-council">
        <div class="container">
          <header class="section-heading section-heading--center">
            <p class="section-kicker">Legal Oversight</p>
            <h2>Sankofa Alkebulan University Law Council</h2>
          </header>
          <div class="info-grid">
            <div class="info-panel">
              <p>
                The Law Council is the principal legal advisory and oversight body of the University. It ensures the
                University operates within the law, maintains compliance with national and international regulations,
                and upholds the highest standards of governance and institutional integrity.
              </p>
            </div>
            <div class="info-panel">
              <h3>Mandate and Responsibilities</h3>
              <ul class="highlight-list">
                @for (item of lawCouncilResponsibilities; track item) {
                  <li>{{ item }}</li>
                }
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section class="about-section about-statute" id="statute">
        <div class="container">
          <header class="section-heading section-heading--center">
            <p class="section-kicker">Governance and Management</p>
            <h2>Statute on Governance and Management</h2>
          </header>
          <div class="info-panel info-panel--wide">
            <p>
              The Statute on Governance and Management establishes the legal and operational framework for
              administration, leadership, and strategic direction. It defines roles, responsibilities, and reporting
              lines to ensure accountability, transparency, and alignment with the University's mission.
            </p>
            <ul class="highlight-list">
              @for (item of statuteHighlights; track item) {
                <li>{{ item }}</li>
              }
            </ul>
          </div>
        </div>
      </section>

      <section class="about-section about-policies" id="policies">
        <div class="container">
          <header class="section-heading section-heading--center">
            <p class="section-kicker">University Policies</p>
            <h2>Sankofa Alkebulan University Policies</h2>
          </header>
          <p class="section-lead">
            Our policies align with international benchmarks including UNESCO guidelines, the Bologna Process, ISO
            9001:2015 quality standards, and global ethical frameworks. They ensure the University remains competitive,
            resilient, and rooted in African scholarship.
          </p>
          <div class="info-panel info-panel--wide">
            <ul class="highlight-list">
              @for (item of policyHighlights; track item) {
                <li>{{ item }}</li>
              }
            </ul>
          </div>
        </div>
      </section>

      <section class="about-section about-jobs" id="jobs">
        <div class="container">
          <header class="section-heading section-heading--center">
            <p class="section-kicker">Opportunities</p>
            <h2>Job Opportunities</h2>
          </header>
          <p class="section-lead">
            As a pre-accreditation institution, Sankofa Alkebulan University is building its founding team and invites
            visionary professionals across academic, administrative, executive, and operational roles.
          </p>
          <div class="info-panel info-panel--wide">
            <ul class="highlight-list">
              @for (item of jobHighlights; track item) {
                <li>{{ item }}</li>
              }
            </ul>
          </div>
        </div>
      </section>

      <section class="about-section about-cta">
        <div class="container">
          <div class="cta-panel">
            <div>
              <p class="section-kicker">Join Us</p>
              <h2>Join Sankofa Alkebulan University</h2>
              <p>
                Become part of our transformative journey in African higher education. Whether as a student, scholar,
                or partner, help us advance African knowledge systems and cultivate the next generation of ethical
                leaders.
              </p>
            </div>
            <a routerLink="/admissions" class="btn btn--accent">Apply Now</a>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      --about-ink: #102a43;
      --about-muted: #4a647d;
      --about-accent: #b3622d;
      --about-blue: #0f4c81;
      --about-bg: #f7f8f2;
      --about-panel: #ffffff;
      --about-border: #dbe3ea;
      --about-shadow: 0 18px 32px rgba(16, 42, 67, 0.12);
    }

    .about-page {
      background: var(--about-bg);
      color: var(--about-ink);
    }

    .about-page [id] {
      scroll-margin-top: 120px;
    }

    .about-hero {
      position: relative;
      min-height: clamp(220px, 32vw, 320px);
      color: #ffffff;
      overflow: hidden;
    }

    .about-hero__image {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .about-hero__overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(90deg, rgba(9, 32, 52, 0.88) 0%, rgba(9, 32, 52, 0.55) 50%, rgba(9, 32, 52, 0.2) 100%);
    }

    .about-hero__content {
      position: relative;
      padding: clamp(2.4rem, 4vw, 3.2rem) 0;
      min-height: clamp(220px, 32vw, 320px);
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 0.55rem;
    }

    .about-hero__eyebrow {
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.18em;
      font-size: 0.72rem;
      font-weight: 700;
      color: rgba(255, 255, 255, 0.85);
    }

    .about-hero h1 {
      margin: 0;
      font-size: clamp(2rem, 4.2vw, 3rem);
      color: #ffffff;
    }

    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.85rem;
      color: rgba(255, 255, 255, 0.8);
    }

    .breadcrumb a {
      color: #ffffff;
      text-decoration: none;
      font-weight: 600;
    }

    .breadcrumb a:hover {
      text-decoration: underline;
    }

    .about-section {
      padding: clamp(2rem, 4vw, 3rem) 0;
    }

    .section-heading {
      margin-bottom: 1.4rem;
    }

    .section-heading--center {
      text-align: center;
    }

    .section-kicker {
      margin: 0 0 0.35rem;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--about-accent);
    }

    .section-heading h2 {
      margin: 0;
      color: var(--about-blue);
      font-size: clamp(1.6rem, 3vw, 2.3rem);
    }

    .section-heading p,
    .section-lead {
      margin: 0.65rem auto 0;
      max-width: 880px;
      color: var(--about-muted);
      line-height: 1.7;
    }

    .intro-grid {
      display: grid;
      grid-template-columns: minmax(0, 1.25fr) minmax(0, 0.9fr);
      gap: 1.8rem;
      align-items: center;
    }

    .intro-copy p {
      margin-bottom: 0.9rem;
      color: var(--about-muted);
      line-height: 1.7;
    }

    .intro-copy p:last-child {
      margin-bottom: 0;
    }

    .video-card {
      position: relative;
      border-radius: 12px;
      overflow: hidden;
      background: var(--about-panel);
      border: 1px solid var(--about-border);
      box-shadow: var(--about-shadow);
    }

    .video-card__image {
      width: 100%;
      height: auto;
      display: block;
    }

    .video-card__play {
      position: absolute;
      left: 50%;
      top: 50%;
      width: 58px;
      height: 58px;
      border-radius: 50%;
      border: 2px solid #ffffff;
      background: rgba(15, 76, 129, 0.9);
      transform: translate(-50%, -50%);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: transform 150ms ease, box-shadow 150ms ease;
    }

    .video-card__play::before {
      content: '';
      width: 0;
      height: 0;
      border-top: 9px solid transparent;
      border-bottom: 9px solid transparent;
      border-left: 14px solid #ffffff;
      margin-left: 3px;
    }

    .video-card__play:hover {
      transform: translate(-50%, -50%) scale(1.04);
      box-shadow: 0 10px 20px rgba(9, 32, 52, 0.2);
    }

    .video-card__play:focus-visible {
      outline: 2px solid #ffffff;
      outline-offset: 3px;
    }

    .video-card__label {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      padding: 0.6rem 0.8rem;
      background: rgba(15, 76, 129, 0.9);
      color: #ffffff;
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .intro-quote {
      margin: 1.6rem auto 0;
      max-width: 840px;
      text-align: center;
      border-top: 1px solid var(--about-border);
      border-bottom: 1px solid var(--about-border);
      padding: 1rem 0;
      color: var(--about-muted);
    }

    .intro-quote blockquote {
      margin: 0;
      font-style: italic;
    }

    .intro-quote figcaption {
      margin-top: 0.4rem;
      font-size: 0.82rem;
      font-weight: 600;
      color: var(--about-blue);
    }
    .about-history {
      background: #ffffff;
      border-top: 1px solid var(--about-border);
      border-bottom: 1px solid var(--about-border);
    }

    .section-text {
      max-width: 960px;
      margin: 0 auto;
    }

    .section-text p {
      color: var(--about-muted);
      line-height: 1.7;
      margin-bottom: 1rem;
    }

    .section-text p:last-child {
      margin-bottom: 0;
    }

    .values-grid {
      display: grid;
      grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.15fr);
      gap: 2rem;
      align-items: start;
    }

    .values-media {
      margin: 0;
      border-radius: 14px;
      overflow: hidden;
      border: 1px solid var(--about-border);
      background: var(--about-panel);
      box-shadow: var(--about-shadow);
    }

    .values-media img {
      width: 100%;
      height: auto;
      display: block;
      object-fit: cover;
    }

    .values-media figcaption {
      padding: 0.75rem 0.9rem;
      font-size: 0.85rem;
      color: var(--about-muted);
      background: #f7f9fb;
    }

    .vision-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 0.9rem;
      margin: 1.2rem 0;
    }

    .vision-card {
      background: var(--about-panel);
      border: 1px solid var(--about-border);
      border-top: 3px solid var(--about-accent);
      border-radius: 10px;
      padding: 0.9rem;
      box-shadow: var(--about-shadow);
    }

    .vision-card h3 {
      margin: 0 0 0.4rem;
      color: var(--about-blue);
      font-size: 1rem;
    }

    .vision-card p {
      margin: 0;
      color: var(--about-muted);
      line-height: 1.6;
      font-size: 0.9rem;
    }

    .core-values h3 {
      margin: 1.4rem 0 0.4rem;
      color: var(--about-blue);
      font-size: 1.1rem;
    }

    .core-values ul {
      list-style: none;
      margin: 0.8rem 0 0;
      padding: 0;
      display: grid;
      gap: 0.6rem;
    }

    .core-values li {
      display: grid;
      grid-template-columns: 12px 1fr;
      gap: 0.6rem;
      align-items: start;
      color: var(--about-muted);
      line-height: 1.6;
      font-size: 0.92rem;
    }

    .core-values li::before {
      content: '';
      width: 10px;
      height: 10px;
      border-radius: 50%;
      margin-top: 0.35rem;
      background: var(--about-accent);
    }

    .core-values strong {
      color: var(--about-blue);
      font-weight: 700;
    }

    .about-philosophy {
      background: #ffffff;
      border-top: 1px solid var(--about-border);
      border-bottom: 1px solid var(--about-border);
    }

    .philosophy-grid {
      display: grid;
      grid-template-columns: minmax(220px, 0.55fr) minmax(0, 1fr);
      gap: 1.6rem;
      align-items: start;
    }

    .philosophy-tabs {
      display: grid;
      gap: 0.5rem;
    }

    .philosophy-tab {
      border: 1px solid var(--about-border);
      background: #edf2f6;
      padding: 0.75rem 0.9rem;
      text-align: left;
      font-size: 0.74rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--about-blue);
      border-radius: 6px;
      cursor: pointer;
      transition: background 150ms ease, color 150ms ease, border-color 150ms ease;
    }

    .philosophy-tab.is-active {
      background: var(--about-blue);
      color: #ffffff;
      border-color: var(--about-blue);
    }

    .philosophy-tab:focus-visible {
      outline: 2px solid var(--about-accent);
      outline-offset: 2px;
    }

    .philosophy-panel {
      background: var(--about-panel);
      border: 1px solid var(--about-border);
      border-radius: 12px;
      padding: 1.2rem 1.3rem;
      box-shadow: var(--about-shadow);
    }

    .philosophy-panel h3 {
      margin: 0 0 0.4rem;
      color: var(--about-blue);
    }

    .philosophy-panel p {
      margin: 0 0 0.8rem;
      color: var(--about-muted);
      line-height: 1.7;
    }

    .philosophy-panel p:last-child {
      margin-bottom: 0;
    }

    .about-governance .section-lead {
      text-align: center;
    }

    .governance-grid {
      margin-top: 1.4rem;
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 1rem;
    }

    .governance-card {
      border: 1px solid var(--about-border);
      border-radius: 12px;
      background: var(--about-panel);
      box-shadow: var(--about-shadow);
      padding: 1rem;
      display: grid;
      gap: 0.5rem;
    }

    .governance-card h3 {
      margin: 0;
      color: var(--about-blue);
      font-size: 1rem;
    }

    .governance-card p {
      margin: 0;
      color: var(--about-muted);
      line-height: 1.6;
      font-size: 0.9rem;
    }

    .name-list {
      list-style: none;
      margin: 0.4rem 0 0;
      padding: 0;
      display: grid;
      gap: 0.35rem;
      color: #51667a;
      font-size: 0.88rem;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 1rem;
      align-items: start;
    }

    .info-panel {
      border: 1px solid var(--about-border);
      border-radius: 12px;
      background: var(--about-panel);
      box-shadow: var(--about-shadow);
      padding: 1rem 1.1rem;
      color: var(--about-muted);
      line-height: 1.7;
    }

    .info-panel h3 {
      margin: 0 0 0.6rem;
      color: var(--about-blue);
      font-size: 1rem;
    }

    .info-panel--accent {
      border-top: 4px solid var(--about-accent);
    }

    .info-panel--wide {
      max-width: 960px;
      margin: 0 auto;
    }

    .highlight-list {
      list-style: none;
      margin: 0.6rem 0 0;
      padding: 0;
      display: grid;
      gap: 0.6rem;
    }

    .highlight-list li {
      display: grid;
      grid-template-columns: 12px 1fr;
      gap: 0.6rem;
      align-items: start;
    }

    .highlight-list li::before {
      content: '';
      width: 8px;
      height: 8px;
      border-radius: 50%;
      margin-top: 0.4rem;
      background: var(--about-accent);
    }

    .highlight-list strong {
      color: var(--about-blue);
    }

    .about-cta {
      background: #ffffff;
      border-top: 1px solid var(--about-border);
    }

    .cta-panel {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.5rem;
      border: 1px solid var(--about-border);
      border-radius: 14px;
      padding: 1.4rem 1.6rem;
      background: linear-gradient(120deg, rgba(15, 76, 129, 0.07), rgba(179, 98, 45, 0.08));
      box-shadow: var(--about-shadow);
    }

    .cta-panel h2 {
      margin: 0 0 0.4rem;
      color: var(--about-blue);
    }

    .cta-panel p {
      margin: 0;
      color: var(--about-muted);
      line-height: 1.7;
      max-width: 620px;
    }

    @media (max-width: 1100px) {
      .vision-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .governance-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (max-width: 900px) {
      .intro-grid,
      .values-grid,
      .philosophy-grid,
      .info-grid {
        grid-template-columns: 1fr;
      }

      .cta-panel {
        flex-direction: column;
        align-items: flex-start;
      }

      .vision-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 700px) {
      .governance-grid {
        grid-template-columns: 1fr;
      }

      .about-hero__content {
        padding: 2rem 0;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutComponent {
  readonly missionCards: readonly MissionCard[] = [
    {
      title: 'Our Vision',
      text: 'To become a leading African university renowned for scholarship, intellectual leadership, and the revitalization of African knowledge traditions.',
    },
    {
      title: 'Our Mission',
      text: 'Advance knowledge through rigorous research and innovation, preserve African intellectual traditions, foster ethical leadership, engage in global scholarship, and contribute to sustainable development.',
    },
    {
      title: 'Core Functions',
      text: 'Multidisciplinary scholarship, research, teaching, and knowledge dissemination supported by publication, dialogue, and academic collaboration.',
    },
  ];

  readonly coreValues: readonly CoreValue[] = [
    {
      title: 'Academic Freedom',
      description: 'Scholars enjoy freedom of research, teaching, and expression within ethical and scholarly boundaries.',
    },
    {
      title: 'Intellectual Integrity',
      description: 'All academic work adheres to the highest standards of honesty, rigor, and reproducibility.',
    },
    {
      title: 'African Intellectual Renewal',
      description: 'We prioritize the preservation and advancement of African knowledge systems.',
    },
    {
      title: 'Ethical Leadership',
      description: 'Scholarship must serve justice, human dignity, and societal transformation.',
    },
    {
      title: 'Global Engagement',
      description: 'We pursue international collaboration while maintaining autonomy and African-centered perspectives.',
    },
    {
      title: 'Inclusivity and Equity',
      description: 'Access, diversity, and gender equality are promoted across all programs and governance structures.',
    },
    {
      title: 'Sustainability',
      description: 'Environmental stewardship, social responsibility, and ethical finance guide our operations.',
    },
  ];

  readonly philosophyItems: readonly PhilosophyItem[] = [
    {
      title: 'Our Students',
      summary: 'Students are represented in governance through a Student Representative Council and supported through counseling, career guidance, and welfare mechanisms.',
      details: 'Student voices shape academic policy, student life, and welfare, building leaders who serve their communities with integrity and purpose.',
    },
    {
      title: 'Academic Integrity',
      summary: 'Academic freedom and intellectual integrity anchor teaching and research, with rigorous ethics and quality assurance.',
      details: 'We protect the freedom to inquire, publish, and debate while upholding the highest scholarly standards.',
    },
    {
      title: 'African Intellectual Renewal',
      summary: 'Sankofa calls us to reclaim and reinterpret African philosophical traditions and indigenous knowledge.',
      details: 'Our scholarship restores forgotten narratives and develops new frameworks for Africa in the modern world.',
    },
    {
      title: 'Global Engagement',
      summary: 'We engage in international collaborations while centering African perspectives and autonomy.',
      details: 'Partnerships, exchanges, and joint research initiatives strengthen our global presence without compromising mission.',
    },
    {
      title: 'Ethical Leadership',
      summary: 'Knowledge must serve truth and human flourishing, shaping public policy and social transformation.',
      details: 'We cultivate thinkers committed to justice, dignity, and cultural renewal.',
    },
  ];

  readonly governanceCards: readonly GovernanceCard[] = [
    {
      id: 'founder',
      title: 'Founder and Chancellor',
      description: 'Principal custodian of the University vision and mission, providing intellectual direction and safeguarding founding principles.',
      people: ['Emmanuel Mihiingo Kaija - Founder and Chancellor'],
    },
    {
      id: 'board',
      title: 'Board of Governance',
      description: 'Supreme supervisory authority providing strategic oversight, financial stewardship, and compliance with legal and ethical standards.',
      people: ['Prof. Mubiru Kisekwa - Board Member', 'Prof. Mutabazi Assani Mugisha - Board Member'],
    },
    {
      id: 'advisory',
      title: 'Advisory Council',
      description: 'Distinguished scholars and experts offering guidance on academic development, research direction, and institutional partnerships.',
      people: ['Prof. Leslee - Advisory Council Member', 'Prof. Joseph - Advisory Council Member'],
    },
    {
      id: 'council',
      title: 'University Council',
      description: 'Central governing body responsible for institutional administration and policy implementation in line with the Charter and statutes.',
    },
    {
      id: 'senate',
      title: 'Academic Senate',
      description: 'Highest authority on academic matters, overseeing curricula, research priorities, quality assurance, and academic freedom.',
      people: ['Prof. Joseph - Senate Member', 'Prof. Leslee - Senate Member', 'Prof. Mutabazi Assani Mugisha - Senate Member'],
    },
    {
      id: 'management',
      title: 'Executive Directors',
      description: 'Senior administrative leadership responsible for implementing policies and managing operations across key functional domains.',
      people: [
        'Gumarutahigwa-Bongobingiman Ruhinda - External Relations and Consultancy',
        'Maguru Zagyenda - Information Technology',
        'Michael Masabe - Finance',
        'Dickens Ogira - Operations, Administration, and Human Resources',
      ],
    },
  ];

  readonly charterHighlights: readonly HighlightItem[] = [
    {
      title: 'Motto',
      description: 'Knowledge Reclaimed, Wisdom Renewed.',
    },
    {
      title: 'Vision',
      description: 'To become a leading African university renowned for scholarship, intellectual leadership, and the revitalization of African knowledge traditions.',
    },
    {
      title: 'Mission',
      description: 'Advance knowledge through research and innovation, preserve African intellectual traditions, foster ethical leadership, engage global scholarship, and contribute to sustainable development.',
    },
  ];

  readonly lawCouncilResponsibilities: readonly string[] = [
    'Legal oversight of statutes, policies, and governance frameworks to ensure compliance.',
    'Contractual review for partnerships, memoranda of understanding, and legal agreements.',
    'Risk management to identify and mitigate legal and regulatory risks.',
    'Policy guidance supporting ethical standards and intellectual property protections.',
    'Strategic counsel to leadership on institutional growth and protection.',
  ];

  readonly statuteHighlights: readonly string[] = [
    'Defines governance bodies across the Board of Directors, Chancellor, University Council, Academic Senate, and Law Council.',
    'Establishes management bodies including Executive Directors, Academic Offices, and Administrative Units.',
    'Sets decision-making principles: transparency, accountability, integrity, and collaboration.',
    'Requires reporting and oversight through audits, performance reviews, and compliance checks.',
  ];

  readonly policyHighlights: readonly string[] = [
    'Academic policies covering curriculum design, assessment, research integrity, and faculty development.',
    'Student policies on admissions, conduct, welfare, and global citizenship.',
    'Governance and executive management policies for strategic oversight and compliance.',
    'Financial and procurement policies aligned with international accounting standards.',
    'Technology, data governance, health, safety, sustainability, and international collaboration policies.',
  ];

  readonly jobHighlights: readonly string[] = [
    'Academic opportunities across faculties, research centers, and curriculum development roles.',
    'Executive leadership roles in finance, operations and HR, information technology, and external relations.',
    'Administrative and support roles in communications, procurement, student services, and facilities management.',
    'Internships and graduate programs in teaching, research, operations, and digital learning.',
    'Applicants submit a detailed CV, statement of purpose, and references via the official recruitment portal.',
  ];

  readonly activePhilosophyIndex = signal(0);

  setPhilosophy(index: number): void {
    this.activePhilosophyIndex.set(index);
  }
}
