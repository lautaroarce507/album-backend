import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '../user/user.entity';

@Entity()
export class Trade {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  creator: User;

  @Column()
  offeredFigureName: string;

  @Column()
  requestedFigureName: string;

  @Column({ default: 'pending' })
  status: 'pending' | 'completed' | 'cancelled';

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  receiver: User | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
