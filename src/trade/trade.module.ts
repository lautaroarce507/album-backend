import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trade } from './trade.entity';
import { User } from '../user/user.entity';
import { Figure } from '../figure/figure.entity';
import { TradeService } from './trade.service';
import { TradeController } from './trade.controller';
import { AlbumModule } from '../album/album.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Trade, User, Figure]),
    AlbumModule,
  ],
  controllers: [TradeController],
  providers: [TradeService],
  exports: [TradeService],
})
export class TradeModule {}
