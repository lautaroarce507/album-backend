import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from './cart.entity';
import { CartItem } from './cart-item.entity';
import { User } from '../user/user.entity';
import { Shop } from '../shop/shop.entity';
import { AlbumService } from '../album/album.service';
import { EnvelopeService } from '../envelope/envelope.service';

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
    private readonly albumService: AlbumService,
    private readonly envelopeService: EnvelopeService,
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

  async checkout(userId: number): Promise<any> {
    const cart = await this.cartRepository.findOne({
      where: { user: { id: userId } },
      relations: { items: { product: true } },
    });

    if (!cart || !cart.items || cart.items.length === 0) {
      throw new NotFoundException('El carrito está vacío');
    }

    // Process each product in the cart: store purchased envelopes/cards in Envelope database
    for (const item of cart.items) {
      const product = item.product;
      const isGolden = product.name.toLowerCase().includes('dorada');
      if (isGolden) {
        // Increment user's golden envelopes count
        await this.envelopeService.addEnvelopes(userId, 0, 1);
      } else {
        // Increment user's normal envelopes count
        await this.envelopeService.addEnvelopes(userId, 1, 0);
      }
    }

    // Empty the cart
    await this.cartItemRepository.delete({ cart: { id: cart.id } });

    return this.findOrCreateCart(userId);
  }
}
