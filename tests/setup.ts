// Configurações globais para os testes

// Mock do sessionStorage para ambiente Node.js
const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
});

// Mock do console.log para evitar poluição nos testes
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Limpar todos os mocks antes de cada teste
beforeEach(() => {
  jest.clearAllMocks();
});
