// Enhanced numerology service with caching placeholders
// Name Number: sum of A=1..Z=26 reduced (preserve master numbers 11,22)
// Destiny Match: compatibility based on difference of reduced numbers

import crypto from 'crypto';

let redisClient; // optional runtime injection
const DEFAULT_TTL = parseInt(process.env.CACHE_TTL_SECONDS || '3600', 10);
export function attachRedis(client){ redisClient = client; }

function charValue(ch) {
  const code = ch.toUpperCase().charCodeAt(0);
  return (code >= 65 && code <= 90) ? code - 64 : 0;
}

function reduceNumber(num) {
  if ([11,22].includes(num)) return num;
  while (num > 9) {
    num = num.toString().split('').reduce((a,b)=>a+parseInt(b,10),0);
    if ([11,22].includes(num)) return num;
  }
  return num;
}

const MEANINGS = {
  1: 'Leadership, initiative, individuality',
  2: 'Diplomacy, partnership, balance',
  3: 'Creativity, expression, optimism',
  4: 'Stability, structure, practicality',
  5: 'Freedom, adaptability, adventure',
  6: 'Responsibility, nurturing, harmony',
  7: 'Analysis, introspection, wisdom',
  8: 'Power, material success, authority',
  9: 'Compassion, humanitarianism, endings',
  11: 'Spiritual insight, illumination (Master Number)',
  22: 'Master builder, large-scale achievement (Master Number)'
};

export function calculateNameNumber(name) {
  const clean = (name || '').replace(/[^a-zA-Z]/g,'');
  const total = [...clean].reduce((sum, ch) => sum + charValue(ch), 0);
  const reduced = reduceNumber(total);
  return { total, number: reduced, meaning: MEANINGS[reduced] || 'Unknown' };
}

export function destinyMatch(name1, name2) {
  const first = calculateNameNumber(name1);
  const second = calculateNameNumber(name2);
  const diff = Math.abs(first.number - second.number);
  const compatibility = Math.max(0, 100 - diff * 10);
  return { first, second, compatibility };
}

export async function cachedNameNumber(name) {
  const key = 'nn:' + crypto.createHash('md5').update(name.toLowerCase()).digest('hex');
  if (redisClient) {
    const cached = await redisClient.get(key);
    if (cached) return JSON.parse(cached);
  }
  const result = calculateNameNumber(name);
  if (redisClient) await redisClient.set(key, JSON.stringify(result), { EX: DEFAULT_TTL });
  return result;
}

export async function cachedDestinyMatch(name1, name2) {
  const composite = [name1.toLowerCase(), name2.toLowerCase()].sort().join('::');
  const key = 'dm:' + crypto.createHash('sha1').update(composite).digest('hex');
  if (redisClient) {
    const cached = await redisClient.get(key);
    if (cached) return JSON.parse(cached);
  }
  const result = destinyMatch(name1, name2);
  if (redisClient) await redisClient.set(key, JSON.stringify(result), { EX: DEFAULT_TTL });
  return result;
}

// Invalidate cached numerology by simple pattern (best-effort; Redis SCAN for demo)
export async function invalidateNumerologyCache(patterns = ['nn:*','dm:*']) {
  if (!redisClient) return 0;
  let total = 0;
  for (const pattern of patterns) {
    for await (const key of redisClient.scanIterator({ MATCH: pattern, COUNT: 100 })) {
      await redisClient.del(key);
      total++;
    }
  }
  return total;
}
