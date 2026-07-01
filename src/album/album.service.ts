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
  '/assets/3.png', '/assets/equipo_argentina.jpg', '/assets/leyenda_maradona.jpg',
  // Paises Bajos
  '/assets/van%20dijk.png', '/assets/dumfries.png', '/assets/de%20jong.png', '/assets/simons.png',
  '/assets/gakpo.png', '/assets/depay.png', '/assets/koeman.png', '/assets/reijnders.png',
  '/assets/van%20de%20ven.png', '/assets/verbruggen.png', '/assets/gravenberch.png', '/assets/malen.png',
  '/assets/escudo_paises_bajos.png', '/assets/equipo_paises_bajos.jpg', '/assets/leyenda_cruyff.jpg',
  // Mexico
  '/assets/lozano.png', '/assets/jimenez.png', '/assets/gallardo.png', '/assets/montes.png',
  '/assets/vasquez.png', '/assets/vega.png', '/assets/reyes.png', '/assets/alvarado.png',
  '/assets/malagon.png', '/assets/ruiz.png', '/assets/edison.png', '/assets/aguirre.png',
  '/assets/escudo_mexico.png', '/assets/equipo_mexico.jpg', '/assets/leyenda_sanchez.jpg'
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

  // Elimina de la BD todos los duplicados de figuritas leyenda del álbum dado
  private async purgeLegendDuplicates(albumId: number): Promise<void> {
    const legendDups = await this.figureRepository.find({
      where: { album: { id: albumId }, isDuplicate: true },
    });
    const toDelete = legendDups.filter(f => f.name.includes('leyenda_'));
    if (toDelete.length > 0) {
      await this.figureRepository.remove(toDelete);
    }
  }

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

    // Limpieza automática: eliminar duplicados de leyendas si los hubiera
    await this.purgeLegendDuplicates(album.id);
    // Recargar el álbum para que figures esté actualizado
    album = await this.albumRepository.findOne({
      where: { id: album.id },
      relations: { figures: true },
    });

    if (!album) throw new NotFoundException('Álbum no encontrado');

    return album;
  }

  async unlockFigure(userId: number, figureName: string, isGolden = false): Promise<{ figure: Figure; isDuplicate: boolean }> {
    const album = await this.findOrCreateAlbum(userId);
    const existing = await this.figureRepository.findOne({
      where: { name: figureName, album: { id: album.id }, isDuplicate: false },
    });

    // Las figuritas leyenda NUNCA pueden ser repetidas: si ya la tiene, se ignora
    if (existing && figureName.includes('leyenda_')) {
      return { figure: existing, isDuplicate: false };
    }

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

    const album = await this.findOrCreateAlbum(userId);

    // Find which legends the user already owns (non-duplicate)
    const ownedLegends = new Set(
      album.figures
        .filter(f => f.obtained && !f.isDuplicate && f.name.includes('leyenda_'))
        .map(f => f.name)
    );

    const allLegends = ALL_STICKERS.filter(s => s.includes('leyenda_'));
    const commons = ALL_STICKERS.filter(s => !s.includes('leyenda_'));

    for (let i = 0; i < count; i++) {
      // Only consider legends the user doesn't already have
      const availableLegends = allLegends.filter(s => !ownedLegends.has(s));

      const isLegendRoll = Math.random() < 0.01 && availableLegends.length > 0;
      let stickerName: string;

      if (isLegendRoll) {
        stickerName = availableLegends[Math.floor(Math.random() * availableLegends.length)];
        // Mark as owned so it won't appear again in this same batch
        ownedLegends.add(stickerName);
      } else {
        stickerName = commons[Math.floor(Math.random() * commons.length)];
      }

      const forceGolden = stickerName.includes('leyenda_') || isGolden;
      const result = await this.unlockFigure(userId, stickerName, forceGolden);
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
