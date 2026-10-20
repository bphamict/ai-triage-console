import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RequestState } from '../common/enums.js';

@Entity('requests')
export class RequestEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  externalId!: string;

  @Column()
  source!: string;

  @Column({ type: 'varchar', nullable: true })
  departmentHint!: string | null;

  @Column()
  requesterRole!: string;

  @Column({ type: 'timestamptz' })
  submittedAt!: Date;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'varchar', default: RequestState.Received })
  state!: RequestState;

  @Column({ type: 'varchar', nullable: true })
  department!: string | null;

  @Column({ type: 'varchar', nullable: true })
  priority!: string | null;

  @Column({ type: 'simple-array', nullable: true })
  riskFlags!: string[] | null;

  @Column({ type: 'varchar', nullable: true })
  duplicateOf!: string | null;

  @Column({ type: 'text', nullable: true })
  triageError!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
