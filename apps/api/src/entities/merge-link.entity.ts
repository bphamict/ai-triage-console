import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { RequestEntity } from './request.entity.js';

@Entity('merge_links')
export class MergeLinkEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  duplicateRequestId!: string;

  @ManyToOne(() => RequestEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'duplicateRequestId' })
  duplicateRequest!: RequestEntity;

  @Column()
  canonicalExternalId!: string;

  @Column()
  mergedByRole!: string;

  @Column({ type: 'text' })
  reason!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
