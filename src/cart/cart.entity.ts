import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, ManyToMany, JoinTable } from 'typeorm';
import { User } from '../user/user.entity';
import { Shop } from '../shop/shop.entity';

@Entity()
export class Cart {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  brand: string;

  @Column()
  model: string;

  @ManyToOne(() => User, (user) => user.carts)
  user: User;

  @ManyToMany(() => Shop, (shop) => shop.carts)
  @JoinTable()
  shops: Shop[];
}