import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Shop {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column('float', { default: 0 })
  price: number;

  @Column({ default: 5 })
  stickersCount: number;

  @Column({ default: '' })
  image: string;

  @Column({ default: '' })
  description: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}