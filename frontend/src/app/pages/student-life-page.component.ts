import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RevealDirective } from '../directives/reveal.directive';

@Component({
  selector: 'app-student-life-page',
  standalone: true,
  imports: [RouterLink, RevealDirective],
  templateUrl: './student-life-page.component.html',
  styleUrl: './student-life-page.component.scss',
})
export class StudentLifePageComponent {
  readonly portraits = [
    { cls: 'sl-portrait--1', img: 'assets/student-life-hero-friendship.jpg', name: 'Peer network', programme: 'Friendship, belonging, and leadership' },
    { cls: 'sl-portrait--2', img: 'assets/student-life-modern-01.jpg', name: 'Study', programme: 'Seminars and peer learning' },
    { cls: 'sl-portrait--3', img: 'assets/student-life-hero-classroom.jpg', name: 'Campus', programme: 'Modern academic life' },
  ];

  readonly pillars = [
    {
      photo: 'assets/student-life-residence-modern.jpg',
      ek: '01 - Residences',
      h: 'A room of your own, on a campus that holds you.',
      p: 'Four residence colleges with single and shared rooms, common kitchens, study lofts, and dedicated wardens for first-year support.',
      cta: 'Housing and residence colleges',
    },
    {
      photo: 'assets/student-life-wellbeing-support.jpg',
      ek: '02 - Wellbeing and counselling',
      h: 'Quiet, confidential support built in.',
      p: 'A wellbeing centre staffed by counsellors, a chaplaincy, and a small mental-health team. Group programmes for grief, transition, and identity.',
      cta: 'Wellbeing services',
    },
    {
      photo: 'assets/student-life-culture-societies.jpg',
      ek: '03 - Societies and debate',
      h: 'Forty-plus student societies, run by students.',
      p: "Debate, language, faith, music, journalism, model-AU, and a continental scholars' network funded annually with public budgets.",
      cta: 'Browse societies',
    },
    {
      photo: 'assets/student-life-athletics-field.jpg',
      ek: '04 - Athletics and movement',
      h: 'Intramural sport and three competitive teams.',
      p: 'Football, rugby sevens, basketball, athletics, swimming, and a quiet running club. Strength studios open from 5am.',
      cta: 'Athletics programme',
    },
    {
      photo: 'assets/student-life-reflection-library.jpg',
      ek: '05 - Faith and reflection',
      h: 'An interfaith chaplaincy, serious and unhurried.',
      p: 'Christian, Muslim, traditional African, and humanist chaplains. A shared interfaith centre for prayer, reflection, and dialogue.',
      cta: 'Faith life on campus',
    },
    {
      photo: 'assets/student-life-leadership-service.jpg',
      ek: '06 - Leadership and service',
      h: "The students' assembly, and the public work of the university.",
      p: 'An elected student assembly funds civic projects across the city: literacy, archive work, climate adaptation, public health.',
      cta: 'Leadership and service',
    },
  ];

  readonly voices = [
    {
      quote:
        'I came to Sankofa to write about how my grandmother understood medicine. Three years in, that question has become a real research programme and a community that takes it seriously.',
      img: 'assets/student-voice-diana.jpg',
      name: 'Diana Kaija',
      meta: 'MA Indigenous Knowledge Systems - Class of 2027',
    },
    {
      quote:
        "The Pan-African scholars' network was the first place I met students from Ghana, Senegal, and Ethiopia who think the way I do about African economies. The reading group has been running for two years now.",
      img: 'assets/student-voice-chinaza.jpg',
      name: 'Chinaza Ekeoma',
      meta: 'BA Civilizational Studies - Class of 2026',
    },
    {
      quote:
        "I was nervous about leaving Kigali. The residence wardens met me at the airport. Two terms later I'm running the debate society and writing for the student archive.",
      img: 'assets/student-voice-winnie.jpg',
      name: 'Winnie Mukashema',
      meta: 'BSc Public Health - Class of 2028',
    },
  ];

  readonly calendar = [
    {
      day: '14',
      mon: 'MAR',
      h: 'Annual Lecture - Restoration as a research method',
      p: 'Prof. R. Ruhinda, public talk in the John K. Sentongo Hall. Free, livestreamed, recorded.',
      meta: '18:30 - 90 min',
      action: 'RSVP',
    },
    {
      day: '17',
      mon: 'MAR',
      h: "Pan-African scholars' reading group",
      p: "Open seminar on Ngugi wa Thiong'o's Decolonising the Mind. Hosted by the Society of African Letters.",
      meta: '17:00 - Senior Common Room',
      action: 'Add to calendar',
    },
    {
      day: '22',
      mon: 'MAR',
      h: 'Health and wellbeing fair',
      p: 'Drop-in clinics, mental-health screenings, peer-support sign-ups, and a free strength class.',
      meta: '10:00 - 16:00 - Quad',
      action: 'Details',
    },
    {
      day: '29',
      mon: 'MAR',
      h: 'Inter-college debate finals',
      p: 'Motion: This house believes restoration is a stronger frame than reform. Adjudicated by the Senate.',
      meta: '19:00 - Senate Hall',
      action: 'Tickets',
    },
    {
      day: '02',
      mon: 'APR',
      h: "Founders' Day - Service of restoration",
      p: 'A public service of music, prayer, and reading. Interfaith chaplaincy, all students and families welcome.',
      meta: '11:00 - Chapel of the Three Rivers',
      action: 'Details',
    },
  ];
}
