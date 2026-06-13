import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) throw new NotFoundException(`User #${id} not found`);
    return user;
  }

  create(data: Partial<User>): Promise<User> {
    const user = this.userRepository.create(data);
    return this.userRepository.save(user);
  }

  async update(id: number, data: Partial<User>): Promise<User> {
    await this.userRepository.update(id, data);
    return this.findOne(id);
  }

  async login(email: string, password?: string): Promise<User> {
    const user = await this.userRepository.findOneBy({ email });
    if (!user || user.password !== password) {
      throw new NotFoundException('Credenciales incorrectas');
    }
    return user;
  }

  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    
    // Eliminar manualmente relaciones para evitar restricciones de clave foránea activas en la BD
    try {
      await this.userRepository.query('DELETE FROM "cart_items_shop" WHERE "cartId" IN (SELECT id FROM "cart" WHERE "userId" = $1)', [id]);
    } catch (e) {}
    try {
      await this.userRepository.query('DELETE FROM "cart" WHERE "userId" = $1', [id]);
    } catch (e) {}
    try {
      await this.userRepository.query('DELETE FROM "figure" WHERE "albumId" IN (SELECT id FROM "album" WHERE "userId" = $1)', [id]);
    } catch (e) {}
    try {
      await this.userRepository.query('DELETE FROM "album" WHERE "userId" = $1', [id]);
    } catch (e) {}

    await this.userRepository.remove(user);
  }
}