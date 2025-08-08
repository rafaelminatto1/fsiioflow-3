import { User, Role } from '../../types';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export class UserValidator {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  private static readonly MIN_NAME_LENGTH = 2;
  private static readonly MAX_NAME_LENGTH = 255;
  private static readonly MAX_EMAIL_LENGTH = 255;

  /**
   * Valida dados de criação de usuário
   */
  static validateCreateUser(userData: Omit<User, 'id'>): ValidationResult {
    const errors: ValidationError[] = [];

    // Validação do nome
    if (!userData.name || userData.name.trim().length === 0) {
      errors.push({ field: 'name', message: 'Nome é obrigatório' });
    } else if (userData.name.trim().length < this.MIN_NAME_LENGTH) {
      errors.push({ field: 'name', message: `Nome deve ter pelo menos ${this.MIN_NAME_LENGTH} caracteres` });
    } else if (userData.name.length > this.MAX_NAME_LENGTH) {
      errors.push({ field: 'name', message: `Nome deve ter no máximo ${this.MAX_NAME_LENGTH} caracteres` });
    }

    // Validação do email
    const emailErrors = this.validateEmail(userData.email);
    errors.push(...emailErrors);

    // Validação do role
    const roleErrors = this.validateRole(userData.role);
    errors.push(...roleErrors);

    // Validação do avatarUrl (opcional)
    if (userData.avatarUrl && !this.isValidUrl(userData.avatarUrl)) {
      errors.push({ field: 'avatarUrl', message: 'URL do avatar inválida' });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Valida dados de atualização de usuário
   */
  static validateUpdateUser(updates: Partial<User>): ValidationResult {
    const errors: ValidationError[] = [];

    // Validação do nome (se fornecido)
    if (updates.name !== undefined) {
      if (!updates.name || updates.name.trim().length === 0) {
        errors.push({ field: 'name', message: 'Nome não pode ser vazio' });
      } else if (updates.name.trim().length < this.MIN_NAME_LENGTH) {
        errors.push({ field: 'name', message: `Nome deve ter pelo menos ${this.MIN_NAME_LENGTH} caracteres` });
      } else if (updates.name.length > this.MAX_NAME_LENGTH) {
        errors.push({ field: 'name', message: `Nome deve ter no máximo ${this.MAX_NAME_LENGTH} caracteres` });
      }
    }

    // Validação do email (se fornecido)
    if (updates.email !== undefined) {
      const emailErrors = this.validateEmail(updates.email);
      errors.push(...emailErrors);
    }

    // Validação do role (se fornecido)
    if (updates.role !== undefined) {
      const roleErrors = this.validateRole(updates.role);
      errors.push(...roleErrors);
    }

    // Validação do avatarUrl (se fornecido)
    if (updates.avatarUrl !== undefined && updates.avatarUrl && !this.isValidUrl(updates.avatarUrl)) {
      errors.push({ field: 'avatarUrl', message: 'URL do avatar inválida' });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Valida credenciais de login
   */
  static validateLoginCredentials(email: string, password: string): ValidationResult {
    const errors: ValidationError[] = [];

    // Validação do email
    const emailErrors = this.validateEmail(email);
    errors.push(...emailErrors);

    // Validação da senha
    if (!password || password.trim().length === 0) {
      errors.push({ field: 'password', message: 'Senha é obrigatória' });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Valida email
   */
  private static validateEmail(email: string): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!email || email.trim().length === 0) {
      errors.push({ field: 'email', message: 'Email é obrigatório' });
    } else if (email.length > this.MAX_EMAIL_LENGTH) {
      errors.push({ field: 'email', message: `Email deve ter no máximo ${this.MAX_EMAIL_LENGTH} caracteres` });
    } else if (!this.EMAIL_REGEX.test(email)) {
      errors.push({ field: 'email', message: 'Email deve ter um formato válido' });
    }

    return errors;
  }

  /**
   * Valida role
   */
  private static validateRole(role: Role): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!role) {
      errors.push({ field: 'role', message: 'Role é obrigatório' });
    } else if (!Object.values(Role).includes(role)) {
      errors.push({ field: 'role', message: 'Role inválido' });
    }

    return errors;
  }

  /**
   * Valida se uma string é uma URL válida
   */
  private static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Valida ID de usuário
   */
  static validateUserId(id: string): ValidationResult {
    const errors: ValidationError[] = [];

    if (!id || id.trim().length === 0) {
      errors.push({ field: 'id', message: 'ID do usuário é obrigatório' });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
