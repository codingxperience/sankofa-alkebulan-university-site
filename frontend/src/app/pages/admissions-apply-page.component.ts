import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

interface Step {
  label: string;
  sub: string;
  state: 'done' | 'active' | '';
  marker: string;
}

@Component({
  selector: 'app-admissions-apply-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './admissions-apply-page.component.html',
  styleUrl: './admissions-apply-page.component.scss',
})
export class AdmissionsApplyPageComponent {
  readonly steps: Step[] = [
    { label: 'Pathway', sub: 'Undergraduate selected', state: 'done', marker: 'check' },
    { label: 'Personal details', sub: 'About you & contact', state: 'active', marker: '2' },
    { label: 'Academic history', sub: 'Schools, results, transcripts', state: '', marker: '3' },
    { label: 'Statement & references', sub: '500 words — two referees', state: '', marker: '4' },
    { label: 'Funding', sub: 'Aid, scholarships, payments', state: '', marker: '5' },
    { label: 'Review & submit', sub: 'Final check, digital signature', state: '', marker: '6' },
  ];

  readonly pathways = [
    {
      id: 'undergraduate',
      title: 'Undergraduate',
      sub: 'Three- and four-year degrees — September 2026 intake',
    },
    {
      id: 'postgraduate',
      title: 'Postgraduate',
      sub: "Master's degrees and postgraduate diplomas across six colleges",
    },
    {
      id: 'doctoral',
      title: 'Doctoral',
      sub: 'Funded PhD positions across institutes and schools',
    },
  ];

  selectedPathway = 'undergraduate';

  readonly citizenship = ['Ghana', 'Kenya', 'Nigeria', 'Rwanda', 'South Africa', 'Uganda', 'Other'];
  readonly residence = ['Ghana', 'Kenya', 'Uganda', 'Other'];
  readonly genders = ['Prefer not to say', 'Female', 'Male', 'Non-binary', 'Self-describe'];

  model = {
    givenName: 'Adwoa',
    familyName: 'Owusu',
    dob: '2008-04-12',
    gender: 'Prefer not to say',
    citizenship: 'Ghana',
    residence: 'Ghana',
    email: 'a.owusu@example.org',
    phone: '',
    address: '',
  };
}
