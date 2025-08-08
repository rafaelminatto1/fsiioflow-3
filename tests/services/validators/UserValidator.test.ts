import { UserValidator } from '../../../services/validators/UserValidator';
import { Role } from '../../../types';

describe('UserValidator', () => {
  describe('validateCreateUser', () => {
    it('should validate a valid user', () => {
      const userData = {
        name: 'João Silva',
        email: 'joao@example.com',
        role: Role.Patient,
        avatarUrl: 'https://example.com/avatar.jpg'
      };

      const result = UserValidator.validateCreateUser(userData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject user without name', () => {
      const userData = {
        name: '',
        email: 'joao@example.com',
        role: Role.Patient
      };

      const result = UserValidator.validateCreateUser(userData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'name',
        message: 'Nome é obrigatório'
      });
    });

    it('should reject user with short name', () => {
      const userData = {
        name: 'A',
        email: 'joao@example.com',
        role: Role.Patient
      };

      const result = UserValidator.validateCreateUser(userData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'name',
        message: 'Nome deve ter pelo menos 2 caracteres'
      });
    });

    it('should reject user with long name', () => {
      const userData = {
        name: 'A'.repeat(256),
        email: 'joao@example.com',
        role: Role.Patient
      };

      const result = UserValidator.validateCreateUser(userData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'name',
        message: 'Nome deve ter no máximo 255 caracteres'
      });
    });

    it('should reject user without email', () => {
      const userData = {
        name: 'João Silva',
        email: '',
        role: Role.Patient
      };

      const result = UserValidator.validateCreateUser(userData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'email',
        message: 'Email é obrigatório'
      });
    });

    it('should reject user with invalid email format', () => {
      const userData = {
        name: 'João Silva',
        email: 'invalid-email',
        role: Role.Patient
      };

      const result = UserValidator.validateCreateUser(userData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'email',
        message: 'Email deve ter um formato válido'
      });
    });

    it('should reject user with invalid role', () => {
      const userData = {
        name: 'João Silva',
        email: 'joao@example.com',
        role: 'InvalidRole' as Role
      };

      const result = UserValidator.validateCreateUser(userData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'role',
        message: 'Role inválido'
      });
    });

    it('should reject user with invalid avatar URL', () => {
      const userData = {
        name: 'João Silva',
        email: 'joao@example.com',
        role: Role.Patient,
        avatarUrl: 'invalid-url'
      };

      const result = UserValidator.validateCreateUser(userData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'avatarUrl',
        message: 'URL do avatar inválida'
      });
    });
  });

  describe('validateUpdateUser', () => {
    it('should validate partial user updates', () => {
      const updates = {
        name: 'João Silva Updated'
      };

      const result = UserValidator.validateUpdateUser(updates);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty name in updates', () => {
      const updates = {
        name: ''
      };

      const result = UserValidator.validateUpdateUser(updates);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'name',
        message: 'Nome não pode ser vazio'
      });
    });
  });

  describe('validateLoginCredentials', () => {
    it('should validate valid login credentials', () => {
      const result = UserValidator.validateLoginCredentials('joao@example.com', 'password123');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject login without email', () => {
      const result = UserValidator.validateLoginCredentials('', 'password123');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'email',
        message: 'Email é obrigatório'
      });
    });

    it('should reject login without password', () => {
      const result = UserValidator.validateLoginCredentials('joao@example.com', '');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'password',
        message: 'Senha é obrigatória'
      });
    });
  });

  describe('validateUserId', () => {
    it('should validate valid user ID', () => {
      const result = UserValidator.validateUserId('user_123');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty user ID', () => {
      const result = UserValidator.validateUserId('');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'id',
        message: 'ID do usuário é obrigatório'
      });
    });
  });
});
