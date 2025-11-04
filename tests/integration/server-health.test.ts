/**
 * Example Test: Server Health Check
 *
 * This test demonstrates the testing pattern and verifies basic server functionality
 * from Module 1.1 (Project Setup)
 */

import { describe, test, expect, beforeAll, afterAll } from 'bun:test'
import { testHeader, testFooter, testInfo, testSuccess } from '../helpers/test-utils'

const BASE_URL = process.env.API_URL || 'http://localhost:8000'

describe('Module 1.1: Server Health Check', () => {
  beforeAll(() => {
    testHeader('Module 1.1', 'Server Health Check & Basic Setup')
  })

  test('should return 200 OK from health endpoint', async () => {
    testInfo('📝', 'Testing: GET /health')
    testInfo('🌐', 'Request URL:', `${BASE_URL}/health`)

    const response = await fetch(`${BASE_URL}/health`)
    const data = await response.json()

    testInfo('📨', 'Response:', {
      status: response.status,
      statusText: response.statusText,
      body: data
    })

    expect(response.status).toBe(200)
    expect(data.status).toBe('ok')

    testSuccess('Health endpoint is operational')
  })

  test('should return server metadata', async () => {
    testInfo('📝', 'Testing: Server metadata in health response')

    const response = await fetch(`${BASE_URL}/health`)
    const data = await response.json()

    testInfo('🔍', 'Checking for metadata fields...')

    expect(data).toHaveProperty('status')
    expect(data).toHaveProperty('timestamp')

    testInfo('✅', 'Metadata received:', {
      status: data.status,
      timestamp: data.timestamp,
      hasAdditionalFields: Object.keys(data).length > 2
    })

    testSuccess('Server metadata is present')
  })

  test('should handle 404 for unknown routes', async () => {
    testInfo('📝', 'Testing: 404 handling')
    testInfo('🌐', 'Request URL:', `${BASE_URL}/this-route-does-not-exist`)

    const response = await fetch(`${BASE_URL}/this-route-does-not-exist`)

    testInfo('📨', 'Response status:', response.status)

    expect(response.status).toBe(404)

    testSuccess('404 errors are handled correctly')
  })

  afterAll(() => {
    testFooter('Module 1.1: Server Health', 3)
  })
})
