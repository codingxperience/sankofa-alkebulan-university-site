import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class MobileMoneyService {
  private readonly mtnBaseUrl = process.env.NODE_ENV === 'production' ? 'https://momodeveloper.mtn.com' : 'https://sandbox.momodeveloper.mtn.com';
  private readonly airtelBaseUrl = 'https://openapi.airtel.africa'; // Adjust for Uganda

  // MTN
  private readonly mtnApiKey = process.env.MTN_API_KEY;
  private readonly mtnApiSecret = process.env.MTN_API_SECRET;
  private readonly mtnSubscriptionKey = process.env.MTN_SUBSCRIPTION_KEY;
  private readonly mtnCallbackUrl = process.env.MTN_CALLBACK_URL;

  // Airtel
  private readonly airtelApiKey = process.env.AIRTEL_API_KEY;
  private readonly airtelApiSecret = process.env.AIRTEL_API_SECRET;
  private readonly airtelClientId = process.env.AIRTEL_CLIENT_ID;
  private readonly airtelCallbackUrl = process.env.AIRTEL_CALLBACK_URL;

  async requestToPay(provider: 'mtn' | 'airtel', phoneNumber: string, amount: number, currency = 'UGX'): Promise<any> {
    if (provider === 'mtn') {
      return this.requestToPayMTN(phoneNumber, amount, currency);
    } else if (provider === 'airtel') {
      return this.requestToPayAirtel(phoneNumber, amount, currency);
    }
    throw new Error('Unsupported provider');
  }

  private async requestToPayMTN(phoneNumber: string, amount: number, currency = 'UGX'): Promise<any> {
    const token = await this.getMTNAccessToken();
    const referenceId = this.generateReferenceId();

    const response = await axios.post(`${this.mtnBaseUrl}/collection/v1_0/requesttopay`, {
      amount,
      currency,
      externalId: referenceId,
      payer: {
        partyIdType: 'MSISDN',
        partyId: phoneNumber,
      },
      payerMessage: 'Payment for Sankofa purchase',
      payeeNote: 'Thank you for your purchase',
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Reference-Id': referenceId,
        'X-Target-Environment': process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
        'Ocp-Apim-Subscription-Key': this.mtnSubscriptionKey,
        'Content-Type': 'application/json',
      },
    });

    return { referenceId, status: response.status };
  }

  private async requestToPayAirtel(phoneNumber: string, amount: number, currency = 'UGX'): Promise<any> {
    // Airtel implementation - this is a simplified example, check Airtel docs for exact API
    const token = await this.getAirtelAccessToken();
    const referenceId = this.generateReferenceId();

    const response = await axios.post(`${this.airtelBaseUrl}/merchant/v1/payments/`, {
      reference: referenceId,
      subscriber: {
        country: 'UG',
        currency,
        msisdn: phoneNumber,
      },
      transaction: {
        amount,
        country: 'UG',
        currency,
        id: referenceId,
      },
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    return { referenceId, status: response.status };
  }

  private async getMTNAccessToken(): Promise<string> {
    const response = await axios.post(`${this.mtnBaseUrl}/collection/token/`, {}, {
      headers: {
        'Ocp-Apim-Subscription-Key': this.mtnSubscriptionKey,
        'Authorization': `Basic ${Buffer.from(`${this.mtnApiKey}:${this.mtnApiSecret}`).toString('base64')}`,
      },
    });
    return response.data.access_token;
  }

  async bcAuthorize(callbackUrl?: string): Promise<any> {
    const token = await this.getMTNAccessToken();
    const response = await axios.post(`${this.mtnBaseUrl}/collection/v1_0/bc-authorize`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Target-Environment': process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
        'Ocp-Apim-Subscription-Key': this.mtnSubscriptionKey,
        'X-Callback-Url': callbackUrl || this.mtnCallbackUrl,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  }

  private generateReferenceId(): string {
    return `sankofa-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async getPaymentStatus(provider: 'mtn' | 'airtel', referenceId: string): Promise<any> {
    if (provider === 'mtn') {
      return this.getMTNPaymentStatus(referenceId);
    } else if (provider === 'airtel') {
      return this.getAirtelPaymentStatus(referenceId);
    }
    throw new Error('Unsupported provider');
  }

  private async getMTNPaymentStatus(referenceId: string): Promise<any> {
    const token = await this.getMTNAccessToken();
    const response = await axios.get(`${this.mtnBaseUrl}/collection/v1_0/requesttopay/${referenceId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Target-Environment': process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
        'Ocp-Apim-Subscription-Key': this.mtnSubscriptionKey,
      },
    });
    return response.data;
  }

  private async getAirtelPaymentStatus(referenceId: string): Promise<any> {
    const token = await this.getAirtelAccessToken();
    const response = await axios.get(`${this.airtelBaseUrl}/standard/v1/payments/${referenceId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.data;
  }

  private async getAirtelAccessToken(): Promise<string> {
    // Simplified Airtel token request (adjust according to Airtel docs)
    const params = new URLSearchParams();
    params.append('client_id', this.airtelClientId || '');
    params.append('client_secret', this.airtelApiSecret || '');
    params.append('grant_type', 'client_credentials');

    const response = await axios.post(`${this.airtelBaseUrl}/auth/oauth2/token`, params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return response.data.access_token;
  }
}