import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Envelope } from './envelope.entity';
import { User } from '../user/user.entity';
import { AlbumService } from '../album/album.service';

@Injectable()
export class EnvelopeService {
  constructor(
    @InjectRepository(Envelope)
    private readonly envelopeRepository: Repository<Envelope>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly albumService: AlbumService,
  ) {}

  async findOrCreateEnvelope(userId: number): Promise<Envelope> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    let envelope = await this.envelopeRepository.findOne({
      where: { user: { id: userId } },
    });

    if (!envelope) {
      envelope = this.envelopeRepository.create({
        user: user,
        normalCount: 0,
        goldenCount: 0,
        lastFreeClaim: null,
      });
      envelope = await this.envelopeRepository.save(envelope);
    }

    return envelope;
  }

  async addEnvelopes(userId: number, normal: number, golden: number): Promise<Envelope> {
    const envelope = await this.findOrCreateEnvelope(userId);
    envelope.normalCount += normal;
    envelope.goldenCount += golden;
    return this.envelopeRepository.save(envelope);
  }

  async claimFree(userId: number): Promise<{ envelope: Envelope; message: string }> {
    const envelope = await this.findOrCreateEnvelope(userId);
    const now = new Date();
    
    if (envelope.lastFreeClaim) {
      const lastClaimTime = new Date(envelope.lastFreeClaim).getTime();
      const diffMs = now.getTime() - lastClaimTime;
      const hoursLeft = 24 - diffMs / (1000 * 60 * 60);

      if (hoursLeft > 0) {
        throw new BadRequestException(
          `Ya has reclamado tu sobre diario. Inténtalo de nuevo en ${Math.ceil(hoursLeft)} horas.`
        );
      }
    }

    envelope.normalCount += 1;
    envelope.lastFreeClaim = now;
    const saved = await this.envelopeRepository.save(envelope);
    return { envelope: saved, message: '¡Sobre diario reclamado con éxito!' };
  }

  async openEnvelope(userId: number, type: 'normal' | 'golden'): Promise<any[]> {
    const envelope = await this.findOrCreateEnvelope(userId);

    if (type === 'normal') {
      if (envelope.normalCount <= 0) {
        throw new BadRequestException('No tienes sobres comunes para abrir');
      }
      envelope.normalCount -= 1;
      await this.envelopeRepository.save(envelope);
      return this.albumService.unlockRandomFigures(userId, 7, false);
    } else {
      if (envelope.goldenCount <= 0) {
        throw new BadRequestException('No tienes sobres dorados para abrir');
      }
      envelope.goldenCount -= 1;
      await this.envelopeRepository.save(envelope);
      return this.albumService.unlockRandomFigures(userId, 1, true);
    }
  }

  async openAllEnvelopes(userId: number): Promise<any[]> {
    const envelope = await this.findOrCreateEnvelope(userId);
    const { normalCount, goldenCount } = envelope;

    if (normalCount <= 0 && goldenCount <= 0) {
      throw new BadRequestException('No tienes sobres para abrir');
    }

    envelope.normalCount = 0;
    envelope.goldenCount = 0;
    await this.envelopeRepository.save(envelope);

    let results: any[] = [];
    if (normalCount > 0) {
      const normalResults = await this.albumService.unlockRandomFigures(userId, normalCount * 7, false);
      results = results.concat(normalResults);
    }
    if (goldenCount > 0) {
      const goldenResults = await this.albumService.unlockRandomFigures(userId, goldenCount * 1, true);
      results = results.concat(goldenResults);
    }
    return results;
  }
}
