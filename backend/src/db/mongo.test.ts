import mongoose from 'mongoose';
import { connectDB } from './mongo';

jest.mock('mongoose', () => ({
  __esModule: true,
  default: {
    connect: jest.fn(),
  },
}));

describe('connectDB', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('throws when MONGODB_URI is missing', async () => {
    delete process.env.MONGODB_URI;

    await expect(connectDB()).rejects.toThrow('* MONGODB_URI is not set');
  });

  it('calls mongoose.connect with URI and optional dbName', async () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017';
    process.env.MONGODB_DBNAME = 'teapots_test';

    await connectDB();

    expect(mongoose.connect).toHaveBeenCalledWith('mongodb://localhost:27017', {
      dbName: 'teapots_test',
    });
  });
});
