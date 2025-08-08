import { Request, Response } from 'express';
import { CreateGroupSessionUseCase } from '../../../application/use-cases/create-group-session';
import { CreateGroupSessionDTO, UpdateGroupSessionDTO } from '../../../application/dto/group-session-dto';
import { UUID } from 'crypto';

export class GroupController {
  constructor(
    private createGroupUseCase: CreateGroupSessionUseCase,
    // Outros use cases seriam injetados aqui
  ) {}

  async createGroup(req: Request, res: Response): Promise<void> {
    try {
      // Verificar permissões
      const currentUser = req.user as any; // Tipo seria definido no middleware de auth
      if (!currentUser || !['admin', 'fisioterapeuta'].includes(currentUser.role)) {
        res.status(403).json({
          error: 'Insufficient permissions'
        });
        return;
      }

      // Validar e extrair dados do request
      const groupData: CreateGroupSessionDTO = {
        name: req.body.name,
        description: req.body.description,
        fisioterapeutaId: req.body.fisioterapeutaId || currentUser.id,
        maxCapacity: req.body.maxCapacity,
        exercises: req.body.exercises || [],
        schedule: req.body.schedule,
        requirements: req.body.requirements || {}
      };

      // Executar caso de uso
      const group = await this.createGroupUseCase.execute(groupData);

      res.status(201).json({
        success: true,
        data: group,
        message: 'Group session created successfully'
      });

    } catch (error) {
      console.error('Error creating group session:', error);
      
      if (error instanceof Error) {
        res.status(400).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Internal server error'
        });
      }
    }
  }

  async getGroup(req: Request, res: Response): Promise<void> {
    try {
      const groupId = req.params.groupId as UUID;
      
      if (!groupId) {
        res.status(400).json({
          success: false,
          error: 'Group ID is required'
        });
        return;
      }

      // Aqui seria usado um GetGroupUseCase
      // const group = await this.getGroupUseCase.execute(groupId);

      // Por enquanto, retorno mockado
      res.status(200).json({
        success: true,
        data: { id: groupId, message: 'Group retrieval not implemented yet' },
        message: 'Group retrieved successfully'
      });

    } catch (error) {
      console.error('Error retrieving group:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async listGroups(req: Request, res: Response): Promise<void> {
    try {
      const currentUser = req.user as any;
      const filters = {
        fisioterapeutaId: req.query.fisioterapeutaId as UUID,
        status: req.query.status as string,
        hasAvailableSlots: req.query.hasAvailableSlots === 'true'
      };

      // Aplicar filtro por fisioterapeuta se usuário não é admin
      if (currentUser.role === 'fisioterapeuta') {
        filters.fisioterapeutaId = currentUser.id;
      }

      // Aqui seria usado um ListGroupsUseCase
      // const groups = await this.listGroupsUseCase.execute(filters);

      res.status(200).json({
        success: true,
        data: [],
        message: 'Groups list retrieved successfully'
      });

    } catch (error) {
      console.error('Error listing groups:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async updateGroup(req: Request, res: Response): Promise<void> {
    try {
      const groupId = req.params.groupId as UUID;
      const updateData: UpdateGroupSessionDTO = {
        id: groupId,
        ...req.body
      };

      // Verificar permissões
      const currentUser = req.user as any;
      if (!currentUser || !['admin', 'fisioterapeuta'].includes(currentUser.role)) {
        res.status(403).json({
          error: 'Insufficient permissions'
        });
        return;
      }

      // Aqui seria usado um UpdateGroupUseCase
      // const updatedGroup = await this.updateGroupUseCase.execute(updateData);

      res.status(200).json({
        success: true,
        data: { id: groupId, message: 'Group update not implemented yet' },
        message: 'Group updated successfully'
      });

    } catch (error) {
      console.error('Error updating group:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async addMemberToGroup(req: Request, res: Response): Promise<void> {
    try {
      const groupId = req.params.groupId as UUID;
      const patientId = req.body.patientId as UUID;

      if (!patientId) {
        res.status(400).json({
          success: false,
          error: 'Patient ID is required'
        });
        return;
      }

      // Aqui seria usado um AddMemberToGroupUseCase
      // const result = await this.addMemberUseCase.execute(groupId, patientId);

      res.status(200).json({
        success: true,
        data: { groupId, patientId },
        message: 'Member added to group successfully'
      });

    } catch (error) {
      console.error('Error adding member to group:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async removeMemberFromGroup(req: Request, res: Response): Promise<void> {
    try {
      const groupId = req.params.groupId as UUID;
      const patientId = req.params.patientId as UUID;

      // Aqui seria usado um RemoveMemberFromGroupUseCase
      // const result = await this.removeMemberUseCase.execute(groupId, patientId);

      res.status(200).json({
        success: true,
        data: { groupId, patientId },
        message: 'Member removed from group successfully'
      });

    } catch (error) {
      console.error('Error removing member from group:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}