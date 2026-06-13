import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Album } from './album.entity';
import { User } from '../user/user.entity';
import { Figure } from '../figure/figure.entity';

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

  async unlockFigure(userId: number, figureName: string): Promise<Figure> {
    const album = await this.findOrCreateAlbum(userId);
    let figure = await this.figureRepository.findOne({
      where: { name: figureName, album: { id: album.id } },
    });

    if (!figure) {
      figure = this.figureRepository.create({
        name: figureName,
        obtained: true,
        album: album,
      });
    } else {
      figure.obtained = true;
    }

    return this.figureRepository.save(figure);
  }
}
