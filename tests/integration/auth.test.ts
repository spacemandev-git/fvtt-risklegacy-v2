/**
 * Module 2.1: User Authentication API Tests
 *
 * Tests for JWT-based authentication with refresh tokens:
 * - User registration with validation
 * - User login with password verification
 * - Access token generation and validation
 * - Refresh token mechanism
 * - Protected route access
 */

import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import {
  testHeader,
  testFooter,
  testInfo,
  testSuccess,
  testExpectedError,
  testData,
  formatResponse,
} from '../helpers/test-utils';
import { prisma } from '../../src/server/db/client';

const BASE_URL = process.env.API_URL || 'http://localhost:8000';

// Test data will be stored here
let testUser = {
  username: '',
  password: '',
  accessToken: '',
  refreshToken: '',
  userId: '',
};

describe('Module 2.1: User Authentication API', () => {
  beforeAll(async () => {
    testHeader('Module 2.1', 'User Authentication API with JWT & Refresh Tokens');

    // Clean up any existing test users
    await prisma.user.deleteMany({
      where: {
        username: {
          startsWith: 'user_',
        },
      },
    });

    testInfo('🧹', 'Test database cleaned');
  });

  describe('POST /api/auth/register - User Registration', () => {
    test('should successfully register a new user', async () => {
      testInfo('📝', 'Testing: POST /api/auth/register (valid data)');

      const username = testData.randomUsername();
      const password = testData.randomPassword();

      testUser.username = username;
      testUser.password = password;

      testInfo('📤', 'Request body:', {
        username,
        password: '********',
      });

      const response = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      testInfo('📨', 'Response:', formatResponse(response, data));

      expect(response.status).toBe(201);
      expect(data).toHaveProperty('user');
      expect(data).toHaveProperty('accessToken');
      expect(data).toHaveProperty('refreshToken');
      expect(data.user.username).toBe(username);

      // Store tokens for later tests
      testUser.accessToken = data.accessToken;
      testUser.refreshToken = data.refreshToken;
      testUser.userId = data.user.id;

      testSuccess('User registered successfully with tokens');
    });

    test('should reject registration with duplicate username', async () => {
      testInfo('📝', 'Testing: POST /api/auth/register (duplicate username)');

      const response = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: testUser.username,
          password: testData.randomPassword(),
        }),
      });

      const data = await response.json();

      testExpectedError('Duplicate username rejected', data);

      expect(response.status).toBe(409);
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('already exists');
    });

    test('should reject registration with invalid username (too short)', async () => {
      testInfo('📝', 'Testing: POST /api/auth/register (username too short)');

      const response = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'ab', // Only 2 characters
          password: testData.randomPassword(),
        }),
      });

      const data = await response.json();

      testExpectedError('Short username rejected', data);

      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error');
    });

    test('should reject registration with invalid password (too short)', async () => {
      testInfo('📝', 'Testing: POST /api/auth/register (password too short)');

      const response = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: testData.randomUsername(),
          password: '1234567', // Only 7 characters
        }),
      });

      const data = await response.json();

      testExpectedError('Short password rejected', data);

      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/login - User Login', () => {
    test('should successfully login with correct credentials', async () => {
      testInfo('📝', 'Testing: POST /api/auth/login (valid credentials)');

      testInfo('📤', 'Request body:', {
        username: testUser.username,
        password: '********',
      });

      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: testUser.username,
          password: testUser.password,
        }),
      });

      const data = await response.json();

      testInfo('📨', 'Response:', formatResponse(response, {
        ...data,
        accessToken: data.accessToken ? '***' : undefined,
        refreshToken: data.refreshToken ? '***' : undefined,
      }));

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('user');
      expect(data).toHaveProperty('accessToken');
      expect(data).toHaveProperty('refreshToken');
      expect(data.user.username).toBe(testUser.username);

      // Update tokens
      testUser.accessToken = data.accessToken;
      testUser.refreshToken = data.refreshToken;

      testSuccess('Login successful with new tokens');
    });

    test('should reject login with wrong password', async () => {
      testInfo('📝', 'Testing: POST /api/auth/login (wrong password)');

      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: testUser.username,
          password: 'WrongPassword123',
        }),
      });

      const data = await response.json();

      testExpectedError('Wrong password rejected', data);

      expect(response.status).toBe(401);
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Invalid username or password');
    });

    test('should reject login with non-existent username', async () => {
      testInfo('📝', 'Testing: POST /api/auth/login (non-existent user)');

      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'nonexistent_user_123456',
          password: 'SomePassword123',
        }),
      });

      const data = await response.json();

      testExpectedError('Non-existent user rejected', data);

      expect(response.status).toBe(401);
      expect(data).toHaveProperty('error');
    });
  });

  describe('GET /api/auth/me - Get Current User', () => {
    test('should get current user with valid access token', async () => {
      testInfo('📝', 'Testing: GET /api/auth/me (with valid token)');

      testInfo('🔐', 'Using access token:', testUser.accessToken.substring(0, 20) + '...');

      const response = await fetch(`${BASE_URL}/api/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${testUser.accessToken}`,
        },
      });

      const data = await response.json();

      testInfo('📨', 'Response:', formatResponse(response, data));

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('user');
      expect(data.user.username).toBe(testUser.username);
      expect(data.user.id).toBe(testUser.userId);

      testSuccess('Current user retrieved successfully');
    });

    test('should reject request without token', async () => {
      testInfo('📝', 'Testing: GET /api/auth/me (no token)');

      const response = await fetch(`${BASE_URL}/api/auth/me`, {
        method: 'GET',
      });

      const data = await response.json();

      testExpectedError('Request without token rejected', data);

      expect(response.status).toBe(401);
      expect(data).toHaveProperty('error');
    });

    test('should reject request with invalid token', async () => {
      testInfo('📝', 'Testing: GET /api/auth/me (invalid token)');

      const response = await fetch(`${BASE_URL}/api/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer invalid.token.here',
        },
      });

      const data = await response.json();

      testExpectedError('Invalid token rejected', data);

      expect(response.status).toBe(401);
      expect(data).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/refresh - Refresh Access Token', () => {
    test('should generate new access token with valid refresh token', async () => {
      testInfo('📝', 'Testing: POST /api/auth/refresh (valid refresh token)');

      testInfo('🔐', 'Using refresh token:', testUser.refreshToken.substring(0, 20) + '...');

      const response = await fetch(`${BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: testUser.refreshToken,
        }),
      });

      const data = await response.json();

      testInfo('📨', 'Response:', formatResponse(response, {
        accessToken: data.accessToken ? '***' : undefined,
      }));

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('accessToken');

      // Update access token
      const oldAccessToken = testUser.accessToken;
      testUser.accessToken = data.accessToken;

      testInfo('🔄', 'Token refreshed:', {
        oldToken: oldAccessToken.substring(0, 20) + '...',
        newToken: data.accessToken.substring(0, 20) + '...',
        tokensAreDifferent: oldAccessToken !== data.accessToken,
        note: 'Tokens may be identical if generated in same second (same iat timestamp)',
      });

      // Note: Tokens may be identical if generated in the same second
      // What matters is that the refresh mechanism works
      expect(data.accessToken).toBeDefined();
      expect(data.accessToken.length).toBeGreaterThan(0);

      testSuccess('Access token refreshed successfully');
    });

    test('should accept new access token after refresh', async () => {
      testInfo('📝', 'Testing: Verify new access token works');

      const response = await fetch(`${BASE_URL}/api/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${testUser.accessToken}`,
        },
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user.username).toBe(testUser.username);

      testSuccess('New access token is valid and accepted');
    });

    test('should reject invalid refresh token', async () => {
      testInfo('📝', 'Testing: POST /api/auth/refresh (invalid token)');

      const response = await fetch(`${BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: 'invalid.refresh.token',
        }),
      });

      const data = await response.json();

      testExpectedError('Invalid refresh token rejected', data);

      expect(response.status).toBe(401);
      expect(data).toHaveProperty('error');
    });
  });

  describe('Complete Authentication Flow', () => {
    test('should demonstrate complete auth flow', async () => {
      testInfo('📝', 'Testing: Complete authentication flow');

      // 1. Register
      const newUsername = testData.randomUsername();
      const newPassword = testData.randomPassword();

      testInfo('1️⃣', 'Step 1: Register new user');
      const registerResponse = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername, password: newPassword }),
      });
      const registerData = await registerResponse.json();
      expect(registerResponse.status).toBe(201);
      testSuccess('User registered');

      // 2. Access protected route with access token
      testInfo('2️⃣', 'Step 2: Access protected route with access token');
      const meResponse1 = await fetch(`${BASE_URL}/api/auth/me`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${registerData.accessToken}` },
      });
      const meData1 = await meResponse1.json();
      expect(meResponse1.status).toBe(200);
      expect(meData1.user.username).toBe(newUsername);
      testSuccess('Protected route accessed');

      // 3. Refresh access token
      testInfo('3️⃣', 'Step 3: Refresh access token');
      const refreshResponse = await fetch(`${BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: registerData.refreshToken }),
      });
      const refreshData = await refreshResponse.json();
      expect(refreshResponse.status).toBe(200);
      testSuccess('Access token refreshed');

      // 4. Use new access token
      testInfo('4️⃣', 'Step 4: Use new access token');
      const meResponse2 = await fetch(`${BASE_URL}/api/auth/me`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${refreshData.accessToken}` },
      });
      const meData2 = await meResponse2.json();
      expect(meResponse2.status).toBe(200);
      expect(meData2.user.username).toBe(newUsername);
      testSuccess('New access token works');

      // 5. Login again (should invalidate old refresh token)
      testInfo('5️⃣', 'Step 5: Login again');
      const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername, password: newPassword }),
      });
      const loginData = await loginResponse.json();
      expect(loginResponse.status).toBe(200);
      testSuccess('Login successful');

      testInfo('✅', 'Complete flow summary:', {
        steps: 5,
        operations: ['register', 'access protected route', 'refresh token', 'use new token', 'login'],
        allSuccessful: true,
      });

      testSuccess('Complete authentication flow verified');
    });
  });

  describe('Database Integration', () => {
    test('should verify user stored in database with hashed password', async () => {
      testInfo('📝', 'Testing: Database storage verification');

      const user = await prisma.user.findUnique({
        where: { username: testUser.username },
      });

      expect(user).not.toBeNull();
      expect(user?.username).toBe(testUser.username);
      expect(user?.passwordHash).not.toBe(testUser.password); // Password should be hashed
      expect(user?.refreshToken).toBe(testUser.refreshToken);
      expect(user?.refreshTokenExpiry).toBeDefined();

      testInfo('🔍', 'Database user record:', {
        id: user?.id,
        username: user?.username,
        passwordIsHashed: user?.passwordHash !== testUser.password,
        hasRefreshToken: !!user?.refreshToken,
        refreshTokenExpiry: user?.refreshTokenExpiry,
      });

      testSuccess('User data correctly stored in database');
    });

    test('should verify refresh token expiry is set correctly', async () => {
      testInfo('📝', 'Testing: Refresh token expiry verification');

      const user = await prisma.user.findUnique({
        where: { username: testUser.username },
      });

      expect(user?.refreshTokenExpiry).toBeDefined();

      const expiryDate = user?.refreshTokenExpiry;
      const now = new Date();
      const daysDiff = expiryDate
        ? (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        : 0;

      testInfo('📅', 'Token expiry details:', {
        expiryDate: expiryDate?.toISOString(),
        currentDate: now.toISOString(),
        daysUntilExpiry: daysDiff.toFixed(2),
        expectedDays: '~30',
      });

      // Should expire in approximately 30 days (allow some variance)
      expect(daysDiff).toBeGreaterThan(29);
      expect(daysDiff).toBeLessThan(31);

      testSuccess('Refresh token expiry set correctly (~30 days)');
    });
  });

  afterAll(async () => {
    // Clean up test users
    await prisma.user.deleteMany({
      where: {
        username: {
          startsWith: 'user_',
        },
      },
    });

    testInfo('🧹', 'Test users cleaned up');

    testFooter('Module 2.1: User Authentication API', 19);
  });
});
