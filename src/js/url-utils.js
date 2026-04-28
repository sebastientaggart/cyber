function toAbsoluteUrl(rawValue) {
  if (!rawValue || typeof rawValue !== 'string') return null;
  const trimmed = rawValue.trim();
  if (!trimmed) return null;

  try {
    return new URL(trimmed, window.location.origin);
  } catch (_) {
    return null;
  }
}

export function isSafeHttpUrl(rawValue) {
  const url = toAbsoluteUrl(rawValue);
  if (!url) return false;
  return url.protocol === 'http:' || url.protocol === 'https:';
}

export function isSafeAssetUrl(rawValue) {
  const url = toAbsoluteUrl(rawValue);
  if (!url) return false;

  if (url.origin === window.location.origin) {
    return true;
  }

  return url.protocol === 'https:';
}
