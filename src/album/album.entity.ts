import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { User } from '../user/user.entity';
import { Figure } from '../figure/figure.entity';

@Entity()
export class Album {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @ManyToOne(() => User, (user) => user.albums, { onDelete: 'CASCADE' })
  user: User;

  @OneToMany(() => Figure, (figure) => figure.album)
  figures: Figure[];
}