import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cart } from './cart.entity';
import { CartItem } from './cart-item.entity';
import { User } from '../user/user.entity';
import { Shop } from '../shop/shop.entity';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { AlbumModule } from '../album/album.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Cart, CartItem, User, Shop]),
    AlbumModule,
  ],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}
