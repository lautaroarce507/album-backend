import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shop } from './shop.entity';

@Injectable()
export class ShopService implements OnModuleInit {
  constructor(
    @InjectRepository(Shop)
    private readonly shopRepository: Repository<Shop>,
  ) {}

  async onModuleInit() {
    const count = await this.shopRepository.count();
    if (count === 0) {
      await this.shopRepository.save([
        {
          name: 'Figurita Dorada',
          price: 1000,
          image: '/assets/figurita dorada.png',
          description: 'Figurita dorada Aleatoria.',
          stickersCount: 1,
        },
        {
          name: 'Sobre de figuritas',
          price: 2500,
          image: '/assets/sobre de figuritas.png',
          description: 'Sobre con 7 figuritas.',
          stickersCount: 7,
        },
      ]);
      console.log('Seeded shop products.');
    }
  }

  async findAll(): Promise<Shop[]> {
    return this.shopRepository.find({ order: { createdAt: 'DESC' } });
  }

  async create(data: Partial<Shop>): Promise<Shop> {
    const item = this.shopRepository.create(data);
    return this.shopRepository.save(item);
  }
}
