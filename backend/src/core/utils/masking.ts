export function maskValue(key: string, value: string): string {
  if (!value) return '';
  const cleanKey = key.toLowerCase();
  
  if (cleanKey.includes('aadhaar')) {
    if (value.length >= 4) {
      return '********' + value.slice(-4);
    }
    return '********';
  }
  if (cleanKey.includes('mobile') || cleanKey.includes('phone')) {
    if (value.length >= 4) {
      return '******' + value.slice(-4);
    }
    return '******';
  }
  if (cleanKey.includes('pan')) {
    return '******';
  }
  if (cleanKey.includes('email')) {
    const parts = value.split('@');
    if (parts.length === 2) {
      const local = parts[0];
      const domain = parts[1];
      if (local.length > 2) {
        return local[0] + '***' + local[local.length - 1] + '@' + domain;
      }
      return '***@' + domain;
    }
    return '***';
  }
  if (cleanKey.includes('bank') || cleanKey.includes('account')) {
    if (value.length > 4) {
      return '*'.repeat(value.length - 4) + value.slice(-4);
    }
    return '****';
  }
  if (cleanKey.includes('ifsc')) {
    if (value.length >= 8) {
      return value.slice(0, 4) + '****' + value.slice(-3);
    }
    return '****';
  }
  if (cleanKey.includes('passport') || cleanKey.includes('license')) {
    if (value.length > 4) {
      return value.slice(0, 2) + '*'.repeat(value.length - 4) + value.slice(-2);
    }
    return '****';
  }
  
  // Generic fallback for any other sensitive field
  if (value.length > 4) {
    return '*'.repeat(value.length - 4) + value.slice(-4);
  }
  return '*'.repeat(value.length);
}
