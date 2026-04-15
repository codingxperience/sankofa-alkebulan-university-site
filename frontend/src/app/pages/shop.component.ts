import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../cart';

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="shop">
      <div class="container">
        <div class="section">
          <div class="shop__hero">
            <h1 class="shop__title">Sankofa Marketplace</h1>
            <p class="shop__subtitle">
              Discover books, merchandise, and resources that support African scholarship and cultural preservation.
            </p>
          </div>

          <!-- Search -->
          <div class="shop__search">
            <input
              type="text"
              placeholder="Search products..."
              [(ngModel)]="searchQuery"
              class="shop__search-input"
            >
            <i class="pi pi-search shop__search-icon"></i>
          </div>

          <!-- Categories -->
          <div class="shop__categories">
            <button
              class="shop__category-btn"
              [class.active]="activeCategory === 'all'"
              (click)="setCategory('all')"
            >
              All Items
            </button>
            <button
              class="shop__category-btn"
              [class.active]="activeCategory === 'books'"
              (click)="setCategory('books')"
            >
              Books
            </button>
            <button
              class="shop__category-btn"
              [class.active]="activeCategory === 'merchandise'"
              (click)="setCategory('merchandise')"
            >
              Merchandise
            </button>
            <button
              class="shop__category-btn"
              [class.active]="activeCategory === 'wishlist'"
              (click)="setCategory('wishlist')"
            >
              <i class="pi pi-heart"></i> Wishlist ({{ wishlist.length }})
            </button>
            <button
              class="shop__category-btn"
              [class.active]="activeCategory === 'digital'"
              (click)="setCategory('digital')"
            >
              Digital Resources
            </button>
          </div>

          <!-- Products Grid -->
          <div class="shop__grid">
            <div
              class="product-card card"
              *ngFor="let product of filteredProducts"
            >
              <div class="product-card__image">
                <img [src]="product.image" [alt]="product.name" class="img-responsive">
                <div class="product-card__badge" *ngIf="product.featured">Featured</div>
                <button class="product-card__wishlist" (click)="toggleWishlist(product)">
                  <i class="pi" [class]="isInWishlist(product) ? 'pi-heart-fill' : 'pi-heart'"></i>
                </button>
              </div>
              <div class="card__content">
                <h3 class="product-card__title">{{ product.name }}</h3>
                <p class="product-card__description">{{ product.description }}</p>
                <div class="product-card__price">
                  <span class="product-card__amount">{{ product.price }}</span>
                  <span class="product-card__currency">USD</span>
                </div>
                <div class="product-card__actions">
                  <button class="btn btn--primary" (click)="addToCart(product)">
                    <i class="pi pi-shopping-cart"></i> Add to Cart
                  </button>
                  <button class="btn btn--accent" (click)="buyNow(product)">
                    <i class="pi pi-credit-card"></i> Buy Now
                  </button>
                  <button class="btn btn--secondary" (click)="viewDetails(product)">
                    <i class="pi pi-eye"></i> Details
                  </button>
                </div>
              </div>
            </div>
          </div>

          @if (selectedProduct) {
          <div class="product-modal-backdrop" (click)="closeDetails()"></div>
          <aside class="product-modal" role="dialog" aria-modal="true" aria-labelledby="product-modal-title">
            <button type="button" class="product-modal__close" (click)="closeDetails()">&times;</button>
            <img [src]="selectedProduct.image" [alt]="selectedProduct.name" class="product-modal__image">
            <h3 id="product-modal-title">{{ selectedProduct.name }}</h3>
            <p class="product-modal__description">{{ selectedProduct.description }}</p>
            <div class="product-modal__meta">
              <span>Category: {{ selectedProduct.category }}</span>
              <strong>\${{ selectedProduct.price }}</strong>
            </div>
            <div class="product-modal__actions">
              <button class="btn btn--primary" (click)="addToCart(selectedProduct)">
                <i class="pi pi-shopping-cart"></i> Add to Cart
              </button>
              <button class="btn btn--accent" (click)="buyNow(selectedProduct)">
                <i class="pi pi-credit-card"></i> Buy Now
              </button>
            </div>
          </aside>
          }

          <!-- Newsletter Signup -->
          <div class="shop__newsletter card">
            <div class="card__content">
              <h3>Stay Updated</h3>
              <p>Get notified about new releases, special offers, and exclusive content.</p>
              <div class="newsletter__form">
                <input type="email" placeholder="Enter your email" class="form-input">
                <button class="btn btn--accent">Subscribe</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .shop {
      background-color: var(--background-color);
    }

    .shop__hero {
      text-align: center;
      margin-bottom: var(--spacing-3xl);
      padding: var(--spacing-3xl) 0;
    }

    .shop__title {
      font-size: var(--font-size-4xl);
      color: var(--primary-color);
      margin-bottom: var(--spacing-lg);
    }

    .shop__subtitle {
      font-size: var(--font-size-xl);
      color: var(--text-secondary);
      max-width: 600px;
      margin: 0 auto;
    }

    .shop__search {
      position: relative;
      max-width: 400px;
      margin: 0 auto var(--spacing-lg);
    }

    .shop__search-input {
      width: 100%;
      padding: var(--spacing-sm) var(--spacing-md);
      padding-right: 40px;
      border: 2px solid var(--border-color);
      border-radius: var(--border-radius);
      font-size: var(--font-size-base);
      background: var(--surface-color);
      color: var(--text-color);
    }

    .shop__search-input:focus {
      outline: none;
      border-color: var(--primary-color);
    }

    .shop__search-icon {
      position: absolute;
      right: var(--spacing-sm);
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-secondary);
    }

    .shop__categories {
      display: flex;
      justify-content: center;
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-3xl);
      flex-wrap: wrap;
    }

    .shop__category-btn {
      padding: var(--spacing-sm) var(--spacing-lg);
      background: none;
      border: 2px solid var(--border-color);
      border-radius: 25px;
      color: var(--text-color);
      cursor: pointer;
      transition: all var(--transition-fast);
      font-weight: var(--font-weight-medium);
    }

    .shop__category-btn:hover,
    .shop__category-btn.active {
      background-color: var(--accent-color);
      border-color: var(--accent-color);
      color: var(--primary-color);
    }

    .shop__grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: var(--spacing-xl);
      margin-bottom: var(--spacing-3xl);
    }

    .product-card {
      transition: transform 220ms ease, box-shadow 220ms ease;
      overflow: hidden;
      border-radius: 12px;
      padding: 0;
      background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01));
      box-shadow: 0 8px 30px rgba(2,6,23,0.28);
      backdrop-filter: blur(6px) saturate(120%);
    }

    .product-card:hover {
      transform: translateY(-8px) scale(1.01);
      box-shadow: 0 20px 50px rgba(2,6,23,0.4);
    }

    .product-card__image {
      position: relative;
      overflow: hidden;
      height: 220px;
    }

    .product-card__image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 300ms ease;
      display: block;
    }

    .product-card:hover .product-card__image img {
      transform: scale(1.06) rotate(-0.3deg);
    }

    .product-card__badge {
      position: absolute;
      top: var(--spacing-sm);
      left: var(--spacing-sm);
      background-color: var(--accent-color);
      color: var(--primary-color);
      padding: var(--spacing-xs) var(--spacing-sm);
      border-radius: 15px;
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-bold);
      text-transform: uppercase;
    }

    .product-card__wishlist {
      position: absolute;
      top: var(--spacing-sm);
      right: var(--spacing-sm);
      background: rgba(255, 255, 255, 0.9);
      border: none;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background 0.3s;
    }

    .product-card__wishlist:hover {
      background: white;
    }

    .product-card__wishlist .pi {
      color: var(--text-secondary);
      font-size: 18px;
    }

    .product-card__wishlist .pi-heart-fill {
      color: var(--accent-color);
    }

    .product-card__title {
      font-size: var(--font-size-lg);
      margin-bottom: var(--spacing-sm);
      color: var(--primary-color);
    }

    .product-card__description {
      color: var(--text-secondary);
      margin-bottom: var(--spacing-lg);
      line-height: 1.5;
    }

    .product-card__price {
      display: flex;
      align-items: baseline;
      gap: var(--spacing-xs);
      margin-bottom: var(--spacing-lg);
    }

    .product-card__amount {
      font-size: var(--font-size-2xl);
      font-weight: var(--font-weight-bold);
      color: var(--primary-color);
    }

    .product-card__currency {
      font-size: var(--font-size-base);
      color: var(--text-secondary);
    }

    .product-card__actions {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
      align-items: stretch;
    }

    .product-card__actions button {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-xs);
      padding: var(--spacing-sm);
    }

    .shop__newsletter {
      background: linear-gradient(135deg, var(--surface-color) 0%, var(--background-color) 100%);
      border: 2px solid var(--accent-color);
    }

    .product-modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(14, 24, 21, 0.55);
      z-index: 80;
      backdrop-filter: blur(2px);
    }

    .product-modal {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: min(92vw, 540px);
      border-radius: 16px;
      border: 1px solid rgba(21, 44, 38, 0.18);
      background: #fffef8;
      box-shadow: 0 30px 60px rgba(10, 23, 20, 0.3);
      padding: 1rem;
      z-index: 81;
      display: grid;
      gap: 0.75rem;
    }

    .product-modal__close {
      justify-self: end;
      border: none;
      background: none;
      font-size: 1.6rem;
      line-height: 1;
      cursor: pointer;
      color: var(--text-secondary);
    }

    .product-modal__image {
      width: 100%;
      height: 220px;
      object-fit: cover;
      border-radius: 10px;
    }

    .product-modal h3 {
      margin: 0;
      color: var(--primary-color);
    }

    .product-modal__description {
      margin: 0;
      color: var(--text-secondary);
      line-height: 1.6;
    }

    .product-modal__meta {
      display: flex;
      justify-content: space-between;
      gap: var(--spacing-sm);
      align-items: center;
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
    }

    .product-modal__actions {
      display: flex;
      gap: var(--spacing-sm);
      flex-wrap: wrap;
    }

    .shop__newsletter h3 {
      color: var(--primary-color);
      margin-bottom: var(--spacing-sm);
    }

    .shop__newsletter p {
      color: var(--text-secondary);
      margin-bottom: var(--spacing-lg);
    }

    .newsletter__form {
      display: flex;
      gap: var(--spacing-sm);
      max-width: 400px;
    }

    .newsletter__form .form-input {
      flex: 1;
    }

    @media (max-width: 768px) {
      .shop__categories {
        justify-content: center;
      }

      .shop__grid {
        grid-template-columns: 1fr;
      }

      .product-card__actions {
        flex-direction: column;
      }

      .newsletter__form {
        flex-direction: column;
      }
    }

    @media (max-width: 540px) {
      .shop__hero {
        margin-bottom: var(--spacing-xl);
        padding: var(--spacing-lg) 0;
      }

      .shop__subtitle {
        font-size: var(--font-size-base);
        line-height: 1.6;
      }

      .shop__categories {
        gap: var(--spacing-sm);
        margin-bottom: var(--spacing-xl);
      }

      .shop__category-btn {
        width: 100%;
      }

      .product-card__image {
        height: 200px;
      }

      .product-modal {
        width: calc(100vw - 1.5rem);
        padding: 0.9rem;
      }

      .product-modal__meta,
      .product-modal__actions {
        flex-direction: column;
        align-items: stretch;
      }
    }
  `]
})
export class ShopComponent {
  constructor(private cartService: CartService, private router: Router) {}

  activeCategory = 'all';
  searchQuery = '';
  wishlist: number[] = [];
  selectedProduct: any | null = null;

  products = [
    {
      id: 1,
      name: 'Unity in Africa',
      description: 'An analysis and report on African unity and integration efforts by Emmanuel Mihingo Kaija.',
      price: 24.99,
      image: '/wp-content/uploads/2025/10/unity_in_africa-an_analysis_and_report-by_emmanuel_mihingo_kaija.jpg',
      category: 'books',
      featured: true
    },
    {
      id: 2,
      name: 'Sankofa Black Shirt',
      description: 'Premium black Sankofa branded shirt featuring authentic African cultural motifs.',
      price: 29.99,
      image: '/wp-content/uploads/2025/10/black_shirt_sankofa.jpg',
      category: 'merchandise',
      featured: false
    },
    {
      id: 3,
      name: 'Patrice Lumumba: The Architecture of Betrayal',
      description: 'A comprehensive examination of Patrice Lumumba\'s life and the forces that led to his assassination.',
      price: 34.99,
      image: '/wp-content/uploads/2025/10/patrice_lumumba-the_architecture_of_betrayal-by_emmanuel_mihingo_kaija.jpg',
      category: 'books',
      featured: true
    },
    {
      id: 4,
      name: 'Sankofa Black Jumpsuit',
      description: 'Authentic Sankofa black jumpsuit for cultural events and formal occasions.',
      price: 79.99,
      image: '/wp-content/uploads/2025/10/black_jumpsuit_sankofa.jpg',
      category: 'merchandise',
      featured: false
    },
    {
      id: 5,
      name: 'Sankofa Office Bag',
      description: 'Durable office bag featuring the Sankofa logo and African design elements.',
      price: 49.99,
      image: '/wp-content/uploads/2025/10/office_bag_sankofa.jpg',
      category: 'merchandise',
      featured: false
    },
    {
      id: 6,
      name: 'Sankofa White Cap',
      description: 'Classic white Sankofa cap with embroidered logo and cultural symbols.',
      price: 19.99,
      image: '/wp-content/uploads/2025/10/white_cap_sankofa.jpg',
      category: 'merchandise',
      featured: false
    },
    {
      id: 7,
      name: 'Sankofa Black Notebook',
      description: 'Premium notebook with Sankofa branding for journaling and note-taking.',
      price: 16.99,
      image: '/wp-content/uploads/2025/10/black_notebook_sankofa.jpg',
      category: 'merchandise',
      featured: false
    },
    {
      id: 8,
      name: 'Sankofa Black Pen',
      description: 'Quality pen featuring Sankofa design for writing and signing documents.',
      price: 8.99,
      image: '/wp-content/uploads/2025/10/black_pen_sankofa.jpg',
      category: 'merchandise',
      featured: false
    },
    {
      id: 9,
      name: 'Global Black Consciousness',
      description: 'Tracing memory, resistance, and liberation across continents and generations.',
      price: 29.99,
      image: '/wp-content/uploads/2025/10/global_black_consciousness-tracing_memory_resistance_and_liberation_across_continents_and_generations-by_emmanuel_mihingo_kaija.jpg',
      category: 'books',
      featured: true
    },
    {
      id: 10,
      name: 'The Age of False Truths',
      description: 'An exploration of misinformation, propaganda, and the search for authentic knowledge.',
      price: 26.99,
      image: '/wp-content/uploads/2025/10/the_age_of_false_truths-by_emmanuel_mihingo_kaija.jpg',
      category: 'books',
      featured: false
    },
    {
      id: 11,
      name: 'Sankofa Yellow Jumper',
      description: 'Stylish yellow Sankofa jumper with cultural patterns and authentic branding.',
      price: 39.99,
      image: '/wp-content/uploads/2025/10/yellow_jumper_sankosa.jpg',
      category: 'merchandise',
      featured: false
    },
    {
      id: 12,
      name: 'Sankofa Black Bottle',
      description: 'Reusable water bottle with Sankofa logo and African cultural motifs.',
      price: 14.99,
      image: '/wp-content/uploads/2025/10/black_bottle_sankofa.jpg',
      category: 'merchandise',
      featured: false
    }
  ];

  get filteredProducts() {
    return this.products.filter(product => {
      const matchesCategory = this.activeCategory === 'all' || 
        (this.activeCategory === 'wishlist' ? this.wishlist.includes(product.id) : product.category === this.activeCategory);
      const matchesSearch = !this.searchQuery ||
        product.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(this.searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }

  setCategory(category: string) {
    this.activeCategory = category;
  }

  addToCart(product: any) {
    this.cartService.addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image
    });
  }

  viewDetails(product: any) {
    this.selectedProduct = product;
  }

  closeDetails() {
    this.selectedProduct = null;
  }

  buyNow(product: any) {
    this.addToCart(product);
    // Navigate to cart for checkout
    this.router.navigate(['/cart']);
  }

  toggleWishlist(product: any) {
    const index = this.wishlist.indexOf(product.id);
    if (index > -1) {
      this.wishlist.splice(index, 1);
    } else {
      this.wishlist.push(product.id);
    }
  }

  isInWishlist(product: any) {
    return this.wishlist.includes(product.id);
  }
}
