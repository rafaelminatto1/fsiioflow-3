import { UserManager } from '../../../services/managers/UserManager';
import { IUserRepository } from '../../../services/repositories/IUserRepository';
import { User, Role } from '../../../types';
import { Logger } from '../../../services/logging/Logger';

// Mock do repository
class MockUserRepository implements IUserRepository {
  private users: User[] = [
    {
      id: 'user_1',
      name: 'Test User',
      email: 'test@example.com',
      role: Role.Patient,
      avatarUrl: 'https://example.com/avatar.jpg'
    }
  ];

  async findById(id: string): Promise<User | null> {
    return this.users.find(u => u.id === id) || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.users.find(u => u.email === email) || null;
  }

  async findAll(): Promise<User[]> {
    return [...this.users];
  }

  async findByRole(role: string): Promise<User[]> {
    return this.users.filter(u => u.role === role);
  }

  async create(userData: Omit<User, 'id'>): Promise<User> {
    const newUser: User = {
      ...userData,
      id: `user_${Date.now()}`
    };
    this.users.push(newUser);
    return newUser;
  }

  async update(id: string, updates: Partial<User>): Promise<User | null> {
    const userIndex = this.users.findIndex(u => u.id === id);
    if (userIndex === -1) return null;

    this.users[userIndex] = { ...this.users[userIndex], ...updates };
    return this.users[userIndex];
  }

  async delete(id: string): Promise<boolean> {
    const userIndex = this.users.findIndex(u => u.id === id);
    if (userIndex === -1) return false;

    this.users.splice(userIndex, 1);
    return true;
  }

  async existsByEmail(email: string): Promise<boolean> {
    return this.users.some(u => u.email === email);
  }
}

