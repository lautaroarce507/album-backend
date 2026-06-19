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

  @Column({ default: false })
  isGolden: boolean;

  @Column({ default: false })
  isDuplicate: boolean;

  @ManyToOne(() => Album, (album) => album.figures, { onDelete: 'CASCADE' })
  album: Album;
}