import { User } from '../../types';

export interface IUserRepository {
  /**
   * Busca um usuário por ID
   */
  findById(id: string): Promise<User | null>;

  /**
   * Busca um usuário por email
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Busca todos os usuários
   */
  findAll(): Promise<User[]>;

  /**
   * Busca usuários por role
   */
  findByRole(role: string): Promise<User[]>;

  /**
   * Cria um novo usuário
   */
  create(user: Omit<User, 'id'>): Promise<User>;

  /**
   * Atualiza um usuário existente
   */
  update(id: string, updates: Partial<User>): Promise<User | null>;

  /**
   * Remove um usuário
   */
  delete(id: string): Promise<boolean>;

  /**
   * Verifica se um email já está em uso
   */
  existsByEmail(email: string): Promise<boolean>;
}
