import { Controller, Get, Post, Delete, Param, Body, ParseIntPipe } from '@nestjs/common';
import { CartService } from './cart.service';

@Controller('users/:userId/cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@Param('userId', ParseIntPipe) userId: number): Promise<any> {
    return this.cartService.findOrCreateCart(userId);
  }

  @Post()
  addToCart(
    @Param('userId', ParseIntPipe) userId: number,
    @Body('productId') productId: number,
  ): Promise<any> {
    return this.cartService.addToCart(userId, productId);
  }

  @Delete()
  clearCart(@Param('userId', ParseIntPipe) userId: number): Promise<any> {
    return this.cartService.clearCart(userId);
  }
}
