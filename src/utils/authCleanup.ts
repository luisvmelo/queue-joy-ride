
/**
 * Enhanced authentication cleanup utilities with security improvements
 */

// Clean up authentication state and sensitive data
export const cleanupAuthState = (): void => {
  // Remove Supabase auth tokens
  localStorage.removeItem('supabase.auth.token');
  sessionStorage.removeItem('supabase.auth.token');
  
  // Clean up any party-specific credentials when logging out as admin
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith('party_') && (key.endsWith('_phone') || key.endsWith('_name'))) {
      localStorage.removeItem(key);
    }
  });
  
  // Clear any cached sensitive data
  localStorage.removeItem('user_email');
  localStorage.removeItem('temp_registration_data');
  
  // Clear session storage
  sessionStorage.clear();
};

// Clean up specific party credentials
export const cleanupPartyCredentials = (partyId: string): void => {
  localStorage.removeItem(`party_${partyId}_phone`);
  localStorage.removeItem(`party_${partyId}_name`);
};

// Secure data storage for temporary registration
export const storeTemporaryData = (key: string, data: any, expirationMinutes: number = 10): void => {
  const item = {
    data,
    expiration: Date.now() + (expirationMinutes * 60 * 1000)
  };
  localStorage.setItem(key, JSON.stringify(item));
};

// Retrieve and validate temporary data
export const getTemporaryData = (key: string): any => {
  const item = localStorage.getItem(key);
  if (!item) return null;
  
  try {
    const parsed = JSON.parse(item);
    if (Date.now() > parsed.expiration) {
      localStorage.removeItem(key);
      return null;
    }
    return parsed.data;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
};

// Clean up expired temporary data
export const cleanupExpiredData = (): void => {
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith('temp_')) {
      getTemporaryData(key); // This will remove expired items
    }
  });
};
