import { Body, Controller, Post } from '@nestjs/common';
import { InquiriesService } from './inquiries.service';

@Controller('inquiries')
export class InquiriesController {
  constructor(private readonly inquiriesService: InquiriesService) {}

  @Post('admissions')
  async createAdmissionsInquiry(
    @Body()
    body: {
      fullName: string;
      email: string;
      country: string;
      studyLevel: string;
      preferredSchool: string;
      notes?: string;
    },
  ) {
    return this.inquiriesService.createAdmissionsInquiry({
      fullName: body.fullName,
      email: body.email,
      country: body.country,
      studyLevel: body.studyLevel,
      preferredSchool: body.preferredSchool,
      notes: body.notes,
    });
  }

  @Post('contact')
  async createContactInquiry(
    @Body()
    body: {
      fullName: string;
      email: string;
      department: string;
      subject: string;
      message: string;
    },
  ) {
    return this.inquiriesService.createContactInquiry({
      fullName: body.fullName,
      email: body.email,
      department: body.department,
      subject: body.subject,
      message: body.message,
    });
  }
}
