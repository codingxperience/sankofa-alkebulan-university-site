import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartService, CartItem } from '../cart';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../auth.service';

type PaymentMethod = 'stripe' | 'mobile';

interface CheckoutState {
  paymentMethod: PaymentMethod;
  phoneNumber: string;
  pendingCheckout: boolean;
}

@Component({
  selector: 'app-cart',
  imports: [CommonModule, FormsModule],
  templateUrl: './cart.html',
  styleUrl: './cart.scss',
})
export class CartComponent implements OnInit {
  private readonly checkoutStateKey = 'sankofa_checkout_state_v1';
  items: CartItem[] = [];
  total = 0;
  paymentMethod: PaymentMethod = 'stripe';
  phoneNumber = '';
  showAuthModal = false;
  checkoutNotice = '';
  private checkoutAutoResumed = false;

  constructor(
    private cartService: CartService,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
  ) {}

  ngOnInit() {
    this.restoreCheckoutState();

    this.cartService.cart$.subscribe(items => {
      this.items = items;
      this.total = this.cartService.getTotal();
    });

    // After login/register/OAuth redirect, continue checkout only once.
    queueMicrotask(() => this.tryResumeCheckout());
  }

  updateQuantity(id: string, quantity: number) {
    this.cartService.updateQuantity(id, quantity);
  }

  removeItem(id: string) {
    this.cartService.removeItem(id);
  }

  onPaymentMethodChange(method: PaymentMethod) {
    this.paymentMethod = method;
    this.saveCheckoutState();
  }

  onPhoneNumberChange(value: string) {
    this.phoneNumber = value;
    this.saveCheckoutState();
  }

  closeAuthModal() {
    this.showAuthModal = false;
    this.clearPendingCheckout();
  }

  continueAsReturningUser() {
    this.showAuthModal = false;
    this.markPendingCheckout();
    this.router.navigate(['/login'], {
      queryParams: {
        returnUrl: '/cart?checkout=1',
        checkout: '1',
      },
    });
  }

  continueAsNewUser() {
    this.showAuthModal = false;
    this.markPendingCheckout();
    this.router.navigate(['/register'], {
      queryParams: {
        returnUrl: '/cart?checkout=1',
        checkout: '1',
      },
    });
  }

  async checkout() {
    this.checkoutNotice = '';

    if (!this.authService.isAuthenticated) {
      this.saveCheckoutState();
      this.showAuthModal = true;
      return;
    }

    this.clearPendingCheckout();
    this.saveCheckoutState();

    if (this.paymentMethod === 'mobile') {
      // Mobile money checkout
      if (!this.phoneNumber.trim()) {
        this.checkoutNotice = 'Please enter your phone number to continue Mobile Money checkout.';
        return;
      }
      // Send to mobile money endpoint
      fetch('http://localhost:3000/payment/mobile-money', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: this.phoneNumber.trim(), amount: this.total })
      }).then(res => res.json()).then(data => {
        this.checkoutNotice = 'Mobile money payment initiated. Please confirm on your phone.';
      }).catch(err => {
        console.error(err);
        this.checkoutNotice = 'Could not initiate mobile money payment. Please try again.';
      });
    } else {
      // Stripe checkout
      const items = this.items.map(item => ({
        name: item.name,
        amount: item.price,
        quantity: item.quantity
      }));
      fetch('http://localhost:3000/payment/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
      }).then(res => res.json()).then(data => {
        if (data.url) {
          window.location.href = data.url;
          return;
        }
        this.checkoutNotice = 'Checkout session could not be created. Please try again.';
      }).catch(err => {
        console.error(err);
        this.checkoutNotice = 'Could not start card checkout. Please try again.';
      });
    }
  }

  private tryResumeCheckout() {
    if (this.checkoutAutoResumed) return;
    if (!this.authService.isAuthenticated) return;

    const requestedByQuery = this.route.snapshot.queryParamMap.get('checkout') === '1';
    const requestedByState = this.readCheckoutState().pendingCheckout;
    if (!requestedByQuery && !requestedByState) return;

    this.checkoutAutoResumed = true;
    this.clearPendingCheckout();
    this.clearCheckoutQuery();

    if (!this.items.length) {
      this.checkoutNotice = 'Your cart is empty. Add an item to proceed.';
      return;
    }

    if (this.paymentMethod === 'mobile' && !this.phoneNumber.trim()) {
      this.checkoutNotice = 'Add your mobile number to complete Mobile Money checkout.';
      return;
    }

    this.checkoutNotice = 'Resuming your checkout...';
    this.checkout();
  }

  private clearCheckoutQuery() {
    if (this.route.snapshot.queryParamMap.get('checkout') !== '1') return;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { checkout: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  private markPendingCheckout() {
    const state = this.readCheckoutState();
    state.pendingCheckout = true;
    this.writeCheckoutState(state);
  }

  private clearPendingCheckout() {
    const state = this.readCheckoutState();
    state.pendingCheckout = false;
    this.writeCheckoutState(state);
  }

  private saveCheckoutState() {
    const state = this.readCheckoutState();
    state.paymentMethod = this.paymentMethod;
    state.phoneNumber = this.phoneNumber;
    this.writeCheckoutState(state);
  }

  private restoreCheckoutState() {
    const state = this.readCheckoutState();
    this.paymentMethod = state.paymentMethod;
    this.phoneNumber = state.phoneNumber;
  }

  private readCheckoutState(): CheckoutState {
    if (!this.isBrowser()) {
      return { paymentMethod: 'stripe', phoneNumber: '', pendingCheckout: false };
    }

    const raw = localStorage.getItem(this.checkoutStateKey);
    if (!raw) {
      return { paymentMethod: 'stripe', phoneNumber: '', pendingCheckout: false };
    }

    try {
      const parsed = JSON.parse(raw) as Partial<CheckoutState>;
      const paymentMethod = parsed.paymentMethod === 'mobile' ? 'mobile' : 'stripe';
      return {
        paymentMethod,
        phoneNumber: String(parsed.phoneNumber || ''),
        pendingCheckout: Boolean(parsed.pendingCheckout),
      };
    } catch {
      return { paymentMethod: 'stripe', phoneNumber: '', pendingCheckout: false };
    }
  }

  private writeCheckoutState(state: CheckoutState) {
    if (!this.isBrowser()) return;
    localStorage.setItem(this.checkoutStateKey, JSON.stringify(state));
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }
}
