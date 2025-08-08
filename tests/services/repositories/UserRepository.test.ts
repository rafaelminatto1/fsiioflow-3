import { UserRepository } from '../../../services/repositories/UserRepository';
import { Role } from '../../../types';

describe('UserRepository', () => {
  let userRepository: UserRepository;

  beforeEach(() => {
    userRepository = new UserRepository();
  });

  describe('findById', () => {
    it('should find an existing user by ID', async () => {
      const user = await userRepository.findById('user_1');
      
      expect(user).not.toBeNull();
      expect(user?.id).toBe('user_1');
      expect(user?.email).toBe('roberto@fisioflow.com');
    });

    it('should return null for non-existing user ID', async () => {
      const user = await userRepository.findById('non_existing_id');
      
      expect(user).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should find an existing user by email', async () => {
      const user = await userRepository.findByEmail('roberto@fisioflow.com');
      
      expect(user).not.toBeNull();
      expect(user?.email).toBe('roberto@fisioflow.com');
      expect(user?.role).toBe(Role.Therapist);
    });

    it('should return null for non-existing email', async () => {
      const user = await userRepository.findByEmail('non_existing@example.com');
      
      expect(user).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const users = await userRepository.findAll();
      
      expect(users.length).toBeGreaterThan(0);
      expect(users.some(u => u.email === 'roberto@fisioflow.com')).toBe(true);
    });
  });

  describe('findByRole', () => {
    it('should find users by role', async () => {
      const therapists = await userRepository.findByRole(Role.Therapist);
      
      expect(therapists.length).toBeGreaterThan(0);
      expect(therapists.every(u => u.role === Role.Therapist)).toBe(true);
    });

    it('should return empty array for non-existing role', async () => {
      const users = await userRepository.findByRole('NonExistingRole' as Role);
      
      expect(users).toEqual([]);
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        role: Role.Patient,
        avatarUrl: 'https://example.com/avatar.jpg'
      };

      const createdUser = await userRepository.create(userData);
      
      expect(createdUser.id).toBeDefined();
      expect(createdUser.name).toBe(userData.name);
      expect(createdUser.email).toBe(userData.email);
      expect(createdUser.role).toBe(userData.role);
      expect(createdUser.avatarUrl).toBe(userData.avatarUrl);
    });

    it('should generate unique ID for new user', async () => {
      const userData1 = {
        name: 'Test User 1',
        email: 'test1@example.com',
        role: Role.Patient
      };

      const userData2 = {
        name: 'Test User 2',
        email: 'test2@example.com',
        role: Role.Patient
      };

      const user1 = await userRepository.create(userData1);
      const user2 = await userRepository.create(userData2);
      
      expect(user1.id).not.toBe(user2.id);
    });
  });

  describe('update', () => {
    it('should update an existing user', async () => {
      // Primeiro criar um usuário
      const userData = {
        name: 'Original Name',
        email: 'original@example.com',
        role: Role.Patient
      };
      
      const createdUser = await userRepository.create(userData);
      
      // Depois atualizar
      const updates = {
        name: 'Updated Name',
        email: 'updated@example.com'
      };
      
      const updatedUser = await userRepository.update(createdUser.id, updates);
      
      expect(updatedUser).not.toBeNull();
      expect(updatedUser?.name).toBe(updates.name);
      expect(updatedUser?.email).toBe(updates.email);
      expect(updatedUser?.role).toBe(Role.Patient); // Mantém o role original
    });

    it('should return null for non-existing user ID', async () => {
      const updates = { name: 'Updated Name' };
      const updatedUser = await userRepository.update('non_existing_id', updates);
      
      expect(updatedUser).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete an existing user', async () => {
      // Primeiro criar um usuário
      const userData = {
        name: 'To Delete',
        email: 'todelete@example.com',
        role: Role.Patient
      };
      
      const createdUser = await userRepository.create(userData);
      
      // Depois deletar
      const deleted = await userRepository.delete(createdUser.id);
      
      expect(deleted).toBe(true);
      
      // Verificar se foi realmente deletado
      const foundUser = await userRepository.findById(createdUser.id);
      expect(foundUser).toBeNull();
    });

    it('should return false for non-existing user ID', async () => {
      const deleted = await userRepository.delete('non_existing_id');
      
      expect(deleted).toBe(false);
    });
  });

  describe('existsByEmail', () => {
    it('should return true for existing email', async () => {
      const exists = await userRepository.existsByEmail('roberto@fisioflow.com');
      
      expect(exists).toBe(true);
    });

    it('should return false for non-existing email', async () => {
      const exists = await userRepository.existsByEmail('non_existing@example.com');
      
      expect(exists).toBe(false);
    });
  });
});
