import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { CheckoutController } from './checkout.controller';
import { MobileMoneyController } from './mobile-money/mobile-money.controller';
import { MobileMoneyService } from './mobile-money/mobile-money.service';
import { BooksModule } from '../books/books.module';

@Module({
  imports: [BooksModule],
  providers: [PaymentService, MobileMoneyService],
  controllers: [PaymentController, CheckoutController, MobileMoneyController]
})
export class PaymentModule {}
