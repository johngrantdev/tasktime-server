import { IsString, IsNotEmpty, IsIn, IsOptional, IsUrl } from 'class-validator';
import { IMember } from '../interface/member.interface';

export class MemberDto implements IMember {
  @IsString()
  @IsNotEmpty()
  _id: string;

  @IsIn(['orgViewer', 'orgUser', 'orgProjectManager', 'orgAdmin'])
  role: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  firstName?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  lastName?: string;

  @IsOptional()
  @IsUrl()
  avator?: string;
}
