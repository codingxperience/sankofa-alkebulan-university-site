import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface AdmissionInquiryInput {
  fullName: string;
  email: string;
  country: string;
  studyLevel: string;
  preferredSchool: string;
  notes?: string;
}

interface ContactInquiryInput {
  fullName: string;
  email: string;
  department: string;
  subject: string;
  message: string;
}

@Injectable()
export class InquiriesService {
  private ensureTablePromise: Promise<void> | null = null;

  constructor(private readonly prisma: PrismaService) {}

  async createAdmissionsInquiry(input: AdmissionInquiryInput) {
    const payload = this.normalizeAdmissionInput(input);
    await this.ensureStorageReady();

    const rows = await this.prisma.$queryRaw<
      Array<{ id: string; inquiry_type: string; created_at: Date }>
    >`
      INSERT INTO university_inquiry (
        id,
        inquiry_type,
        full_name,
        email,
        country,
        study_level,
        preferred_school,
        notes
      )
      VALUES (
        ${crypto.randomUUID()},
        'admissions',
        ${payload.fullName},
        ${payload.email},
        ${payload.country},
        ${payload.studyLevel},
        ${payload.preferredSchool},
        ${payload.notes}
      )
      RETURNING id, inquiry_type, created_at
    `;

    const inquiry = rows[0];
    return {
      message: 'Admissions inquiry submitted successfully.',
      inquiry: {
        id: inquiry.id,
        type: inquiry.inquiry_type,
        createdAt: inquiry.created_at.toISOString(),
      },
    };
  }

  async createContactInquiry(input: ContactInquiryInput) {
    const payload = this.normalizeContactInput(input);
    await this.ensureStorageReady();

    const rows = await this.prisma.$queryRaw<
      Array<{ id: string; inquiry_type: string; created_at: Date }>
    >`
      INSERT INTO university_inquiry (
        id,
        inquiry_type,
        full_name,
        email,
        department,
        subject,
        message
      )
      VALUES (
        ${crypto.randomUUID()},
        'contact',
        ${payload.fullName},
        ${payload.email},
        ${payload.department},
        ${payload.subject},
        ${payload.message}
      )
      RETURNING id, inquiry_type, created_at
    `;

    const inquiry = rows[0];
    return {
      message: 'Administrative inquiry submitted successfully.',
      inquiry: {
        id: inquiry.id,
        type: inquiry.inquiry_type,
        createdAt: inquiry.created_at.toISOString(),
      },
    };
  }

  private async ensureStorageReady() {
    if (!this.ensureTablePromise) {
      this.ensureTablePromise = this.createStorageTable();
    }
    await this.ensureTablePromise;
  }

  private async createStorageTable() {
    await this.prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS university_inquiry (
        id TEXT PRIMARY KEY,
        inquiry_type TEXT NOT NULL,
        full_name TEXT NOT NULL,
        email TEXT NOT NULL,
        country TEXT,
        study_level TEXT,
        preferred_school TEXT,
        department TEXT,
        subject TEXT,
        message TEXT,
        notes TEXT,
        status TEXT NOT NULL DEFAULT 'new',
        source TEXT NOT NULL DEFAULT 'website',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await this.prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_university_inquiry_type_created
      ON university_inquiry (inquiry_type, created_at DESC)
    `);
  }

  private normalizeAdmissionInput(input: AdmissionInquiryInput) {
    const fullName = String(input?.fullName || '').trim();
    const email = String(input?.email || '').trim().toLowerCase();
    const country = String(input?.country || '').trim();
    const studyLevel = String(input?.studyLevel || '').trim();
    const preferredSchool = String(input?.preferredSchool || '').trim();
    const notes = input?.notes ? String(input.notes).trim() : '';

    if (fullName.length < 3) {
      throw new BadRequestException('Full name must be at least 3 characters.');
    }
    if (!this.isValidEmail(email)) {
      throw new BadRequestException('Please provide a valid email address.');
    }
    if (country.length < 2) {
      throw new BadRequestException('Country is required.');
    }
    if (studyLevel.length < 3) {
      throw new BadRequestException('Study level is required.');
    }
    if (preferredSchool.length < 4) {
      throw new BadRequestException('Preferred school or program is required.');
    }

    return {
      fullName,
      email,
      country,
      studyLevel,
      preferredSchool,
      notes: notes || null,
    };
  }

  private normalizeContactInput(input: ContactInquiryInput) {
    const fullName = String(input?.fullName || '').trim();
    const email = String(input?.email || '').trim().toLowerCase();
    const department = String(input?.department || '').trim();
    const subject = String(input?.subject || '').trim();
    const message = String(input?.message || '').trim();

    if (fullName.length < 3) {
      throw new BadRequestException('Full name must be at least 3 characters.');
    }
    if (!this.isValidEmail(email)) {
      throw new BadRequestException('Please provide a valid email address.');
    }
    if (department.length < 3) {
      throw new BadRequestException('Department is required.');
    }
    if (subject.length < 5) {
      throw new BadRequestException('Subject must be at least 5 characters.');
    }
    if (message.length < 20) {
      throw new BadRequestException('Message must be at least 20 characters.');
    }

    return {
      fullName,
      email,
      department,
      subject,
      message,
    };
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}
