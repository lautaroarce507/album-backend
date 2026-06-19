import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Envelope } from './envelope.entity';
import { User } from '../user/user.entity';
import { EnvelopeService } from './envelope.service';
import { EnvelopeController } from './envelope.controller';
import { AlbumModule } from '../album/album.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Envelope, User]),
    AlbumModule,
  ],
  controllers: [EnvelopeController],
  providers: [EnvelopeService],
  exports: [EnvelopeService],
})
export class EnvelopeModule {}
