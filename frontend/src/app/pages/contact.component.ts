import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="contact">
      <div class="container">
        <div class="section">
          <div class="contact__hero">
            <h1 class="contact__title">Contact Us</h1>
            <p class="contact__subtitle">
              We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
          </div>

          <div class="contact__content">
            <div class="contact__form-section">
              <form class="contact__form" (ngSubmit)="onSubmit()" #contactForm="ngForm">
                @if (submitMessage) {
                <div class="contact__message contact__message--success">{{ submitMessage }}</div>
                }
                <div class="form-group">
                  <label for="name" class="form-label">Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    class="form-input"
                    [(ngModel)]="contact.name"
                    required
                    #name="ngModel"
                  >
                </div>

                <div class="form-group">
                  <label for="email" class="form-label">Email *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    class="form-input"
                    [(ngModel)]="contact.email"
                    required
                    email
                    #email="ngModel"
                  >
                </div>

                <div class="form-group">
                  <label for="subject" class="form-label">Subject *</label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    class="form-input"
                    [(ngModel)]="contact.subject"
                    required
                    #subject="ngModel"
                  >
                </div>

                <div class="form-group">
                  <label for="message" class="form-label">Message *</label>
                  <textarea
                    id="message"
                    name="message"
                    class="form-textarea"
                    rows="6"
                    [(ngModel)]="contact.message"
                    required
                    #message="ngModel"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  class="btn btn--primary"
                  [disabled]="!contactForm.form.valid"
                >
                  Send Message
                </button>
              </form>
            </div>

            <div class="contact__info-section">
              <div class="contact__info">
                <h2>Get in Touch</h2>
                <p>
                  Whether you have questions about our content, want to contribute an essay,
                  or just want to connect with our community, we're here to listen.
                </p>

                <div class="contact__info-item">
                  <h3>General Inquiries</h3>
                  <p>For questions about the journal, submissions, or general feedback.</p>
                  <a href="mailto:hello@sankofaalkebulanjournal.com">hello@sankofaalkebulanjournal.com</a>
                </div>

                <div class="contact__info-item">
                  <h3>Membership Support</h3>
                  <p>Questions about membership, payments, or account issues.</p>
                  <a href="mailto:membership@sankofaalkebulanjournal.com">membership@sankofaalkebulanjournal.com</a>
                </div>

                <div class="contact__info-item">
                  <h3>Editorial</h3>
                  <p>For essay submissions, editorial inquiries, or collaboration opportunities.</p>
                  <a href="mailto:editorial@sankofaalkebulanjournal.com">editorial@sankofaalkebulanjournal.com</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .contact {
      background-color: var(--background-color);
    }

    .contact__hero {
      text-align: center;
      margin-bottom: var(--spacing-3xl);
      padding: var(--spacing-3xl) 0;
    }

    .contact__title {
      font-size: var(--font-size-4xl);
      color: var(--primary-color);
      margin-bottom: var(--spacing-lg);
    }

    .contact__subtitle {
      font-size: var(--font-size-xl);
      color: var(--text-secondary);
      max-width: 600px;
      margin: 0 auto;
      line-height: 1.4;
    }

    .contact__content {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--spacing-3xl);
      max-width: 1000px;
      margin: 0 auto;
    }

    .contact__form-section {
      order: 2;
    }

    .contact__info-section {
      order: 1;
    }

    .contact__form {
      background-color: var(--background-color);
      padding: var(--spacing-2xl);
      border: 1px solid var(--border-color);
      border-radius: 0.5rem;
      box-shadow: var(--shadow-sm);
    }

    .contact__message {
      border-radius: 0.5rem;
      padding: var(--spacing-sm) var(--spacing-md);
      margin-bottom: var(--spacing-md);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
    }

    .contact__message--success {
      border: 1px solid #bde8c8;
      background: #eaf8ef;
      color: #20653d;
    }

    .contact__info {
      background-color: var(--surface-color);
      padding: var(--spacing-2xl);
      border-radius: 0.5rem;
      border: 1px solid var(--border-color);
    }

    .contact__info h2 {
      font-size: var(--font-size-2xl);
      color: var(--primary-color);
      margin-bottom: var(--spacing-lg);
    }

    .contact__info > p {
      color: var(--text-secondary);
      margin-bottom: var(--spacing-xl);
      line-height: 1.6;
    }

    .contact__info-item {
      margin-bottom: var(--spacing-xl);
    }

    .contact__info-item h3 {
      font-size: var(--font-size-lg);
      color: var(--primary-color);
      margin-bottom: var(--spacing-sm);
    }

    .contact__info-item p {
      color: var(--text-secondary);
      margin-bottom: var(--spacing-sm);
      line-height: 1.6;
    }

    .contact__info-item a {
      color: var(--link-color);
      text-decoration: none;
      font-weight: var(--font-weight-medium);
    }

    .contact__info-item a:hover {
      color: var(--link-hover);
      text-decoration: underline;
    }

    @media (max-width: 768px) {
      .contact__content {
        grid-template-columns: 1fr;
        gap: var(--spacing-xl);
      }

      .contact__form-section,
      .contact__info-section {
        order: initial;
      }

      .contact__title {
        font-size: var(--font-size-3xl);
      }

      .contact__subtitle {
        font-size: var(--font-size-lg);
      }

      .contact__hero {
        padding: var(--spacing-xl) 0;
      }
    }
  `]
})
export class ContactComponent {
  contact = {
    name: '',
    email: '',
    subject: '',
    message: ''
  };
  submitMessage = '';

  onSubmit() {
    // TODO: Implement form submission
    console.log('Contact form submitted:', this.contact);
    this.submitMessage = 'Thank you for your message. Our team will respond shortly.';
    this.contact = { name: '', email: '', subject: '', message: '' };
  }
}