describe('UserManager', () => {
  let userManager: UserManager;
  let mockRepository: MockUserRepository;

  beforeEach(() => {
    mockRepository = new MockUserRepository();
    userManager = new UserManager(mockRepository);
    
    // Limpar logs antes de cada teste
    Logger.getInstance().clearLogs();
  });

  describe('login', () => {
    it('should login with valid credentials', async () => {
      const result = await userManager.login('test@example.com', 'password123');
      
      expect(result.success).toBe(true);
      expect(result.user.email).toBe('test@example.com');
    });

    it('should reject login with invalid email', async () => {
      await expect(userManager.login('invalid@example.com', 'password123'))
        .rejects.toThrow('Credenciais inválidas.');
    });

    it('should reject login with invalid password', async () => {
      await expect(userManager.login('test@example.com', 'wrongpassword'))
        .rejects.toThrow('Credenciais inválidas.');
    });

    it('should reject login with invalid email format', async () => {
      await expect(userManager.login('invalid-email', 'password123'))
        .rejects.toThrow('Credenciais inválidas.');
    });

    it('should reject login with empty credentials', async () => {
      await expect(userManager.login('', ''))
        .rejects.toThrow('Credenciais inválidas.');
    });
  });

  describe('getUserById', () => {
    it('should return user for valid ID', async () => {
      const user = await userManager.getUserById('user_1');
      
      expect(user).not.toBeNull();
      expect(user?.id).toBe('user_1');
    });

    it('should return null for invalid ID', async () => {
      const user = await userManager.getUserById('');
      
      expect(user).toBeNull();
    });

    it('should return null for non-existing ID', async () => {
      const user = await userManager.getUserById('non_existing');
      
      expect(user).toBeNull();
    });
  });

  describe('getUserByEmail', () => {
    it('should return user for valid email', async () => {
      const user = await userManager.getUserByEmail('test@example.com');
      
      expect(user).not.toBeNull();
      expect(user?.email).toBe('test@example.com');
    });

    it('should return null for non-existing email', async () => {
      const user = await userManager.getUserByEmail('nonexisting@example.com');
      
      expect(user).toBeNull();
    });
  });

  describe('getAllUsers', () => {
    it('should return all users', async () => {
      const users = await userManager.getAllUsers();
      
      expect(users.length).toBe(1);
      expect(users[0].email).toBe('test@example.com');
    });
  });

  describe('getUsersByRole', () => {
    it('should return users by role', async () => {
      const patients = await userManager.getUsersByRole(Role.Patient);
      
      expect(patients.length).toBe(1);
      expect(patients[0].role).toBe(Role.Patient);
    });

    it('should return empty array for non-existing role', async () => {
      const therapists = await userManager.getUsersByRole(Role.Therapist);
      
      expect(therapists).toEqual([]);
    });
  });

  describe('createUser', () => {
    it('should create user with valid data', async () => {
      const userData = {
        name: 'New User',
        email: 'newuser@example.com',
        role: Role.Therapist,
        avatarUrl: 'https://example.com/new-avatar.jpg'
      };

      const createdUser = await userManager.createUser(userData);
      
      expect(createdUser.name).toBe(userData.name);
      expect(createdUser.email).toBe(userData.email);
      expect(createdUser.role).toBe(userData.role);
      expect(createdUser.id).toBeDefined();
    });

    it('should reject user creation with invalid data', async () => {
      const userData = {
        name: '',
        email: 'invalid-email',
        role: Role.Patient
      };

      await expect(userManager.createUser(userData))
        .rejects.toThrow('Dados inválidos');
    });

    it('should reject user creation with existing email', async () => {
      const userData = {
        name: 'Duplicate User',
        email: 'test@example.com', // Email já existe
        role: Role.Patient
      };

      await expect(userManager.createUser(userData))
        .rejects.toThrow('Email já está em uso.');
    });
  });

  describe('updateUser', () => {
    it('should update user with valid data', async () => {
      const updates = {
        name: 'Updated Name',
        email: 'updated@example.com'
      };

      const updatedUser = await userManager.updateUser('user_1', updates);
      
      expect(updatedUser).not.toBeNull();
      expect(updatedUser?.name).toBe(updates.name);
      expect(updatedUser?.email).toBe(updates.email);
    });

    it('should return null for invalid ID', async () => {
      const updates = { name: 'Updated Name' };
      const updatedUser = await userManager.updateUser('', updates);
      
      expect(updatedUser).toBeNull();
    });

    it('should return null for non-existing user', async () => {
      const updates = { name: 'Updated Name' };
      const updatedUser = await userManager.updateUser('non_existing', updates);
      
      expect(updatedUser).toBeNull();
    });

    it('should reject update with invalid data', async () => {
      const updates = { name: '' };

      await expect(userManager.updateUser('user_1', updates))
        .rejects.toThrow('Dados inválidos');
    });
  });

  describe('deleteUser', () => {
    it('should delete existing user', async () => {
      const deleted = await userManager.deleteUser('user_1');
      
      expect(deleted).toBe(true);
      
      // Verificar se foi realmente deletado
      const user = await userManager.getUserById('user_1');
      expect(user).toBeNull();
    });

    it('should return false for invalid ID', async () => {
      const deleted = await userManager.deleteUser('');
      
      expect(deleted).toBe(false);
    });

    it('should return false for non-existing user', async () => {
      const deleted = await userManager.deleteUser('non_existing');
      
      expect(deleted).toBe(false);
    });
  });

  describe('isEmailInUse', () => {
    it('should return true for existing email', async () => {
      const inUse = await userManager.isEmailInUse('test@example.com');
      
      expect(inUse).toBe(true);
    });

    it('should return false for non-existing email', async () => {
      const inUse = await userManager.isEmailInUse('nonexisting@example.com');
      
      expect(inUse).toBe(false);
    });
  });

  describe('logging', () => {
    it('should log successful login', async () => {
      await userManager.login('test@example.com', 'password123');
      
      const logs = Logger.getInstance().getLogs();
      const loginLogs = logs.filter(log => log.operation === 'user_login');
      
      expect(loginLogs.length).toBeGreaterThan(0);
      expect(loginLogs.some(log => log.message.includes('Login realizado com sucesso'))).toBe(true);
    });

    it('should log failed login attempts', async () => {
      try {
        await userManager.login('test@example.com', 'wrongpassword');
      } catch (error) {
        // Esperado falhar
      }
      
      const logs = Logger.getInstance().getLogs();
      const loginLogs = logs.filter(log => log.operation === 'user_login');
      
      expect(loginLogs.length).toBeGreaterThan(0);
      expect(loginLogs.some(log => log.message.includes('senha incorreta'))).toBe(true);
    });

    it('should log user creation', async () => {
      const userData = {
        name: 'New User',
        email: 'newuser@example.com',
        role: Role.Patient
      };

      await userManager.createUser(userData);
      
      const logs = Logger.getInstance().getLogs();
      const createLogs = logs.filter(log => log.operation === 'create_user');
      
      expect(createLogs.length).toBeGreaterThan(0);
      expect(createLogs.some(log => log.message.includes('Usuário criado com sucesso'))).toBe(true);
    });
  });
});
