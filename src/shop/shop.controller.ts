import { Controller, Get, Post, Body } from '@nestjs/common';
import { ShopService } from './shop.service';
import { Shop } from './shop.entity';

@Controller('shop')
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @Get()
  findAll(): Promise<Shop[]> {
    return this.shopService.findAll();
  }

  @Post()
  create(@Body() body: Partial<Shop>): Promise<Shop> {
    return this.shopService.create(body);
  }
}
