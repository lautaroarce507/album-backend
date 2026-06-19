import { Controller, Get, Post, Param, Body, ParseIntPipe } from '@nestjs/common';
import { AlbumService } from './album.service';
import { Album } from './album.entity';
import { Figure } from '../figure/figure.entity';

@Controller('users/:userId/album')
export class AlbumController {
  constructor(private readonly albumService: AlbumService) {}

  @Get()
  getAlbum(@Param('userId', ParseIntPipe) userId: number): Promise<Album> {
    return this.albumService.findOrCreateAlbum(userId);
  }

  @Get('duplicates')
  getDuplicates(@Param('userId', ParseIntPipe) userId: number): Promise<Figure[]> {
    return this.albumService.getDuplicates(userId);
  }

  @Post('unlock')
  unlockFigure(
    @Param('userId', ParseIntPipe) userId: number,
    @Body('name') figureName: string,
  ): Promise<{ figure: Figure; isDuplicate: boolean }> {
    return this.albumService.unlockFigure(userId, figureName);
  }
}
