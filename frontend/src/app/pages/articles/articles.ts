import { Component, OnInit, TrackByFunction } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { PostsService, Post } from '../../core/posts.service';

@Component({
  selector: 'app-articles',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './articles.html',
  styleUrl: './articles.scss',
  animations: [
    trigger('slideInOut', [
      state('in', style({ height: '*', opacity: 1 })),
      transition('void => *', [
        style({ height: 0, opacity: 0 }),
        animate('300ms ease-in')
      ]),
      transition('* => void', [
        animate('300ms ease-out', style({ height: 0, opacity: 0 }))
      ])
    ]),
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('300ms ease-in', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('300ms ease-out', style({ opacity: 0, transform: 'translateY(-20px)' }))
      ])
    ])
  ]
})
export class Articles implements OnInit {
  posts: Post[] = [];
  featuredPost: Post | null = null;
  filteredPosts: Post[] = [];
  viewMode: 'timeline' | 'academic' | 'blog' = 'timeline';
  activeFilter = 'all';
  searchQuery = '';
  selectedTag: string = 'all';
  activeSection: 'articles' | 'publications' | 'blogs' = 'articles';

  // Archive properties
  archiveYear: string = 'all';
  archiveMonth: string = 'all';
  archivedPosts: Post[] = [];
  showArchive: boolean = false;

  categories = [
    { name: 'African Philosophy', count: 12 },
    { name: 'Cultural Studies', count: 8 },
    { name: 'Literature', count: 15 },
    { name: 'Politics', count: 6 },
    { name: 'Economics', count: 9 },
    { name: 'Education', count: 7 }
  ];

  popularPosts = [
    { id: 1, title: 'The Future of African Scholarship', date: 'Dec 15, 2025' },
    { id: 2, title: 'Cultural Preservation in Digital Age', date: 'Dec 12, 2025' },
    { id: 3, title: 'African Voices in Global Discourse', date: 'Dec 10, 2025' }
  ];

  tags = ['Africa', 'Culture', 'Scholarship', 'Philosophy', 'Literature', 'Politics', 'Education', 'Heritage', 'Transformation'];

  constructor(private postsService: PostsService) {}

  ngOnInit() {
    this.postsService.getPosts().subscribe({
      next: (posts) => {
        this.posts = posts || this.getMockPosts();
        this.featuredPost = this.posts.length ? this.posts[0] : null;
        this.updateFilteredPosts();
        this.updateArchivedPosts();
      },
      error: () => {
        // Fallback to mock data if backend is not available
        this.posts = this.getMockPosts();
        this.featuredPost = this.posts[0];
        this.updateFilteredPosts();
        this.updateArchivedPosts();
      }
    });
  }

  private getMockPosts(): Post[] {
    return [
      {
        title: 'Sustainable Environmental Management: A Simple Take',
        published_at: '2025-11-12T00:00:00Z',
        excerpt: 'Environment, Sustainability, Uganda Development, Climate & Ecology daily actions—like sorting waste, recycling plastics, and planting trees when we cut them—shape the future of Uganda\'s environment.',
        featured_image: '/wp-content/uploads/2025/10/sustainable_environmental_management.jpg',
        categories: ['Environment', 'Sustainability', 'Climate & Ecology'],
        tags: ['Uganda', 'Development', 'Climate'],
        author: 'Sankofa Alkebulan University',
        slug: 'sustainable-environmental-management-simple-take',
        content: 'Full content here...'
      },
      {
        title: 'Uganda\'s Maritime Ambition: A Comprehensive Investigation',
        published_at: '2025-11-04T00:00:00Z',
        excerpt: 'Politics, Economics, International Relations, Infrastructure, East Africa, Geopolitics, Trade & Transport Despite being landlocked, Uganda under President Yoweri Museveni has asserted a right to access the Indian Ocean.',
        featured_image: '/wp-content/uploads/2025/10/ugandas_maritime_ambition.jpg',
        categories: ['Politics', 'Economics', 'International Relations'],
        tags: ['East Africa', 'Geopolitics', 'Trade'],
        author: 'Sankofa Alkebulan University',
        slug: 'ugandas-maritime-ambition-comprehensive-investigation',
        content: 'Full content here...'
      },
      {
        title: 'UBUNTUCRACY face à la crise: Tanzanie, Cameroun et l\'appel mondial',
        published_at: '2025-11-03T00:00:00Z',
        excerpt: 'Editor\'s Pick, Politique et gouvernance Philosophie africaine Éthique et société Réflexions contemporaines Ubuntu Review | Numéro 1, Vol. 1 (Janvier 2026)',
        featured_image: '/wp-content/uploads/2025/10/ubuntucracy_crisis.jpg',
        categories: ['Politics', 'African Philosophy', 'Ethics'],
        tags: ['Tanzania', 'Cameroon', 'Governance'],
        author: 'Sankofa Alkebulan University',
        slug: 'ubuntucracy-face-crise-tanzanie-cameroun-appel-mondial',
        content: 'Full content here...'
      }
      // Add more articles from the list...
    ];
  }

