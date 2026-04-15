import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-membership',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="membership">
      <div class="container">
        <div class="section">
          <div class="membership__hero">
            <h1 class="membership__title">Join Our Community</h1>
            <p class="membership__subtitle">
              Support our mission and gain access to exclusive content, early access to essays,
              and opportunities to engage with our community of thinkers and writers.
            </p>
          </div>

          <div class="membership__plans">
            <div class="membership__plan card" *ngFor="let plan of plans">
              <div class="card__content">
                <div class="membership__plan-header">
                  <h2 class="membership__plan-title">{{ plan.name }}</h2>
                  <div class="membership__plan-price">
                    <span class="membership__plan-amount">{{ plan.price }}</span>
                    <span class="membership__plan-period">{{ plan.period }}</span>
                  </div>
                </div>

                <p class="membership__plan-description">{{ plan.description }}</p>

                <ul class="membership__plan-features">
                  <li *ngFor="let feature of plan.features" class="membership__plan-feature">
                    <span class="membership__plan-feature-icon">&#10003;</span>
                    {{ feature }}
                  </li>
                </ul>

                <button
                  class="btn btn--primary membership__plan-button"
                  [class.btn--accent]="plan.recommended"
                  (click)="selectPlan(plan)"
                >
                  {{ plan.buttonText }}
                </button>

                <div class="membership__plan-badge" *ngIf="plan.recommended">
                  Most Popular
                </div>
              </div>
            </div>
          </div>

          <div class="membership__faq">
            <h2>Frequently Asked Questions</h2>

            <div class="membership__faq-item" *ngFor="let faq of faqs">
              <h3 class="membership__faq-question">{{ faq.question }}</h3>
              <p class="membership__faq-answer">{{ faq.answer }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .membership {
      background-color: var(--background-color);
    }

    .membership__hero {
      text-align: center;
      margin-bottom: var(--spacing-3xl);
      padding: var(--spacing-3xl) 0;
    }

    .membership__title {
      font-size: var(--font-size-4xl);
      color: var(--primary-color);
      margin-bottom: var(--spacing-lg);
    }

    .membership__subtitle {
      font-size: var(--font-size-xl);
      color: var(--text-secondary);
      max-width: 700px;
      margin: 0 auto;
      line-height: 1.4;
    }

    .membership__plans {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: var(--spacing-xl);
      margin-bottom: var(--spacing-3xl);
    }

    .membership__plan {
      position: relative;
      transition: transform var(--transition-normal);
    }

    .membership__plan:hover {
      transform: translateY(-4px);
    }

    .membership__plan-header {
      text-align: center;
      margin-bottom: var(--spacing-lg);
    }

    .membership__plan-title {
      font-size: var(--font-size-2xl);
      color: var(--primary-color);
      margin-bottom: var(--spacing-sm);
    }

    .membership__plan-price {
      display: flex;
      align-items: baseline;
      justify-content: center;
      gap: var(--spacing-xs);
    }

    .membership__plan-amount {
      font-size: var(--font-size-3xl);
      font-weight: var(--font-weight-bold);
      color: var(--primary-color);
    }

    .membership__plan-period {
      font-size: var(--font-size-base);
      color: var(--text-secondary);
    }

    .membership__plan-description {
      text-align: center;
      color: var(--text-secondary);
      margin-bottom: var(--spacing-lg);
      line-height: 1.5;
    }

    .membership__plan-features {
      list-style: none;
      padding: 0;
      margin: 0 0 var(--spacing-xl) 0;
    }

    .membership__plan-feature {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      margin-bottom: var(--spacing-sm);
      color: var(--text-color);
    }

    .membership__plan-feature-icon {
      color: var(--accent-color);
      font-weight: bold;
      flex-shrink: 0;
    }

    .membership__plan-button {
      width: 100%;
      margin-bottom: var(--spacing-lg);
    }

    .membership__plan-badge {
      position: absolute;
      top: -12px;
      left: 50%;
      transform: translateX(-50%);
      background-color: var(--accent-color);
      color: var(--primary-color);
      padding: var(--spacing-xs) var(--spacing-sm);
      border-radius: 1rem;
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-semibold);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .membership__faq {
      max-width: 800px;
      margin: 0 auto;
    }

    .membership__faq h2 {
      font-size: var(--font-size-2xl);
      color: var(--primary-color);
      text-align: center;
      margin-bottom: var(--spacing-2xl);
    }

    .membership__faq-item {
      margin-bottom: var(--spacing-xl);
      padding-bottom: var(--spacing-lg);
      border-bottom: 1px solid var(--border-color);
    }

    .membership__faq-question {
      font-size: var(--font-size-lg);
      color: var(--primary-color);
      margin-bottom: var(--spacing-sm);
    }

    .membership__faq-answer {
      color: var(--text-secondary);
      line-height: 1.6;
    }

    @media (max-width: 768px) {
      .membership__title {
        font-size: var(--font-size-3xl);
      }

      .membership__subtitle {
        font-size: var(--font-size-lg);
      }

      .membership__hero {
        padding: var(--spacing-xl) 0;
      }

      .membership__plans {
        grid-template-columns: 1fr;
        gap: var(--spacing-lg);
      }
    }

    @media (max-width: 540px) {
      .membership__hero {
        margin-bottom: var(--spacing-xl);
        padding: var(--spacing-lg) 0;
      }

      .membership__subtitle {
        font-size: var(--font-size-base);
        line-height: 1.6;
      }

      .membership__plans {
        gap: var(--spacing-md);
      }

      .membership__plan .card__content {
        padding: var(--spacing-lg);
      }

      .membership__plan-title {
        font-size: var(--font-size-xl);
      }

      .membership__plan-amount {
        font-size: var(--font-size-2xl);
      }

      .membership__plan-badge {
        top: -10px;
      }
    }
  `]
})
export class MembershipComponent {
  plans = [
    {
      name: 'Supporter',
      price: '$5',
      period: '/month',
      description: 'Perfect for readers who want to support our mission and stay connected.',
      features: [
        'Access to all published essays',
        'Monthly newsletter',
        'Community forum access',
        'Support independent African voices'
      ],
      buttonText: 'Become a Supporter',
      recommended: false
    },
    {
      name: 'Community Member',
      price: '$15',
      period: '/month',
      description: 'For those who want deeper engagement with our community and content.',
      features: [
        'All Supporter benefits',
        'Early access to new essays',
        'Exclusive member-only content',
        'Monthly virtual community events',
        'Direct access to writers Q&A'
      ],
      buttonText: 'Join the Community',
      recommended: true
    },
    {
      name: 'Patron',
      price: '$25',
      period: '/month',
      description: 'For dedicated supporters who want to make a significant impact.',
      features: [
        'All Community Member benefits',
        'Behind-the-scenes content',
        'Priority in essay submission reviews',
        'Annual in-person community gathering',
        'Personal acknowledgment in publications'
      ],
      buttonText: 'Become a Patron',
      recommended: false
    }
  ];

  faqs = [
    {
      question: 'How does payment work?',
      answer: 'We accept payments through Stripe and Flutterwave for secure, international transactions. You can pay monthly or annually with a discount for annual subscriptions.'
    },
    {
      question: 'Can I cancel my membership anytime?',
      answer: 'Yes, you can cancel your membership at any time. Your access will continue until the end of your current billing period.'
    },
    {
      question: 'What content is exclusive to members?',
      answer: 'Members get early access to essays, exclusive interviews, behind-the-scenes content, and access to our private community discussions.'
    },
    {
      question: 'Do you offer refunds?',
      answer: 'We offer a 30-day money-back guarantee for new members. If you\'re not satisfied, contact us within 30 days for a full refund.'
    }
  ];

  constructor(private router: Router) {}

  selectPlan(plan: any) {
    // Navigate to payment page with plan details
    this.router.navigate(['/payment'], {
      queryParams: {
        plan: plan.name,
        amount: plan.price.replace('$', ''),
        description: `Membership: ${plan.name}`
      }
    });
  }
}
