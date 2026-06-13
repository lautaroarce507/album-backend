import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from './cart.entity';
import { CartItem } from './cart-item.entity';
import { User } from '../user/user.entity';
import { Shop } from '../shop/shop.entity';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private readonly cartItemRepository: Repository<CartItem>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Shop)
    private readonly shopRepository: Repository<Shop>,
  ) {}

  async findOrCreateCart(userId: number): Promise<any> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    let cart = await this.cartRepository.findOne({
      where: { user: { id: userId } },
      relations: { items: { product: true } },
    });

    if (!cart) {
      cart = this.cartRepository.create({
        user: user,
        items: [],
      });
      cart = await this.cartRepository.save(cart);
    }

    return {
      id: cart.id,
      items: (cart.items || []).map((item) => item.product),
    };
  }

  async addToCart(userId: number, productId: number): Promise<any> {
    let cart = await this.cartRepository.findOne({
      where: { user: { id: userId } },
      relations: { items: { product: true } },
    });

    if (!cart) {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) throw new NotFoundException('Usuario no encontrado');
      cart = this.cartRepository.create({
        user: user,
        items: [],
      });
      cart = await this.cartRepository.save(cart);
    }

    const product = await this.shopRepository.findOne({ where: { id: productId } });
    if (!product) throw new NotFoundException('Producto no encontrado en la tienda');

    const cartItem = this.cartItemRepository.create({
      cart: cart,
      product: product,
    });
    await this.cartItemRepository.save(cartItem);

    return this.findOrCreateCart(userId);
  }

  async clearCart(userId: number): Promise<any> {
    const cart = await this.cartRepository.findOne({
      where: { user: { id: userId } },
    });
    if (cart) {
      await this.cartItemRepository.delete({ cart: { id: cart.id } });
    }
    return this.findOrCreateCart(userId);
  }
}
