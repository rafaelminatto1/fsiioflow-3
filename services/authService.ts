
import { User, Role } from '../types';
import { UserManager } from './managers/UserManager';
import { Logger } from './logging/Logger';

const SESSION_KEY = 'fisioflow_user_session';

// Instância única do UserManager para manter estado
const userManager = new UserManager();
const logger = Logger.getInstance();

/**
 * Realiza login do usuário
 * Mantém compatibilidade com a API existente
 */
export const login = async (email: string, password: string): Promise<User> => {
  try {
    // Simular delay da implementação original para compatibilidade
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const loginResult = await userManager.login(email, password);
    
    // Manter sessão no sessionStorage para compatibilidade
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(loginResult.user));
    
    return loginResult.user;
  } catch (error) {
    logger.error('Erro no authService.login', 
      { email, error: error instanceof Error ? error.message : 'Erro desconhecido' }, 
      undefined, 'auth_service_login');
    throw error;
  }
};

/**
 * Realiza logout do usuário
 * Mantém compatibilidade com a API existente
 */
export const logout = (): void => {
  try {
    sessionStorage.removeItem(SESSION_KEY);
    
    logger.info('Logout realizado via authService', undefined, undefined, 'auth_service_logout');
  } catch (error) {
    logger.error('Erro no authService.logout', 
      { error: error instanceof Error ? error.message : 'Erro desconhecido' }, 
      undefined, 'auth_service_logout');
  }
};

/**
 * Recupera sessão atual do usuário
 * Mantém compatibilidade com a API existente
 */
export const getSession = (): User | null => {
  try {
    const userJson = sessionStorage.getItem(SESSION_KEY);
    if (userJson) {
      const user = JSON.parse(userJson) as User;
      
      logger.debug('Sessão recuperada via authService', 
        { userId: user.id, email: user.email }, user.id, 'auth_service_get_session');
      
      return user;
    }
    
    logger.debug('Nenhuma sessão encontrada', undefined, undefined, 'auth_service_get_session');
    return null;
  } catch (error) {
    logger.error('Erro ao recuperar sessão', 
      { error: error instanceof Error ? error.message : 'Erro desconhecido' }, 
      undefined, 'auth_service_get_session');
    return null;
  }
};

/**
 * Expõe o UserManager para uso avançado
 * Nova funcionalidade que não quebra compatibilidade
 */
export const getUserManager = (): UserManager => {
  return userManager;
};

/**
 * Funções auxiliares que mantêm compatibilidade e adicionam novas funcionalidades
 */

/**
 * Busca usuário por ID
 */
export const getUserById = async (id: string): Promise<User | null> => {
  return await userManager.getUserById(id);
};

/**
 * Busca usuário por email
 */
export const getUserByEmail = async (email: string): Promise<User | null> => {
  return await userManager.getUserByEmail(email);
};

/**
 * Lista todos os usuários
 */
export const getAllUsers = async (): Promise<User[]> => {
  return await userManager.getAllUsers();
};

/**
 * Busca usuários por role
 */
export const getUsersByRole = async (role: Role): Promise<User[]> => {
  return await userManager.getUsersByRole(role);
};

/**
 * Verifica se email está em uso
 */
export const isEmailInUse = async (email: string): Promise<boolean> => {
  return await userManager.isEmailInUse(email);
};