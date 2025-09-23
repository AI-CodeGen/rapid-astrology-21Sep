import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import User from '../src/models/User.js';
import userConfig from '../src/config/user.config.js';

// Helper to create a user with minimal valid basic details (legacy place string supported)
async function createUserDirect(overrides = {}) {
  const base = {
    phone: '+19995550123',
    name: 'Test User',
    userBasicDetails: {
      dob: new Date('2000-01-01'),
      time: { hour: 10, minute: 15, second: 0 },
      place: 'OldTown'
    },
    ...overrides
  };
  return User.create(base);
}

describe('User model validation & basicDetails', () => {
  let mongoServer;
  const DEFAULT_MIN = 3;
  const DEFAULT_MAX = 30;
  const MIN = Number.isFinite(Number(userConfig.userNameLength)) ? Number(userConfig.userNameLength) : DEFAULT_MIN;
  const MAX = Number.isFinite(Number(userConfig.userNameMaxLength)) ? Number(userConfig.userNameMaxLength) : DEFAULT_MAX;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  afterAll(async () => {
    await mongoose.connection.close();
    if (mongoServer) await mongoServer.stop();
  });

  describe('Name & phone validation', () => {
    test('creates successfully with valid name within bounds', async () => {
      const name = 'A'.repeat(MIN);
      const u = await User.create({ phone: '+19990000001', name, userBasicDetails: { dob: new Date('2000-01-01'), time: { hour: 0, minute: 0 }, place: 'P' } });
      expect(u.name).toBe(name);
    });

    test('trims whitespace and still validates length based on trimmed value', async () => {
      const raw = '   ValidName   ';
      const u = await User.create({ phone: '+19990000002', name: raw, userBasicDetails: { dob: new Date('2000-01-01'), time: { hour: 1, minute: 2 }, place: 'Q' } });
      expect(u.name).toBe(raw.trim());
    });

    test('rejects creation with too short name', async () => {
      const shortName = 'a'.repeat(MIN - 1);
      await expect(User.create({ phone: '+19990000003', name: shortName })).rejects.toThrow(/between/i);
    });

    test('rejects creation with too long name', async () => {
      const longName = 'b'.repeat(MAX + 1);
      await expect(User.create({ phone: '+19990000004', name: longName })).rejects.toThrow(/between/i);
    });

    test('rejects updating existing user to too short a name', async () => {
      const valid = await User.create({ phone: '+19990000005', name: 'X'.repeat(MIN), userBasicDetails: { dob: new Date('2000-01-01'), time: { hour: 2, minute: 3 }, place: 'R' } });
      valid.name = 'x';
      await expect(valid.save()).rejects.toThrow(/between/i);
    });

    test('rejects updating existing user to too long a name', async () => {
      const base = await User.create({ phone: '+19990000006', name: 'Y'.repeat(MIN), userBasicDetails: { dob: new Date('2000-01-01'), time: { hour: 3, minute: 4 }, place: 'S' } });
      base.name = 'Z'.repeat(MAX + 5);
      await expect(base.save()).rejects.toThrow(/between/i);
    });

    test('allows updating existing user to another valid name', async () => {
      const u = await User.create({ phone: '+19990000009', name: 'ValidName', userBasicDetails: { dob: new Date('2000-01-01'), time: { hour: 4, minute: 5 }, place: 'T' } });
      u.name = 'AnotherValid';
      await expect(u.save()).resolves.toBeDefined();
      expect(u.name).toBe('AnotherValid');
    });

    describe('non-string input rejection on create', () => {
      const cases = [null, undefined, {}, [], true];
      for (const value of cases) {
        test(`rejects creation when name is ${JSON.stringify(value)}`, async () => {
          await expect(User.create({ phone: '+19990000007', name: value, userBasicDetails: { dob: new Date('2000-01-01'), time: { hour: 6, minute: 7 }, place: 'U' } })).rejects.toThrow();
        });
      }
    });

    test('rejects updating existing user to non-string (object)', async () => {
      const u = await User.create({ phone: '+19990000008', name: 'ValidName', userBasicDetails: { dob: new Date('2000-01-01'), time: { hour: 7, minute: 8 }, place: 'V' } });
      // @ts-ignore intentional wrong type
      u.name = { nope: true };
      await expect(u.save()).rejects.toThrow(/Cast to string failed/);
    });

    describe('phone E.164 validation', () => {
      test('accepts valid E.164 phone', async () => {
        const u = await User.create({ phone: '+15551234567', name: 'PhoneUser', userBasicDetails: { dob: new Date('2000-01-01'), time: { hour: 8, minute: 9 }, place: 'W' } });
        expect(u.phone).toBe('+15551234567');
      });
      test('rejects phone without plus', async () => {
        await expect(User.create({ phone: '15551234567', name: 'NoPlus' })).rejects.toThrow(/E\.164/);
      });
      test('rejects phone with too few digits', async () => {
        await expect(User.create({ phone: '+1234567', name: 'TooShort' })).rejects.toThrow(/E\.164/);
      });
      test('rejects phone with letters', async () => {
        await expect(User.create({ phone: '+1555ABC1234', name: 'BadChars' })).rejects.toThrow(/E\.164/);
      });
    });

    describe('normalization', () => {
      test('strips spaces from phone before validation/storage', async () => {
        const spaced = '+1 555 999 0001';
        const u = await User.create({ phone: spaced, name: 'Spacey', userBasicDetails: { dob: new Date('2000-01-01'), time: { hour: 9, minute: 10 }, place: 'Y' } });
        expect(u.phone).toBe('+15559990001');
      });
      test('trims & lowercases email', async () => {
        const u = await User.create({
          phone: '+15550009999',
          name: 'EmailUser',
          email: '  MixedCase@Example.COM  ',
          userBasicDetails: { dob: new Date('2000-01-01'), time: { hour: 10, minute: 11 }, place: 'Z' }
        });
        expect(u.email).toBe('mixedcase@example.com');
      });
    });
  });

  describe('BasicDetails time/place transformations', () => {
    test('Legacy string place converts to structured object with name', async () => {
      const u = await createUserDirect({ phone: '+19995550124' });
      expect(u.userBasicDetails.place).toBeDefined();
      expect(typeof u.userBasicDetails.place).toBe('object');
      expect(u.userBasicDetails.place.name).toBe('OldTown');
      expect(u.userBasicDetails.placeString).toBe('OldTown');
    });

    test('Full place object with lat/long persists and formats placeString', async () => {
      const u = await createUserDirect({
        phone: '+19995550125',
        userBasicDetails: {
          dob: new Date('2000-01-01'),
          time: { hour: 5, minute: 45, second: 30 },
          place: { name: 'City', district: 'District', state: 'State', country: 'Country', latitude: 12.34, longitude: 56.78 }
        }
      });
      const refetched = await User.findById(u._id);
      expect(refetched.userBasicDetails.place.latitude).toBe(12.34);
      expect(refetched.userBasicDetails.place.longitude).toBe(56.78);
      expect(refetched.userBasicDetails.placeString).toBe('City, District, State, Country');
    });

    test('Invalid latitude rejected', async () => {
      let error;
      try {
        await createUserDirect({
          phone: '+19995550126',
          userBasicDetails: { dob: new Date('2000-01-01'), time: { hour: 9, minute: 0 }, place: { name: 'Place', latitude: 123.45 } }
        });
      } catch (e) { error = e; }
      expect(error).toBeTruthy();
      expect(error.message).toMatch(/Latitude/);
    });

    test('timeString virtual formats correctly', async () => {
      const u = await createUserDirect({ phone: '+19995550127', userBasicDetails: { dob: new Date('2000-01-01'), time: { hour: 3, minute: 7, second: 5 }, place: 'Town' } });
      expect(u.userBasicDetails.timeString).toBe('03:07:05');
    });
  });

  describe('OpenAPI schema alignment', () => {
    let spec;
    beforeAll(() => {
      const specPath = path.join(process.cwd(), 'openapi.yaml');
      const raw = fs.readFileSync(specPath, 'utf8');
      spec = yaml.load(raw);
    });

    test('includes TimeObject & PlaceObject schemas', () => {
      expect(spec).toHaveProperty(['components','schemas','TimeObject']);
      expect(spec).toHaveProperty(['components','schemas','PlaceObject']);
    });

    test('User schema references BasicDetails', () => {
      const userSchema = spec?.components?.schemas?.User;
      expect(userSchema).toBeDefined();
      expect(userSchema.properties).toHaveProperty('userBasicDetails');
    });
  });
});
