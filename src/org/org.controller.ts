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

//Services
import { UserService } from 'src/user/user.service';
import { OrgService } from './org.service';
import { ProjectService } from 'src/project/project.service';
import { NotificationService } from 'src/notification/notification.service';
import { MailService } from 'src/mail/mail.service';

// DTO
import { CreateOrgDto } from './dto/createOrg.dto';
import { UpdateOrgDto } from './dto/updateOrg.dto';
import { NewMemberRequestDto } from './dto/newMemberRequest.dto';
import { CreateProjectDto } from 'src/project/project.dto';
import { CreateNotificationDto } from 'src/notification/dto/createNotification.dto';
// Interface
import { IOrg, IOrgServiceUpdates } from './interface/org.interface';
import { IProject } from 'src/project/interface/project.interface';

@Controller('org')
export class OrgController {
  constructor(
    private readonly userService: UserService,
    private readonly orgService: OrgService,
    private readonly projectService: ProjectService,
    private readonly notificationService: NotificationService,
    private readonly mailService: MailService,
  ) {}

  // updated userService.getUser to return IUser
  @Get()
  async getAllOrgs(@Req() req): Promise<string[]> {
    const orgs = await this.userService.getAllOrgs(req.userId);
    if (!orgs) {
      return [];
    }
    return orgs;
  }

  @Post()
  async createOrg(@Req() req, @Body() newOrg: CreateOrgDto): Promise<IOrg> {
    return await this.orgService.createOrg(req.userId, newOrg);
  }

  @Get(':orgId')
  async getOrg(@Req() req, @Param('orgId') orgId: string): Promise<IOrg> {
    return await this.orgService.getOrg(req.userId, orgId);
  }

  // todo:
  // still no error when property is not in schema, just returns without changes.
  @Patch(':orgId')
  async updateOrg(
    @Req() req,
    @Param('orgId') orgId: string,
    @Body() orgUpdates: UpdateOrgDto,
  ): Promise<IOrg> {
    const internalOrgUpdates: UpdateOrgDto = orgUpdates;
    return await this.orgService.updateOrg(
      req.userId,
      orgId,
      internalOrgUpdates,
    );
  }

  @Delete(':orgId')
  async deleteOrg(@Req() req, @Param('orgId') orgId: string) {
    return await this.orgService.deleteOrg(req.userId, orgId);
  }

  @Get(':orgId/project')
  async getAllProjects(
    @Req() req,
    @Param('orgId') orgId: string,
  ): Promise<string[]> {
    const { projects } = await this.orgService.getOrg(req.userId, orgId);
    return projects;
  }

  @Post(':orgId/project')
  async createProject(
    @Req() req,
    @Param('orgId') orgId: string,
    @Body() newProject: CreateProjectDto,
  ): Promise<IProject> {
    await this.orgService.getOrg(req.userId, orgId, 'orgProjectManager');
    const project: IProject = await this.projectService.createProject(
      req.userId,
      orgId,
      newProject,
    );
    const updates: IOrgServiceUpdates = {
      projects: [project._id.toString()],
    };

    await this.orgService.updateOrg(req.userId, orgId, updates);
    return project;
  }

  // Invite member method
  //
  // check the current user is authorized to invite members
  // if user doesn't exist create user, pass down newUser=true
  // check if user is already a member of org
  // if not, user id and role is added to member array in org
  // create notification for user > sends notification email(isNewUser=true/false)
  // notification links to page /orgInvite/:notificationId showing more details of org and invitee with link to sign up/login
  // when user is logged in notification should display
  // notification should contain org _id in its data property (not visible to user)
  // when user clicks join org in notification it sends a request to add org to user
  // org is checked for member
  // if member, user orgs is updated
  @Post(':orgId/members/invite')
  async inviteMember(
    @Req() req,
    @Param('orgId') orgId: string,
    @Body() newMemberData: NewMemberRequestDto,
  ) {
    // check user is org admin
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const org = await this.orgService.getOrg(req.userId, orgId, 'orgAdmin');
    let newMember = await this.userService.findUserByEmail(newMemberData.email);
    let isNewUser = false;
    if (!newMember) {
      isNewUser = true;
      newMember = await this.userService.createUser(newMemberData.email);
    }

    if (!org.members.some((member) => member._id === newMember._id)) {
      await this.orgService.updateOrg(req.userId, orgId, {
        members: [{ _id: newMember._id, role: newMemberData.role }],
      });
    }
    const user = await this.userService.getUser(req.userId);
    const notificationTitle = `${
      user.firstName || user.firstName !== ''
        ? `${user.firstName} has invited you`
        : `You have been invited`
    } to join ${org.name}`;
    const newNotification: CreateNotificationDto = {
      user: newMember._id,
      title: notificationTitle,
      body: 'Click here to join',
      button: 'Accept',
      type: 'orgInvite',
      reference: newMember._id,
    };
    const notification = await this.notificationService.createNotification(
      newNotification,
    );
    const notificationId = notification._id.toString();
    await this.userService.updateUser(newMember._id.toString(), {
      unreadNotifications: [notificationId],
    });
    return await this.mailService.sendNotification(
      newMember,
      notification,
      isNewUser,
    );
  }

  @Post(':orgId/members/acceptInvite')
  async acceptInvite(@Req() req, @Param('orgId') orgId: string) {
    // check user is a member of org
    // check if user already has org
    // update user with org
    try {
      if (await this.orgService.getOrg(req.userId, orgId)) {
        await this.userService.updateUser(req.userId, { orgs: [orgId] });
      }
    } catch (error) {
      throw error;
    }
  }

  @Get(':orgId/members/byEmail')
  async getMemberByEmail(
    @Req() req,
    @Param('orgId') orgId: string,
    @Body() body,
  ) {
    if (await this.orgService.getOrg(req.userId, orgId)) {
      return await this.userService.findUserByEmail(body.email);
    }
  }

  @Get(':orgId/members/:memberId')
  async getMember(
    @Req() req,
    @Param('orgId') orgId: string,
    @Param('memberId') memberId: string,
  ) {
    const org = await this.orgService.getOrg(req.userId, orgId);
    if (org.members.some((member) => member._id === memberId)) {
      return await this.userService.getUser(memberId);
    }
  }

  @Delete(':orgId/members/:memberId')
  async removeMember(
    @Req() req,
    @Param('orgId') orgId: string,
    @Param('memberId') memberId: string,
  ) {
    try {
      await this.orgService.removeMember(req.userId, orgId, memberId);
      await this.userService.removeOrg(orgId, memberId);
    } catch (error) {
      throw error;
    }
  }
}