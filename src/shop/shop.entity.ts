import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { Cart } from '../cart/cart.entity';

@Entity()
export class Shop {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  address: string;

  @ManyToMany(() => Cart, (cart) => cart.shops)
  carts: Cart[];
}