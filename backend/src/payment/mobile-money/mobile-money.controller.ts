import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { MobileMoneyService } from './mobile-money.service';

@Controller('payment/mobile-money')
export class MobileMoneyController {
  constructor(private readonly mobileMoneyService: MobileMoneyService) {}

  @Post('initiate')
  async initiatePayment(@Body() body: { provider: 'mtn' | 'airtel'; phoneNumber: string; amount: number; currency?: string }) {
    try {
      const result = await this.mobileMoneyService.requestToPay(
        body.provider,
        body.phoneNumber,
        body.amount,
        body.currency || 'UGX'
      );
      return { success: true, referenceId: result.referenceId };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Get('status/:provider/:referenceId')
  async getPaymentStatus(@Param('provider') provider: 'mtn' | 'airtel', @Param('referenceId') referenceId: string) {
    try {
      const status = await this.mobileMoneyService.getPaymentStatus(provider, referenceId);
      return { success: true, status };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Post('authorize')
  async authorize(@Body() body: { callbackUrl?: string }) {
    try {
      const result = await this.mobileMoneyService.bcAuthorize(body.callbackUrl);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
