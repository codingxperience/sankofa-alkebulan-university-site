import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';

interface PaymentData {
  amount: number;
  currency: string;
  paymentMethod: 'card' | 'mobile_money';
  // Card payment fields
  cardNumber?: string;
  expiryMonth?: string;
  expiryYear?: string;
  cvv?: string;
  cardholderName?: string;
  // Mobile money fields
  phoneNumber?: string;
  mobileProvider?: string;
  // Common fields
  email: string;
  description: string;
}

@Component({
  selector: 'app-payment',
  imports: [CommonModule, FormsModule],
  templateUrl: './payment.html',
  styleUrl: './payment.scss',
})
export class Payment implements OnInit {
  paymentData = signal<PaymentData>({
    amount: 0,
    currency: 'USD',
    paymentMethod: 'card',
    email: '',
    description: ''
  });

  isLoading = signal(false);
  error = signal('');
  success = signal('');

  mobileProviders = [
    { value: 'mtn', label: 'MTN Mobile Money' },
    { value: 'airtel', label: 'Airtel Money' },
    { value: 'vodafone', label: 'Vodafone Cash' },
    { value: 'orange', label: 'Orange Money' },
    { value: 'other', label: 'Other Provider' }
  ];

  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Read query parameters to pre-fill form
    this.route.queryParams.subscribe(params => {
      if (params['amount']) {
        this.paymentData.update(data => ({ ...data, amount: parseFloat(params['amount']) }));
      }
      if (params['description']) {
        this.paymentData.update(data => ({ ...data, description: params['description'] }));
      }
    });
  }

  updatePaymentMethod(method: 'card' | 'mobile_money') {
    this.paymentData.update(data => ({ ...data, paymentMethod: method }));
    this.error.set('');
  }

  onSubmit() {
    if (!this.validateForm()) {
      return;
    }

    this.isLoading.set(true);
    this.error.set('');
    this.success.set('');

    // In a real implementation, this would call your payment processor API
    this.http.post('http://localhost:3000/payment/process', this.paymentData())
      .subscribe({
        next: (response) => {
          this.isLoading.set(false);
          this.success.set('Payment processed successfully!');
          setTimeout(() => {
            this.router.navigate(['/home']);
          }, 2000);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.error.set(err.error?.message || 'Payment failed. Please try again.');
        }
      });
  }

  private validateForm(): boolean {
    const data = this.paymentData();

    if (!data.email || !data.amount || data.amount <= 0) {
      this.error.set('Please fill in all required fields');
      return false;
    }

    if (data.paymentMethod === 'card') {
      if (!data.cardNumber || !data.expiryMonth || !data.expiryYear || !data.cvv || !data.cardholderName) {
        this.error.set('Please fill in all card details');
        return false;
      }

      // Basic card number validation
      const cardNumber = data.cardNumber.replace(/\s/g, '');
      if (!/^\d{13,19}$/.test(cardNumber)) {
        this.error.set('Please enter a valid card number');
        return false;
      }
    } else if (data.paymentMethod === 'mobile_money') {
      if (!data.phoneNumber || !data.mobileProvider) {
        this.error.set('Please fill in mobile money details');
        return false;
      }

      // Basic phone number validation
      if (!/^\+?[\d\s-]{10,}$/.test(data.phoneNumber)) {
        this.error.set('Please enter a valid phone number');
        return false;
      }
    }

    return true;
  }

  formatCardNumber(event: any) {
    let value = event.target.value.replace(/\s/g, '');
    value = value.replace(/(\d{4})/g, '$1 ').trim();
    this.paymentData.update(data => ({ ...data, cardNumber: value }));
  }
}
