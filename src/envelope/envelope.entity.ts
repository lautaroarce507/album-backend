import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { User } from '../user/user.entity';

@Entity()
export class Envelope {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @Column({ default: 0 })
  normalCount: number;

  @Column({ default: 0 })
  goldenCount: number;

  @Column({ type: 'timestamp', nullable: true })
  lastFreeClaim: Date | null;
}
