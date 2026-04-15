import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-library',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="library">
      <div class="container">
        <div class="section">
          <div class="library__hero">
            <h1 class="library__title">Digital Library</h1>
            <p class="library__subtitle">
              Access our curated collection of African scholarship, research papers, cultural resources, and educational materials.
            </p>
            @if (feedbackMessage) {
            <div class="library__feedback">{{ feedbackMessage }}</div>
            }
          </div>

          <!-- Search and Filters -->
          <div class="library__controls">
            <div class="library__search">
              <input
                type="text"
                placeholder="Search resources..."
                class="form-input library__search-input"
                [(ngModel)]="searchQuery"
                (input)="filterResources()"
              >
            </div>
            <div class="library__filters">
              <select class="form-select" [(ngModel)]="selectedCategory" (change)="filterResources()">
                <option value="all">All Categories</option>
                <option value="research">Research Papers</option>
                <option value="books">Books</option>
                <option value="articles">Articles</option>
                <option value="multimedia">Multimedia</option>
                <option value="educational">Educational Resources</option>
              </select>
            </div>
          </div>

          <!-- Resources Grid -->
          <div class="library__grid">
            <div
              class="resource-card card"
              *ngFor="let resource of filteredResources; let i = index"
            >
              <div class="resource-card__image">
                <img [src]="getResourceImage(i)" alt="{{ resource.title }}" class="img-responsive">
              </div>
              <div class="resource-card__icon">
                <span class="resource-card__icon-symbol">{{ resource.icon }}</span>
              </div>
              <div class="card__content">
                <h3 class="resource-card__title">{{ resource.title }}</h3>
                <p class="resource-card__description">{{ resource.description }}</p>
                <div class="resource-card__meta">
                  <span class="resource-card__category">{{ resource.category }}</span>
                  <span class="resource-card__type">{{ resource.type }}</span>
                </div>
                <div class="resource-card__actions">
                  <button class="btn btn--primary" (click)="accessResource(resource)">Access</button>
                  <button class="btn btn--secondary" (click)="downloadResource(resource)">Download</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Collections -->
          <div class="library__collections">
            <h2>Featured Collections</h2>
            <div class="collections__grid">
              <div class="collection-card card" *ngFor="let collection of collections">
                <div class="card__content">
                  <h3 class="collection-card__title">{{ collection.title }}</h3>
                  <p class="collection-card__description">{{ collection.description }}</p>
                  <div class="collection-card__stats">
                    <span>{{ collection.itemCount }} items</span>
                    <span>{{ collection.category }}</span>
                  </div>
                  <button class="btn btn--accent" (click)="browseCollection(collection)">Browse Collection</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Contribute Section -->
          <div class="library__contribute card">
            <div class="card__content">
              <h3>Contribute to Our Library</h3>
              <p>
                Help us build the most comprehensive digital library of African scholarship.
                Submit your research, articles, or educational materials.
              </p>
              <button class="btn btn--primary">Submit Resource</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .library {
      background-color: var(--background-color);
    }

    .library__hero {
      text-align: center;
      margin-bottom: var(--spacing-3xl);
      padding: var(--spacing-3xl) 0;
    }

    .library__title {
      font-size: var(--font-size-4xl);
      color: var(--primary-color);
      margin-bottom: var(--spacing-lg);
    }

    .library__subtitle {
      font-size: var(--font-size-xl);
      color: var(--text-secondary);
      max-width: 700px;
      margin: 0 auto;
    }

    .library__feedback {
      margin: var(--spacing-md) auto 0;
      max-width: 640px;
      border: 1px solid #b8e0d7;
      background: #ecf8f3;
      color: #145c4f;
      border-radius: 10px;
      padding: var(--spacing-sm) var(--spacing-md);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-semibold);
    }

    .library__controls {
      display: flex;
      gap: var(--spacing-lg);
      margin-bottom: var(--spacing-3xl);
      align-items: center;
    }

    .library__search {
      flex: 1;
    }

    .library__search-input {
      width: 100%;
    }

    .library__filters {
      min-width: 200px;
    }

    .library__grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: var(--spacing-xl);
      margin-bottom: var(--spacing-3xl);
    }

    .resource-card {
      display: flex;
      flex-direction: column;
      transition: transform var(--transition-normal), box-shadow 240ms ease;
      background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01));
      border-radius: 12px;
      padding: var(--spacing-lg);
      box-shadow: 0 8px 24px rgba(2,6,23,0.25);
      backdrop-filter: blur(4px) saturate(120%);
      overflow: hidden;
    }

    .resource-card:hover {
      transform: translateY(-6px);
      box-shadow: 0 18px 40px rgba(2,6,23,0.35);
    }

    .resource-card__image {
      width: 100%;
      height: 180px;
      margin-bottom: var(--spacing-lg);
      border-radius: 8px;
      overflow: hidden;
    }

    .resource-card__icon {
      position: absolute;
      top: var(--spacing-lg);
      right: var(--spacing-lg);
      width: 50px;
      height: 50px;
      background: linear-gradient(135deg, #f15a24 0%, #ffd166 40%, #2a9d8f 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #082032;
      font-weight: 700;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }

    .resource-card__icon-symbol {
      font-size: var(--font-size-2xl);
      color: var(--primary-color);
    }

    .resource-card__title {
      font-size: var(--font-size-lg);
      margin-bottom: var(--spacing-sm);
      color: var(--primary-color);
    }

    .resource-card__description {
      color: var(--text-secondary);
      margin-bottom: var(--spacing-lg);
      line-height: 1.5;
    }

    .resource-card__meta {
      display: flex;
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-lg);
      font-size: var(--font-size-sm);
    }

    .resource-card__category {
      background-color: var(--accent-color);
      color: var(--primary-color);
      padding: var(--spacing-xs) var(--spacing-sm);
      border-radius: 12px;
      font-weight: var(--font-weight-medium);
    }

    .resource-card__type {
      color: var(--text-secondary);
      font-style: italic;
    }

    .resource-card__actions {
      display: flex;
      gap: var(--spacing-sm);
    }

    .library__collections h2 {
      font-size: var(--font-size-3xl);
      text-align: center;
      margin-bottom: var(--spacing-2xl);
      color: var(--primary-color);
    }

    .collections__grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: var(--spacing-xl);
      margin-bottom: var(--spacing-3xl);
    }

    .collection-card__title {
      font-size: var(--font-size-lg);
      margin-bottom: var(--spacing-sm);
    }

    .collection-card__description {
      color: var(--text-secondary);
      margin-bottom: var(--spacing-lg);
    }

    .collection-card__stats {
      display: flex;
      justify-content: space-between;
      margin-bottom: var(--spacing-lg);
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
    }

    .library__contribute {
      background: linear-gradient(135deg, var(--surface-color) 0%, var(--background-color) 100%);
      border: 2px solid var(--accent-color);
      text-align: center;
    }

    .library__contribute h3 {
      color: var(--primary-color);
      margin-bottom: var(--spacing-sm);
    }

    .library__contribute p {
      color: var(--text-secondary);
      margin-bottom: var(--spacing-lg);
      max-width: 500px;
      margin-left: auto;
      margin-right: auto;
    }

    @media (max-width: 768px) {
      .library__controls {
        flex-direction: column;
        align-items: stretch;
      }

      .library__grid {
        grid-template-columns: 1fr;
      }

      .resource-card {
        flex-direction: column;
        text-align: center;
      }

      .resource-card__actions {
        justify-content: center;
      }
    }
  `]
})
export class LibraryComponent {
  searchQuery = '';
  selectedCategory = 'all';
  feedbackMessage = '';

  resources = [
    {
      id: 1,
      title: 'African Philosophy: Contemporary Perspectives',
      description: 'Comprehensive analysis of modern African philosophical thought and its global implications.',
      category: 'Philosophy',
      type: 'Research Paper',
      icon: '📚'
    },
    {
      id: 2,
      title: 'Cultural Preservation in the Digital Age',
      description: 'Strategies for documenting and preserving African cultural heritage using digital technologies.',
      category: 'Cultural Studies',
      type: 'Article',
      icon: '💾'
    },
    {
      id: 3,
      title: 'Economic Development in Sub-Saharan Africa',
      description: 'Case studies and analysis of economic development strategies across African nations.',
      category: 'Economics',
      type: 'Research Paper',
      icon: '📊'
    },
    {
      id: 4,
      title: 'African Literature: Voices of Change',
      description: 'Anthology of contemporary African literature exploring themes of identity and transformation.',
      category: 'Literature',
      type: 'Book',
      icon: '📖'
    },
    {
      id: 5,
      title: 'Traditional African Medicine Documentary',
      description: 'Documentary exploring traditional healing practices and their integration with modern medicine.',
      category: 'Health',
      type: 'Multimedia',
      icon: '🎥'
    },
    {
      id: 6,
      title: 'African History Curriculum Guide',
      description: 'Educational resource for teaching African history in secondary education.',
      category: 'Education',
      type: 'Educational Resource',
      icon: '🎓'
    }
  ];

  collections = [
    {
      title: 'African Philosophy Collection',
      description: 'Comprehensive collection of philosophical works by African scholars.',
      itemCount: 45,
      category: 'Philosophy'
    },
    {
      title: 'Cultural Studies Archive',
      description: 'Research and documentation on African cultural practices and traditions.',
      itemCount: 78,
      category: 'Cultural Studies'
    },
    {
      title: 'Economic Development Papers',
      description: 'Academic papers on economic policies and development in Africa.',
      itemCount: 32,
      category: 'Economics'
    },
    {
      title: 'African Literature Database',
      description: 'Digital collection of African literary works and criticism.',
      itemCount: 156,
      category: 'Literature'
    }
  ];

  get filteredResources() {
    return this.resources.filter(resource => {
      const matchesSearch = resource.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                           resource.description.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchesCategory = this.selectedCategory === 'all' || resource.category.toLowerCase().replace(' ', '') === this.selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }

  filterResources() {
    // Filtering is handled by the getter
  }

  accessResource(resource: any) {
    this.feedbackMessage = `Access request received for "${resource.title}".`;
  }

  downloadResource(resource: any) {
    this.feedbackMessage = `Download queue started for "${resource.title}".`;
  }

  browseCollection(collection: any) {
    this.feedbackMessage = `Browsing "${collection.title}" collection with ${collection.itemCount} items.`;
  }

  getResourceImage(index: number) {
    const images = [
      '/wp-content/uploads/2025/10/1000646296-1.jpg',
      '/wp-content/uploads/2025/10/1000651259-1.jpg',
      '/wp-content/uploads/2025/10/1000655393-1.jpg',
      '/wp-content/uploads/2025/10/1000656258-1.jpg',
      '/wp-content/uploads/2025/10/1000657363-1.jpg',
      '/wp-content/uploads/2025/10/1000657363-3b3cd.jpg'
    ];
    return images[index % images.length];
  }
}
