import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { ShopModule } from './shop/shop.module';
import { AlbumModule } from './album/album.module';
import { CartModule } from './cart/cart.module';
import { EnvelopeModule } from './envelope/envelope.module';
import { TradeModule } from './trade/trade.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      //url: "postgresql://postgres.udcsygmzjxsyctytoqnb:lauchaarce15@aws-1-us-east-1.pooler.supabase.com:5432/postgres",
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: '1234',
      database: 'postgres',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
    }),
    UserModule,
    ShopModule,
    AlbumModule,
    CartModule,
    EnvelopeModule,
    TradeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
