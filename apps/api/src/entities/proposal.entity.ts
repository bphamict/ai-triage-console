import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { RequestEntity } from './request.entity.js';

@Entity('proposals')
export class ProposalEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  requestId!: string;

  @ManyToOne(() => RequestEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'requestId' })
  request!: RequestEntity;

  @Column({ type: 'int', default: 1 })
  version!: number;

  @Column()
  department!: string;

  @Column()
  priority!: string;

  @Column({ type: 'float' })
  confidence!: number;

  @Column({ type: 'varchar', length: 240 })
  summary!: string;

  @Column()
  proposedOwner!: string;

  @Column({ type: 'jsonb' })
  proposedSteps!: Array<{ action: string; completion_condition: string }>;

  @Column({ type: 'simple-array' })
  riskFlags!: string[];

  @Column()
  recommendedState!: string;

  @Column({ type: 'boolean', default: true })
  isCurrent!: boolean;

  @Column({ type: 'varchar', nullable: true })
  editedByRole!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
