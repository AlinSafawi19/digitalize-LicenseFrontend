import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, AuthResponse } from '../../../types/auth.types';
import { getTokenExpirationTime, isTokenExpired } from '../../../utils/jwtUtils';

// Performance optimization: Cache localStorage values to avoid multiple reads
// This is especially important since initialState is evaluated on every module load
const getInitialAuthState = (): AuthState => {
  // Read from localStorage only once
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  
  // Parse user only if it exists
  let user = null;
  if (userStr) {
    try {
      user = JSON.parse(userStr);
    } catch {
      // If parsing fails, user remains null
      user = null;
    }
  }
  
  // Check authentication status
  const isAuthenticated = token ? !isTokenExpired(token) : false;
  
  // Calculate token expiry only if token exists and is not expired
  let tokenExpiry: string | null = null;
  if (token && isAuthenticated) {
    const expiry = getTokenExpirationTime(token);
    if (expiry && expiry.getTime() > Date.now()) {
      tokenExpiry = expiry.toISOString();
    }
  }
  
  return {
    token,
    user,
    isAuthenticated,
    isLoading: false,
    tokenExpiry,
  };
};

const initialState: AuthState = getInitialAuthState();

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<AuthResponse>) => {
      const { token, user } = action.payload;
      state.token = token;
      state.user = user;
      state.isAuthenticated = true;
      const expiry = getTokenExpirationTime(token);
      state.tokenExpiry = expiry ? expiry.toISOString() : null;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      state.tokenExpiry = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const { setCredentials, logout, setLoading } = authSlice.actions;
export default authSlice.reducer;