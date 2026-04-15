import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly storageKey = 'sankofa_cart_v1';
  private items: CartItem[] = [];
  private cartSubject = new BehaviorSubject<CartItem[]>([]);
  cart$ = this.cartSubject.asObservable();

  constructor() {
    this.restoreCart();
  }

  addItem(item: Omit<CartItem, 'quantity'>) {
    const existing = this.items.find(i => i.id === item.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      this.items.push({ ...item, quantity: 1 });
    }
    this.publishCart();
  }

  removeItem(id: string) {
    this.items = this.items.filter(i => i.id !== id);
    this.publishCart();
  }

  updateQuantity(id: string, quantity: number) {
    const item = this.items.find(i => i.id === id);
    if (item) {
      item.quantity = quantity;
      if (item.quantity <= 0) {
        this.removeItem(id);
      } else {
        this.publishCart();
      }
    }
  }

  getItems(): CartItem[] {
    return [...this.items];
  }

  getTotal(): number {
    return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  getItemCount(): number {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  clear() {
    this.items = [];
    this.publishCart();
  }

  private publishCart() {
    this.cartSubject.next([...this.items]);
    this.persistCart();
  }

  private restoreCart() {
    if (!this.isBrowser()) return;

    const raw = localStorage.getItem(this.storageKey);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as CartItem[];
      if (!Array.isArray(parsed)) return;

      this.items = parsed
        .filter(item => item && typeof item.id === 'string')
        .map(item => ({
          ...item,
          quantity: Number(item.quantity) > 0 ? Number(item.quantity) : 1,
          price: Number(item.price) || 0,
        }));
      this.cartSubject.next([...this.items]);
    } catch {
      localStorage.removeItem(this.storageKey);
    }
  }

  private persistCart() {
    if (!this.isBrowser()) return;
    localStorage.setItem(this.storageKey, JSON.stringify(this.items));
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }
}
