export const REFRESH_PREFIX = 'refresh:';
export const REFRESH_USED_PREFIX = 'refresh-used:';
export const FAMILY_PREFIX = 'family:';
export const FAMILY_REVOKED_PREFIX = 'family-revoked:';
export const SESSION_PREFIX = 'session:';

const DECODE = `local function decode(raw)
  if not raw or raw == false then return nil end
  local ok, value = pcall(cjson.decode, raw)
  if not ok or type(value) ~= 'table' then return nil end
  return value
end`;

// One EVAL: consume the live token and publish its replacement together.
// A revoked family publishes nothing, so logout cannot lose the race.
// Mobile records carry refreshTtlSeconds; web records omit it and use ARGV.
const ENCODE = `
local function encodeRefresh(userId, familyId, storedTtl)
  if storedTtl then
    return cjson.encode({ userId = userId, familyId = familyId, refreshTtlSeconds = storedTtl })
  end
  return cjson.encode({ userId = userId, familyId = familyId })
end

local function encodeUsed(familyId, storedTtl)
  if storedTtl then
    return cjson.encode({ familyId = familyId, refreshTtlSeconds = storedTtl })
  end
  return cjson.encode({ familyId = familyId })
end`;

export const ROTATE_REFRESH = `
${DECODE}
${ENCODE}

local oldHash = ARGV[1]
local newHash = ARGV[2]
local fallbackTtl = tonumber(ARGV[3])
local raw = redis.call('GET', '${REFRESH_PREFIX}' .. oldHash)
local record = decode(raw)
if not record or type(record['userId']) ~= 'string' or type(record['familyId']) ~= 'string' then
  local used = decode(redis.call('GET', '${REFRESH_USED_PREFIX}' .. oldHash))
  if used and type(used['familyId']) == 'string' then
    return {'reused'}
  end
  return {'invalid'}
end

local familyId = record['familyId']
local userId = record['userId']
if redis.call('EXISTS', '${FAMILY_REVOKED_PREFIX}' .. familyId) == 1 then
  return {'invalid'}
end
if redis.call('EXISTS', '${SESSION_PREFIX}' .. familyId) == 0 then
  return {'invalid'}
end

local storedTtl = tonumber(record['refreshTtlSeconds'])
local ttl = storedTtl or fallbackTtl
redis.call('SET', '${REFRESH_USED_PREFIX}' .. oldHash, encodeUsed(familyId, storedTtl), 'EX', ttl)
redis.call('DEL', '${REFRESH_PREFIX}' .. oldHash)
redis.call('SET', '${REFRESH_PREFIX}' .. newHash, encodeRefresh(userId, familyId, storedTtl), 'EX', ttl)
redis.call('SET', '${FAMILY_PREFIX}' .. familyId, newHash, 'EX', ttl)
redis.call('SET', '${SESSION_PREFIX}' .. familyId, cjson.encode({ userId = userId }), 'EX', ttl)
return {'ok', userId, familyId}
`;

// One EVAL: resolve the family from the live token or its used marker,
// delete every live token, and leave the family revoked.
export const REVOKE_FAMILY = `
${DECODE}

local hash = ARGV[1]
local ttl = tonumber(ARGV[2])
local familyId = nil
local storedTtl = nil
local live = decode(redis.call('GET', '${REFRESH_PREFIX}' .. hash))
if live and type(live['familyId']) == 'string' then
  familyId = live['familyId']
  storedTtl = tonumber(live['refreshTtlSeconds'])
else
  local used = decode(redis.call('GET', '${REFRESH_USED_PREFIX}' .. hash))
  if used and type(used['familyId']) == 'string' then
    familyId = used['familyId']
    storedTtl = tonumber(used['refreshTtlSeconds'])
  end
end
if not familyId then return 0 end
if storedTtl then ttl = storedTtl end

local current = redis.call('GET', '${FAMILY_PREFIX}' .. familyId)
if current and current ~= false then
  redis.call('DEL', '${REFRESH_PREFIX}' .. current)
end
redis.call('DEL', '${REFRESH_PREFIX}' .. hash)
redis.call('DEL', '${FAMILY_PREFIX}' .. familyId, '${SESSION_PREFIX}' .. familyId)
redis.call('SET', '${FAMILY_REVOKED_PREFIX}' .. familyId, '1', 'EX', ttl)
return 1
`;

export function refreshKey(hash: string): string {
  return `${REFRESH_PREFIX}${hash}`;
}

export function sessionKey(familyId: string): string {
  return `${SESSION_PREFIX}${familyId}`;
}

export function familyKey(familyId: string): string {
  return `${FAMILY_PREFIX}${familyId}`;
}
