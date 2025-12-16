// Jest setup file - sets environment variables before tests run

// Set up valid test secrets that meet security requirements
process.env.JWT_SECRET = 'test-jwt-secret-that-is-at-least-32-characters-long';
process.env.NODE_ENV = 'test';
process.env.ESCROW_ADDRESS = '0x1234567890123456789012345678901234567890';
process.env.TREASURY_ADDRESS = '0x0987654321098765432109876543210987654321';
process.env.USDC_ADDRESS = '0xABCDEF1234567890ABCDEF1234567890ABCDEF12';
process.env.RELAYER_PRIVATE_KEY = '0x0000000000000000000000000000000000000000000000000000000000000001';
process.env.RPC_URL = 'http://127.0.0.1:8545';
process.env.CHAIN_ID = '31337';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
