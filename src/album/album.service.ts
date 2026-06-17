import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Album } from './album.entity';
import { User } from '../user/user.entity';
import { Figure } from '../figure/figure.entity';

const ALL_STICKERS = [
  // Argentina
  '/assets/dibu.png', '/assets/molina.png', '/assets/romero.png', '/assets/otamendi.png',
  '/assets/mac%20allister.png', '/assets/de%20paul.png', '/assets/enzo.png', '/assets/messi.png',
  '/assets/julian.png', '/assets/lautaro.png', '/assets/simeone.png', '/assets/scaloni.png',
  // Paises Bajos
  '/assets/van%20dijk.png', '/assets/dumfries.png', '/assets/de%20jong.png', '/assets/simons.png',
  '/assets/gakpo.png', '/assets/depay.png', '/assets/koeman.png', '/assets/reijnders.png',
  '/assets/van%20de%20ven.png', '/assets/verbruggen.png', '/assets/gravenberch.png', '/assets/malen.png',
  // Mexico
  '/assets/lozano.png', '/assets/jimenez.png', '/assets/gallardo.png', '/assets/montes.png',
  '/assets/vasquez.png', '/assets/vega.png', '/assets/reyes.png', '/assets/alvarado.png',
  '/assets/malagon.png', '/assets/ruiz.png', '/assets/edison.png', '/assets/aguirre.png'
];

@Injectable()
export class AlbumService {
  constructor(
    @InjectRepository(Album)
    private readonly albumRepository: Repository<Album>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Figure)
    private readonly figureRepository: Repository<Figure>,
  ) {}

  async findOrCreateAlbum(userId: number): Promise<Album> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    let album = await this.albumRepository.findOne({
      where: { user: { id: userId } },
      relations: { figures: true },
    });

    if (!album) {
      album = this.albumRepository.create({
        title: `Álbum de ${user.name}`,
        user: user,
        figures: [],
      });
      album = await this.albumRepository.save(album);
    }

    return album;
  }

  async unlockFigure(userId: number, figureName: string, isGolden = false): Promise<Figure> {
    const album = await this.findOrCreateAlbum(userId);
    let figure = await this.figureRepository.findOne({
      where: { name: figureName, album: { id: album.id } },
    });

    if (!figure) {
      figure = this.figureRepository.create({
        name: figureName,
        obtained: true,
        isGolden: isGolden,
        album: album,
      });
    } else {
      figure.obtained = true;
      if (isGolden) {
        figure.isGolden = true;
      }
    }

    return this.figureRepository.save(figure);
  }

  async unlockRandomFigures(userId: number, count: number, isGolden = false): Promise<Figure[]> {
    const figuresUnlocked: Figure[] = [];
    for (let i = 0; i < count; i++) {
      const randomIndex = Math.floor(Math.random() * ALL_STICKERS.length);
      const stickerName = ALL_STICKERS[randomIndex];
      const fig = await this.unlockFigure(userId, stickerName, isGolden);
      figuresUnlocked.push(fig);
    }
    return figuresUnlocked;
  }
}
