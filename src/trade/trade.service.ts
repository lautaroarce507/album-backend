import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trade } from './trade.entity';
import { User } from '../user/user.entity';
import { Figure } from '../figure/figure.entity';
import { AlbumService } from '../album/album.service';

@Injectable()
export class TradeService {
  constructor(
    @InjectRepository(Trade)
    private readonly tradeRepository: Repository<Trade>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Figure)
    private readonly figureRepository: Repository<Figure>,
    private readonly albumService: AlbumService,
  ) {}

  async getPendingTrades(): Promise<Trade[]> {
    return this.tradeRepository.find({
      where: { status: 'pending' },
      relations: { creator: true },
      order: { createdAt: 'DESC' },
    });
  }

  async getUserTrades(userId: number): Promise<Trade[]> {
    return this.tradeRepository.find({
      where: { creator: { id: userId } },
      relations: { creator: true, receiver: true },
      order: { createdAt: 'DESC' },
    });
  }

  async createTrade(
    userId: number,
    offeredFigureName: string,
    requestedFigureName: string,
  ): Promise<Trade> {
    const creator = await this.userRepository.findOne({ where: { id: userId } });
    if (!creator) throw new NotFoundException('Usuario creador no encontrado');

    const album = await this.albumService.findOrCreateAlbum(userId);

    // Verificar que el creador tenga el cromo ofrecido como duplicado
    const duplicate = await this.figureRepository.findOne({
      where: { album: { id: album.id }, name: offeredFigureName, isDuplicate: true },
    });

    if (!duplicate) {
      throw new BadRequestException('No tienes este cromo repetido para ofrecer en intercambio');
    }

    const trade = this.tradeRepository.create({
      creator: creator,
      offeredFigureName,
      requestedFigureName,
      status: 'pending',
    });

    return this.tradeRepository.save(trade);
  }

  async cancelTrade(userId: number, tradeId: number): Promise<Trade> {
    const trade = await this.tradeRepository.findOne({
      where: { id: tradeId },
      relations: { creator: true },
    });

    if (!trade) throw new NotFoundException('Propuesta de intercambio no encontrada');
    if (trade.creator.id !== userId) {
      throw new BadRequestException('No puedes cancelar un intercambio que no creaste');
    }
    if (trade.status !== 'pending') {
      throw new BadRequestException('Solo se pueden cancelar intercambios pendientes');
    }

    trade.status = 'cancelled';
    return this.tradeRepository.save(trade);
  }

  async deleteTrade(userId: number, tradeId: number): Promise<void> {
    const trade = await this.tradeRepository.findOne({
      where: { id: tradeId },
      relations: { creator: true },
    });

    if (!trade) throw new NotFoundException('Propuesta de intercambio no encontrada');
    if (trade.creator.id !== userId) {
      throw new BadRequestException('No puedes eliminar un intercambio que no creaste');
    }
    if (trade.status === 'pending') {
      throw new BadRequestException('Cancela la propuesta antes de eliminarla');
    }

    await this.tradeRepository.remove(trade);
  }

  async acceptTrade(acceptorId: number, tradeId: number): Promise<Trade> {
    const trade = await this.tradeRepository.findOne({
      where: { id: tradeId },
      relations: { creator: true },
    });

    if (!trade) throw new NotFoundException('Propuesta de intercambio no encontrada');
    if (trade.status !== 'pending') {
      throw new BadRequestException('Esta propuesta ya no está disponible');
    }
    if (trade.creator.id === acceptorId) {
      throw new BadRequestException('No puedes aceptar tu propio intercambio');
    }

    const acceptor = await this.userRepository.findOne({ where: { id: acceptorId } });
    if (!acceptor) throw new NotFoundException('Usuario receptor no encontrado');

    const creatorAlbum = await this.albumService.findOrCreateAlbum(trade.creator.id);
    const acceptorAlbum = await this.albumService.findOrCreateAlbum(acceptorId);

    // 1. Verificar que el receptor tenga el cromo solicitado como duplicado
    const acceptorDuplicate = await this.figureRepository.findOne({
      where: { album: { id: acceptorAlbum.id }, name: trade.requestedFigureName, isDuplicate: true },
    });

    if (!acceptorDuplicate) {
      throw new BadRequestException('No tienes el cromo solicitado repetido para realizar el intercambio');
    }

    // 2. Verificar que el creador mantenga el cromo ofrecido como duplicado
    const creatorDuplicate = await this.figureRepository.findOne({
      where: { album: { id: creatorAlbum.id }, name: trade.offeredFigureName, isDuplicate: true },
    });

    if (!creatorDuplicate) {
      throw new BadRequestException('El creador ya no posee el cromo ofrecido como duplicado');
    }

    // --- Ejecutar el intercambio ---

    // A. El creador pierde el ofrecido (eliminar 1 copia duplicada)
    await this.figureRepository.remove(creatorDuplicate);

    // B. El creador gana el solicitado
    const creatorHasRequested = await this.figureRepository.findOne({
      where: { album: { id: creatorAlbum.id }, name: trade.requestedFigureName, isDuplicate: false },
    });

    const creatorNewFigure = this.figureRepository.create({
      name: trade.requestedFigureName,
      obtained: true,
      isGolden: acceptorDuplicate.isGolden,
      isDuplicate: !!creatorHasRequested,
      album: creatorAlbum,
    });
    await this.figureRepository.save(creatorNewFigure);

    // C. El receptor pierde el solicitado (eliminar 1 copia duplicada)
    await this.figureRepository.remove(acceptorDuplicate);

    // D. El receptor gana el ofrecido
    const acceptorHasOffered = await this.figureRepository.findOne({
      where: { album: { id: acceptorAlbum.id }, name: trade.offeredFigureName, isDuplicate: false },
    });

    const acceptorNewFigure = this.figureRepository.create({
      name: trade.offeredFigureName,
      obtained: true,
      isGolden: creatorDuplicate.isGolden,
      isDuplicate: !!acceptorHasOffered,
      album: acceptorAlbum,
    });
    await this.figureRepository.save(acceptorNewFigure);

    // E. Actualizar estado de la propuesta
    trade.status = 'completed';
    trade.receiver = acceptor;
    const savedTrade = await this.tradeRepository.save(trade);

    // F. Limpieza de propuestas obsoletas:
    // Si el creador se quedó sin duplicados del cromo que ofreció, cancelamos sus otras propuestas que ofrezcan ese mismo cromo.
    const creatorDupsCount = await this.figureRepository.count({
      where: { album: { id: creatorAlbum.id }, name: trade.offeredFigureName, isDuplicate: true },
    });
    if (creatorDupsCount === 0) {
      await this.tradeRepository.update(
        { creator: { id: trade.creator.id }, offeredFigureName: trade.offeredFigureName, status: 'pending' },
        { status: 'cancelled' }
      );
    }

    // Si el receptor se quedó sin duplicados del cromo que entregó, cancelamos sus otras propuestas que ofrezcan ese mismo cromo.
    const receiverDupsCount = await this.figureRepository.count({
      where: { album: { id: acceptorAlbum.id }, name: trade.requestedFigureName, isDuplicate: true },
    });
    if (receiverDupsCount === 0) {
      await this.tradeRepository.update(
        { creator: { id: acceptorId }, offeredFigureName: trade.requestedFigureName, status: 'pending' },
        { status: 'cancelled' }
      );
    }

    return savedTrade;
  }
}
