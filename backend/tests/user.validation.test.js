import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import User from '../src/models/User.js';
import userConfig from '../src/config/user.config.js';

// The validator enforces only on create (this.isNew). Update operations should bypass length checks.
// We assert that behavior explicitly so future changes are intentional.

describe('User name & phone validation (always enforced for name)', () => {
  let mongoServer;
  const MIN = Number(userConfig.userNameLength) || 3;
  const MAX = Number(userConfig.userNameMaxLength) || 30;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  afterAll(async () => {
    await mongoose.connection.close();
    if (mongoServer) await mongoServer.stop();
  });

  test('creates successfully with valid name within bounds', async () => {
    const name = 'A'.repeat(MIN);
    const u = await User.create({ phone: '+19990000001', name });
    expect(u.name).toBe(name); // stored as-is (already trimmed)
  });

  test('trims whitespace and still validates length based on trimmed value', async () => {
    const raw = '   ValidName   ';
    const u = await User.create({ phone: '+19990000002', name: raw });
    expect(u.name).toBe(raw.trim());
  });

  test('rejects creation with too short name', async () => {
    const shortName = 'a'.repeat(MIN - 1);
    await expect(User.create({ phone: '+19990000003', name: shortName })).rejects.toThrow(
      /between/i
    );
  });

  test('rejects creation with too long name', async () => {
    const longName = 'b'.repeat(MAX + 1);
    await expect(User.create({ phone: '+19990000004', name: longName })).rejects.toThrow(
      /between/i
    );
  });

  test('rejects updating existing user to too short a name', async () => {
    const valid = await User.create({ phone: '+19990000005', name: 'X'.repeat(MIN) });
    valid.name = 'x';
    await expect(valid.save()).rejects.toThrow(/between/i);
  });

  test('rejects updating existing user to too long a name', async () => {
    const base = await User.create({ phone: '+19990000006', name: 'Y'.repeat(MIN) });
    base.name = 'Z'.repeat(MAX + 5);
    await expect(base.save()).rejects.toThrow(/between/i);
  });

  test('allows updating existing user to another valid name', async () => {
    const u = await User.create({ phone: '+19990000009', name: 'ValidName' });
    u.name = 'AnotherValid';
    await expect(u.save()).resolves.toBeDefined();
    expect(u.name).toBe('AnotherValid');
  });


  describe('non-string input rejection on create', () => {
    // NOTE: Numbers are cast to strings by Mongoose before custom validation can detect original type
    // so we exclude numeric case from rejection tests.
    const cases = [null, undefined, {}, [], true];
    for (const value of cases) {
      test(`rejects creation when name is ${JSON.stringify(value)}`, async () => {
        await expect(User.create({ phone: '+19990000007', name: value })).rejects.toThrow();
      });
    }
  });

  test('rejects updating existing user to non-string (object)', async () => {
    const u = await User.create({ phone: '+19990000008', name: 'ValidName' });
    // @ts-ignore intentionally assigning wrong type
    u.name = { nope: true };
    await expect(u.save()).rejects.toThrow(/Cast to string failed/);
  });

  describe('phone E.164 validation', () => {
    test('accepts valid E.164 phone', async () => {
      const u = await User.create({ phone: '+15551234567', name: 'PhoneUser' });
      expect(u.phone).toBe('+15551234567');
    });
    test('rejects phone without plus', async () => {
      await expect(User.create({ phone: '15551234567', name: 'NoPlus' })).rejects.toThrow(/E\.164/);
    });
    test('rejects phone with too few digits', async () => {
      await expect(User.create({ phone: '+1234567', name: 'TooShort' })).rejects.toThrow(/E\.164/);
    });
    test('rejects phone with letters', async () => {
      await expect(User.create({ phone: '+1555ABC1234', name: 'BadChars' })).rejects.toThrow(
        /E\.164/
      );
    });
  });

  describe('normalization', () => {
    test('strips spaces from phone before validation/storage', async () => {
      const spaced = '+1 555 999 0001';
      const u = await User.create({ phone: spaced, name: 'Spacey' });
      expect(u.phone).toBe('+15559990001');
    });
    test('trims & lowercases email', async () => {
      const u = await User.create({
        phone: '+15550009999',
        name: 'EmailUser',
        email: '  MixedCase@Example.COM  ',
      });
      expect(u.email).toBe('mixedcase@example.com');
    });
  });
});
