import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Req,
} from '@nestjs/common';
import { ProjectService } from './project.service';
import { CreateProjectDto } from './dto/createProject.dto';
import { UpdateProjectDto } from './dto/updateProject.dto';
import { ApiTags } from '@nestjs/swagger';
import { CheckAbilities } from 'src/api/ability/abilities.decorator';
import { UserRequestDto } from 'src/api/auth/dto/userRequest.dto';
import { Project } from './entities/project.entity';
import {
  CreateProjectAbility,
  DeleteProjectAbility,
  UpdateProjectAbility,
  ViewProjectAbility,
} from 'src/api/ability/ability.objects';
import { API_PREFIX } from 'src/shared/config';

@Controller(`${API_PREFIX}/project`)
@ApiTags('project')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Get()
  // @CheckAbilities(new ViewProjectAbility())
  async getAllProjects(
    @Req() req: UserRequestDto,
  ): Promise<Record<string, Project[]>> {
    return await this.projectService.getAllProjects(req.user.id);
  }

  @Get(':projectId')
  @CheckAbilities(new ViewProjectAbility())
  async getProject(@Param('projectId') projectId: string): Promise<Project> {
    return await this.projectService.getProject(projectId);
  }

  @Post()
  @CheckAbilities(new CreateProjectAbility())
  async createProject(
    @Req() req: UserRequestDto,
    @Body() newProject: CreateProjectDto,
  ): Promise<Project> {
    return await this.projectService.createProject(req.user.id, newProject);
  }

  @Patch(':projectId')
  @CheckAbilities(new UpdateProjectAbility())
  async updateProject(
    @Param('projectId') projectId: string,
    @Body() changes: UpdateProjectDto,
  ): Promise<Project> {
    return await this.projectService.updateProject(projectId, changes);
  }

  @CheckAbilities(new DeleteProjectAbility())
  @Delete(':projectId')
  async deleteProject(
    @Req() req: UserRequestDto,
    @Param('projectId') projectId: string,
  ) {
    await this.projectService.deleteProject(req.user.id, projectId);
  }
}
