import { Controller, Get, Post, Param, Body, ParseIntPipe } from '@nestjs/common';
import { EnvelopeService } from './envelope.service';
import { Envelope } from './envelope.entity';

@Controller('users/:userId/envelopes')
export class EnvelopeController {
  constructor(private readonly envelopeService: EnvelopeService) {}

  @Get()
  getEnvelopes(@Param('userId', ParseIntPipe) userId: number): Promise<Envelope> {
    return this.envelopeService.findOrCreateEnvelope(userId);
  }

  @Post('claim')
  claimFree(@Param('userId', ParseIntPipe) userId: number): Promise<{ envelope: Envelope; message: string }> {
    return this.envelopeService.claimFree(userId);
  }

  @Post('open')
  openEnvelope(
    @Param('userId', ParseIntPipe) userId: number,
    @Body('type') type: 'normal' | 'golden',
  ): Promise<any[]> {
    return this.envelopeService.openEnvelope(userId, type);
  }
}
