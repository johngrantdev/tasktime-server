import {
  Entity,
  Enum,
  ManyToOne,
  PrimaryKey,
  Reference,
} from '@mikro-orm/core';
import { User } from '../../user/entities/user.entity';
import { Project } from './project.entity';
import { ProjectMemberRole } from '../enum/projectMemberRole.enum';

@Entity()
export class ProjectMember {
  @PrimaryKey()
  id: number;

  @ManyToOne(() => Project)
  project: Reference<Project>;

  @ManyToOne(() => User)
  member: Reference<User>;

  @Enum(() => ProjectMemberRole)
  role: ProjectMemberRole;
}