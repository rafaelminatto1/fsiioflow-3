import { User, Role } from '../../types';
import { mockUsers } from '../../data/mockData';
import { IUserRepository } from './IUserRepository';

export class UserRepository implements IUserRepository {
  private users: User[] = [...mockUsers];

  async findById(id: string): Promise<User | null> {
    const user = this.users.find(u => u.id === id);
    return user || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = this.users.find(u => u.email === email);
    return user || null;
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
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    
    this.users.push(newUser);
    return newUser;
  }

  async update(id: string, updates: Partial<User>): Promise<User | null> {
    const userIndex = this.users.findIndex(u => u.id === id);
    
    if (userIndex === -1) {
      return null;
    }

    this.users[userIndex] = {
      ...this.users[userIndex],
      ...updates,
    };

    return this.users[userIndex];
  }

  async delete(id: string): Promise<boolean> {
    const userIndex = this.users.findIndex(u => u.id === id);
    
    if (userIndex === -1) {
      return false;
    }

    this.users.splice(userIndex, 1);
    return true;
  }

  async existsByEmail(email: string): Promise<boolean> {
    return this.users.some(u => u.email === email);
  }
}
