import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Album } from '../album/album.entity'; 

@Entity()
export class Figure {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ default: false })
  obtained: boolean;

  @ManyToOne(() => Album, (album) => album.figures)
  album: Album;
}