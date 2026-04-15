import { Body, Controller, Get, Post, Param, Req } from '@nestjs/common';
import { EventsService } from './events.service';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get('upcoming')
  async getUpcomingEvents() {
    return this.eventsService.getUpcomingEvents();
  }

  @Post(':id/register')
  async registerForEvent(
    @Param('id') id: string,
    @Body() body: { name: string; email: string; phone?: string },
    @Req() req: any,
  ) {
    const userId = String(req?.user?.id || '').trim() || null;
    return this.eventsService.registerForEvent(id, {
      name: body.name,
      email: body.email,
      phone: body.phone,
      userId,
    });
  }
}
