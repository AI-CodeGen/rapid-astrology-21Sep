import { createClient } from 'redis';
import { attachRedis } from './numerology.service.js';

let client = null;
export async function initRedis() {
  const url = process.env.REDIS_URL;
  if (!url) return null;
  if (client) return client;
  const candidates = [url];
  if (url.includes('redis://redis:6379')) candidates.push(url.replace('redis://redis:6379','redis://localhost:6379'));
  for (const u of candidates) {
    try {
      client = createClient({ url: u });
      client.on('error', err => console.error('Redis error', err));
      await client.connect();
      attachRedis(client);
      console.log('Redis connected:', u);
      return client;
    } catch (e) {
      console.error('Redis connection failed for', u, e.message);
    }
  }
  console.error('All Redis connection attempts failed; continuing without cache.');
  client = null;
  return null;
}

export function getRedis() { return client; }