  setViewMode(mode: 'timeline' | 'academic' | 'blog') {
    this.viewMode = mode;
    this.updateFilteredPosts();
  }

  setActiveSection(section: 'articles' | 'publications' | 'blogs') {
    this.activeSection = section;
    // Filter posts based on section
    this.updateFilteredPosts();
  }

  setFilter(filter: string) {
    this.activeFilter = filter;
    this.updateFilteredPosts();
  }

  setTag(tag: string) {
    this.selectedTag = tag || 'all';
    this.updateFilteredPosts();
  }

  onSearchChange() {
    this.updateFilteredPosts();
  }

  private updateFilteredPosts() {
    let filtered = [...this.posts];

    // Remove featured post from regular list if in blog mode
    if (this.viewMode === 'blog' && this.featuredPost) {
      filtered = filtered.filter(p => p.slug !== this.featuredPost?.slug);
    }

    // Apply category filter
    if (this.activeFilter !== 'all') {
      filtered = filtered.filter(p => (p.categories || []).some(cat =>
        cat.toLowerCase().includes(this.activeFilter.toLowerCase())
      ));
    }

    // Apply search filter
    const q = this.searchQuery.trim().toLowerCase();
    if (q) {
      filtered = filtered.filter(p =>
        (p.title && p.title.toLowerCase().includes(q)) ||
        (p.excerpt && p.excerpt.toLowerCase().includes(q)) ||
        (p.content && p.content.toLowerCase().includes(q))
      );
    }

    // Apply tag filter
    if (this.selectedTag && this.selectedTag !== 'all') {
      filtered = filtered.filter(p => p.tags && p.tags.includes(this.selectedTag));
    }

    this.filteredPosts = filtered;
  }

  getRandomViews() {
    return Math.floor(Math.random() * 1000) + 100;
  }

  getRandomComments() {
    return Math.floor(Math.random() * 50) + 1;
  }

  getPostImage(index: number) {
    const images = [
      '/wp-content/uploads/2025/10/10006258593e3a.png',
      '/wp-content/uploads/2025/10/1000629597-1.jpg',
      '/wp-content/uploads/2025/10/1000629598-1.jpg',
      '/wp-content/uploads/2025/10/1000629599.jpg',
      '/wp-content/uploads/2025/10/1000629600.jpg',
      '/wp-content/uploads/2025/10/1000629601-1.jpg'
    ];
    return images[index % images.length];
  }

  getPopularPostImage(index: number) {
    const images = [
      '/wp-content/uploads/2025/10/1000636183-1.jpg',
      '/wp-content/uploads/2025/10/1000636214-1.jpg',
      '/wp-content/uploads/2025/10/1000636221-1.jpg'
    ];
    return images[index % images.length];
  }

  // Archive methods
  filterByYear() {
    this.updateArchivedPosts();
  }

  filterByMonth() {
    this.updateArchivedPosts();
  }

  private updateArchivedPosts() {
    let filtered = [...this.posts];

    if (this.archiveYear !== 'all') {
      filtered = filtered.filter(post => {
        const postYear = new Date(post.published_at).getFullYear().toString();
        return postYear === this.archiveYear;
      });
    }

    if (this.archiveMonth !== 'all') {
      filtered = filtered.filter(post => {
        const postMonth = (new Date(post.published_at).getMonth() + 1).toString().padStart(2, '0');
        return postMonth === this.archiveMonth;
      });
    }

    this.archivedPosts = filtered.sort((a, b) =>
      new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
    );
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  trackBySlug(index: number, post: Post): string {
    return post.slug;
  }
}
