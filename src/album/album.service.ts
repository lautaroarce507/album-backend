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

  async unlockFigure(userId: number, figureName: string, isGolden = false): Promise<{ figure: Figure; isDuplicate: boolean }> {
    const album = await this.findOrCreateAlbum(userId);
    const existing = await this.figureRepository.findOne({
      where: { name: figureName, album: { id: album.id }, isDuplicate: false },
    });

    if (!existing) {
      // Primera vez que se obtiene: guardar como obtenida
      const figure = this.figureRepository.create({
        name: figureName,
        obtained: true,
        isGolden: isGolden,
        isDuplicate: false,
        album: album,
      });
      const saved = await this.figureRepository.save(figure);
      return { figure: saved, isDuplicate: false };
    } else {
      // Ya se tiene: si el nuevo cromo es dorado y el existente no, lo mejoramos a dorado!
      if (isGolden && !existing.isGolden) {
        existing.isGolden = true;
        await this.figureRepository.save(existing);
      }

      // guardar como duplicado en la pila
      const duplicate = this.figureRepository.create({
        name: figureName,
        obtained: true,
        isGolden: isGolden,
        isDuplicate: true,
        album: album,
      });
      const saved = await this.figureRepository.save(duplicate);
      return { figure: saved, isDuplicate: true };
    }
  }

  async unlockRandomFigures(userId: number, count: number, isGolden = false): Promise<{ figure: Figure; isDuplicate: boolean }[]> {
    const results: { figure: Figure; isDuplicate: boolean }[] = [];
    for (let i = 0; i < count; i++) {
      const randomIndex = Math.floor(Math.random() * ALL_STICKERS.length);
      const stickerName = ALL_STICKERS[randomIndex];
      const result = await this.unlockFigure(userId, stickerName, isGolden);
      results.push(result);
    }
    return results;
  }

  async getDuplicates(userId: number): Promise<Figure[]> {
    const album = await this.findOrCreateAlbum(userId);
    return this.figureRepository.find({
      where: { album: { id: album.id }, isDuplicate: true },
    });
  }
}
