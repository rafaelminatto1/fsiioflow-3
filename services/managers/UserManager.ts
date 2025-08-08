import { User, Role } from '../../types';
import { IUserRepository } from '../repositories/IUserRepository';
import { UserRepository } from '../repositories/UserRepository';
import { UserValidator, ValidationResult } from '../validators/UserValidator';
import { Logger } from '../logging/Logger';

export interface CreateUserData {
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string;
  patientId?: string;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  role?: Role;
  avatarUrl?: string;
  patientId?: string;
}

export interface LoginResult {
  user: User;
  success: boolean;
}

export class UserManager {
  private userRepository: IUserRepository;
  private logger: Logger;

  constructor(userRepository?: IUserRepository) {
    this.userRepository = userRepository || new UserRepository();
    this.logger = Logger.getInstance();
  }

  /**
   * Autentica um usuário com email e senha
   */
  async login(email: string, password: string): Promise<LoginResult> {
    const operation = 'user_login';
    
    try {
      this.logger.info('Tentativa de login iniciada', { email }, undefined, operation);

      // Validar credenciais
      const validation = UserValidator.validateLoginCredentials(email, password);
      if (!validation.isValid) {
        this.logger.warn('Credenciais inválidas - validação falhou', 
          { email, errors: validation.errors }, undefined, operation);
        throw new Error('Credenciais inválidas.');
      }

      // Buscar usuário
      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        this.logger.warn('Tentativa de login com usuário não encontrado', 
          { email }, undefined, operation);
        throw new Error('Credenciais inválidas.');
      }

      // Em uma aplicação real, aqui verificaríamos a senha hasheada
      // Por enquanto, usamos uma senha fixa para compatibilidade
      if (password !== 'password123') {
        this.logger.warn('Tentativa de login com senha incorreta', 
          { email, userId: user.id }, user.id, operation);
        throw new Error('Credenciais inválidas.');
      }

      this.logger.info('Login realizado com sucesso', 
        { email, userId: user.id, role: user.role }, user.id, operation);

      return {
        user,
        success: true
      };

    } catch (error) {
      this.logger.error('Erro durante login', 
        { email, error: error instanceof Error ? error.message : 'Erro desconhecido' }, 
        undefined, operation);
      throw error;
    }
  }

  /**
   * Busca um usuário por ID
   */
  async getUserById(id: string): Promise<User | null> {
    const operation = 'get_user_by_id';
    
    try {
      // Validar ID
      const validation = UserValidator.validateUserId(id);
      if (!validation.isValid) {
        this.logger.warn('ID de usuário inválido', 
          { id, errors: validation.errors }, undefined, operation);
        return null;
      }

      const user = await this.userRepository.findById(id);
      
      if (user) {
        this.logger.debug('Usuário encontrado por ID', 
          { userId: id, email: user.email }, id, operation);
      } else {
        this.logger.debug('Usuário não encontrado por ID', { userId: id }, undefined, operation);
      }

      return user;

    } catch (error) {
      this.logger.error('Erro ao buscar usuário por ID', 
        { userId: id, error: error instanceof Error ? error.message : 'Erro desconhecido' }, 
        undefined, operation);
      return null;
    }
  }

  /**
   * Busca um usuário por email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    const operation = 'get_user_by_email';
    
    try {
      const user = await this.userRepository.findByEmail(email);
      
      if (user) {
        this.logger.debug('Usuário encontrado por email', 
          { email, userId: user.id }, user.id, operation);
      } else {
        this.logger.debug('Usuário não encontrado por email', { email }, undefined, operation);
      }

      return user;

    } catch (error) {
      this.logger.error('Erro ao buscar usuário por email', 
        { email, error: error instanceof Error ? error.message : 'Erro desconhecido' }, 
        undefined, operation);
      return null;
    }
  }

  /**
   * Lista todos os usuários
   */
  async getAllUsers(): Promise<User[]> {
    const operation = 'get_all_users';
    
    try {
      const users = await this.userRepository.findAll();
      
      this.logger.info('Lista de usuários obtida', 
        { count: users.length }, undefined, operation);

      return users;

    } catch (error) {
      this.logger.error('Erro ao obter lista de usuários', 
        { error: error instanceof Error ? error.message : 'Erro desconhecido' }, 
        undefined, operation);
      return [];
    }
  }

  /**
   * Busca usuários por role
   */
  async getUsersByRole(role: Role): Promise<User[]> {
    const operation = 'get_users_by_role';
    
    try {
      const users = await this.userRepository.findByRole(role);
      
      this.logger.info('Usuários obtidos por role', 
        { role, count: users.length }, undefined, operation);

      return users;

    } catch (error) {
      this.logger.error('Erro ao obter usuários por role', 
        { role, error: error instanceof Error ? error.message : 'Erro desconhecido' }, 
        undefined, operation);
      return [];
    }
  }

  /**
   * Cria um novo usuário
   */
  async createUser(userData: CreateUserData): Promise<User> {
    const operation = 'create_user';
    
    try {
      this.logger.info('Iniciando criação de usuário', 
        { email: userData.email, role: userData.role }, undefined, operation);

      // Validar dados
      const validation = UserValidator.validateCreateUser(userData);
      if (!validation.isValid) {
        this.logger.warn('Dados inválidos para criação de usuário', 
          { email: userData.email, errors: validation.errors }, undefined, operation);
        throw new Error(`Dados inválidos: ${validation.errors.map(e => e.message).join(', ')}`);
      }

      // Verificar se email já existe
      const existingUser = await this.userRepository.findByEmail(userData.email);
      if (existingUser) {
        this.logger.warn('Tentativa de criação com email já existente', 
          { email: userData.email }, undefined, operation);
        throw new Error('Email já está em uso.');
      }

      // Criar usuário
      const newUser = await this.userRepository.create(userData);

      this.logger.info('Usuário criado com sucesso', 
        { userId: newUser.id, email: newUser.email, role: newUser.role }, 
        newUser.id, operation);

      return newUser;

    } catch (error) {
      this.logger.error('Erro ao criar usuário', 
        { email: userData.email, error: error instanceof Error ? error.message : 'Erro desconhecido' }, 
        undefined, operation);
      throw error;
    }
  }

  /**
   * Atualiza um usuário existente
   */
  async updateUser(id: string, updates: UpdateUserData): Promise<User | null> {
    const operation = 'update_user';
    
    try {
      this.logger.info('Iniciando atualização de usuário', 
        { userId: id }, id, operation);

      // Validar ID
      const idValidation = UserValidator.validateUserId(id);
      if (!idValidation.isValid) {
        this.logger.warn('ID inválido para atualização', 
          { userId: id, errors: idValidation.errors }, undefined, operation);
        return null;
      }

      // Validar dados de atualização
      const validation = UserValidator.validateUpdateUser(updates);
      if (!validation.isValid) {
        this.logger.warn('Dados inválidos para atualização', 
          { userId: id, errors: validation.errors }, id, operation);
        throw new Error(`Dados inválidos: ${validation.errors.map(e => e.message).join(', ')}`);
      }

      // Verificar se usuário existe
      const existingUser = await this.userRepository.findById(id);
      if (!existingUser) {
        this.logger.warn('Tentativa de atualização de usuário inexistente', 
          { userId: id }, undefined, operation);
        return null;
      }

      // Verificar se email já está em uso por outro usuário
      if (updates.email && updates.email !== existingUser.email) {
        const emailInUse = await this.userRepository.existsByEmail(updates.email);
        if (emailInUse) {
          this.logger.warn('Tentativa de atualização com email já em uso', 
            { userId: id, email: updates.email }, id, operation);
          throw new Error('Email já está em uso.');
        }
      }

      // Atualizar usuário
      const updatedUser = await this.userRepository.update(id, updates);

      if (updatedUser) {
        this.logger.info('Usuário atualizado com sucesso', 
          { userId: id, updatedFields: Object.keys(updates) }, id, operation);
      }

      return updatedUser;

    } catch (error) {
      this.logger.error('Erro ao atualizar usuário', 
        { userId: id, error: error instanceof Error ? error.message : 'Erro desconhecido' }, 
        id, operation);
      throw error;
    }
  }

  /**
   * Remove um usuário
   */
  async deleteUser(id: string): Promise<boolean> {
    const operation = 'delete_user';
    
    try {
      this.logger.info('Iniciando remoção de usuário', { userId: id }, id, operation);

      // Validar ID
      const validation = UserValidator.validateUserId(id);
      if (!validation.isValid) {
        this.logger.warn('ID inválido para remoção', 
          { userId: id, errors: validation.errors }, undefined, operation);
        return false;
      }

      // Verificar se usuário existe
      const existingUser = await this.userRepository.findById(id);
      if (!existingUser) {
        this.logger.warn('Tentativa de remoção de usuário inexistente', 
          { userId: id }, undefined, operation);
        return false;
      }

      // Remover usuário
      const deleted = await this.userRepository.delete(id);

      if (deleted) {
        this.logger.info('Usuário removido com sucesso', 
          { userId: id, email: existingUser.email }, id, operation);
      }

      return deleted;

    } catch (error) {
      this.logger.error('Erro ao remover usuário', 
        { userId: id, error: error instanceof Error ? error.message : 'Erro desconhecido' }, 
        id, operation);
      return false;
    }
  }

  /**
   * Verifica se um email já está em uso
   */
  async isEmailInUse(email: string): Promise<boolean> {
    const operation = 'check_email_in_use';
    
    try {
      const exists = await this.userRepository.existsByEmail(email);
      
      this.logger.debug('Verificação de email em uso', 
        { email, exists }, undefined, operation);

      return exists;

    } catch (error) {
      this.logger.error('Erro ao verificar email em uso', 
        { email, error: error instanceof Error ? error.message : 'Erro desconhecido' }, 
        undefined, operation);
      return false;
    }
  }
}
