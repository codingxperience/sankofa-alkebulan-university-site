import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface RegisterEventInput {
  name: string;
  email: string;
  phone?: string;
  userId?: string | null;
}

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async getUpcomingEvents() {
    const now = new Date();
    const events = await this.prisma.event.findMany({
      where: {
        status: 'active',
        startsAt: { gte: now },
      },
      orderBy: { startsAt: 'asc' },
      take: 20,
    });

    return events.map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description || '',
      startsAt: event.startsAt.toISOString(),
      endsAt: event.endsAt ? event.endsAt.toISOString() : null,
      location: event.location || 'Virtual Event',
      attendees: event.attendees || 0,
      status: event.status,
      createdAt: event.createdAt.toISOString(),
    }));
  }

  async registerForEvent(eventId: string, input: RegisterEventInput) {
    const normalizedEventId = String(eventId || '').trim();
    const normalizedName = String(input?.name || '').trim();
    const normalizedEmail = String(input?.email || '').trim().toLowerCase();
    const normalizedPhone = input?.phone ? String(input.phone).trim() : null;
    const normalizedUserId = input?.userId ? String(input.userId).trim() : null;

    if (!normalizedEventId || !normalizedName || !normalizedEmail) {
      throw new BadRequestException('Event id, name, and email are required.');
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      throw new BadRequestException('Please provide a valid email address.');
    }

    const event = await this.prisma.event.findUnique({
      where: { id: normalizedEventId },
    });
    if (!event) {
      throw new NotFoundException('Event not found.');
    }

    if (String(event.status || '').toLowerCase() !== 'active') {
      throw new BadRequestException('This event is not open for registration.');
    }

    if (event.startsAt < new Date()) {
      throw new BadRequestException('Registration for this event has closed.');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const existing = await (tx as any).eventRegistration.findUnique({
        where: {
          eventId_email: {
            eventId: normalizedEventId,
            email: normalizedEmail,
          },
        },
      });

      if (existing) {
        return {
          alreadyRegistered: true,
          registration: existing,
        };
      }

      const registration = await (tx as any).eventRegistration.create({
        data: {
          eventId: normalizedEventId,
          userId: normalizedUserId || undefined,
          name: normalizedName,
          email: normalizedEmail,
          phone: normalizedPhone || undefined,
        },
      });

      await tx.event.update({
        where: { id: normalizedEventId },
        data: {
          attendees: {
            increment: 1,
          },
        },
      });

      return {
        alreadyRegistered: false,
        registration,
      };
    });

    return {
      message: result.alreadyRegistered
        ? 'You are already registered for this event.'
        : 'Event registration successful.',
      alreadyRegistered: result.alreadyRegistered,
      registration: {
        id: result.registration.id,
        eventId: result.registration.eventId,
        email: result.registration.email,
        name: result.registration.name,
        phone: result.registration.phone,
        createdAt: result.registration.createdAt.toISOString(),
      },
    };
  }
}
