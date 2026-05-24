import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RevealDirective } from '../directives/reveal.directive';

type SankofaPlatformWindow = Window & {
  __SAU_PLATFORM_CONFIG__?: {
    learningPlatformUrl?: string;
  };
};

@Component({
  selector: 'app-digital-learning-page',
  standalone: true,
  imports: [RouterLink, RevealDirective],
  templateUrl: './digital-learning-page.component.html',
  styleUrl: './digital-learning-page.component.scss',
})
export class DigitalLearningPageComponent {
  readonly platformLinks = {
    learning: this.resolveLearningPlatformUrl(),
  };

  readonly learningPaths = [
    {
      icon: 'fa-user-graduate',
      title: 'Masters and postgraduate study',
      body: 'Advanced programmes for professional growth, research readiness, and academic progression.',
      href: '/home/masters',
    },
    {
      icon: 'fa-book-open-reader',
      title: 'Bachelors and diploma study',
      body: 'Flexible undergraduate and diploma pathways with guided coursework and faculty support.',
      href: '/home/bachelors',
    },
    {
      icon: 'fa-certificate',
      title: 'Certificate programmes',
      body: 'Focused short programmes for skills development, career entry, and continuing education.',
      href: '/home/certificate',
    },
  ];

  readonly assuranceItems = [
    'Identity-aware access',
    'Live classes inside course rooms',
    'Assignments, quizzes, and feedback',
    'Secure examination support',
    'Technical help for students and faculty',
  ];

  private resolveLearningPlatformUrl(): string {
    const fallbackAnchor = '/digital-learning#learning-campus';

    if (typeof window === 'undefined') {
      return fallbackAnchor;
    }

    const config = (window as SankofaPlatformWindow).__SAU_PLATFORM_CONFIG__;
    const configuredUrl = config?.learningPlatformUrl?.trim();
    if (configuredUrl) {
      return configuredUrl;
    }

    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://127.0.0.1/login/index.php';
    }

    if (host.endsWith('.vercel.app')) {
      return fallbackAnchor;
    }

    return `https://learn.${host.replace(/^www\./, '')}/login/index.php`;
  }
}
