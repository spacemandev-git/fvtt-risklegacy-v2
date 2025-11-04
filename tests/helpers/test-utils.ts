/**
 * Test Helper Utilities
 *
 * Common utilities for writing tests with good console output
 */

/**
 * Print a formatted test header
 */
export function testHeader(moduleName: string, description: string) {
  console.log('\n' + '='.repeat(60))
  console.log(`  Testing: ${moduleName}`)
  console.log(`  ${description}`)
  console.log('='.repeat(60) + '\n')
}

/**
 * Print a formatted test footer
 */
export function testFooter(moduleName: string, testCount: number) {
  console.log('\n' + '='.repeat(60))
  console.log(`  ✅ ${moduleName}: ${testCount} tests completed`)
  console.log('='.repeat(60) + '\n')
}

/**
 * Print formatted test info
 */
export function testInfo(emoji: string, message: string, data?: any) {
  console.log(`\n${emoji} ${message}`)
  if (data !== undefined) {
    console.log(JSON.stringify(data, null, 2))
  }
}

/**
 * Print test success
 */
export function testSuccess(message: string) {
  console.log(`✅ ${message}`)
}

/**
 * Print test failure expectation (for error testing)
 */
export function testExpectedError(message: string, error: any) {
  console.log(`🔍 ${message}`)
  console.log('Error:', JSON.stringify(error, null, 2))
  console.log('✅ Error handling verified')
}

/**
 * Create a delay (useful for async operations)
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Generate random test data
 */
export const testData = {
  randomString: (length: number = 10): string => {
    return Math.random().toString(36).substring(2, length + 2)
  },

  randomEmail: (): string => {
    return `test_${testData.randomString(8)}@example.com`
  },

  randomUsername: (): string => {
    return `user_${testData.randomString(6)}`
  },

  randomPassword: (): string => {
    return `Pass_${testData.randomString(12)}`
  }
}

/**
 * Format API response for display
 */
export function formatResponse(response: Response, body?: any) {
  return {
    status: response.status,
    statusText: response.statusText,
    headers: Object.fromEntries(response.headers.entries()),
    body
  }
}

/**
 * Measure execution time
 */
export async function measureTime<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now()
  const result = await fn()
  const end = performance.now()
  console.log(`⏱️  ${name}: ${(end - start).toFixed(2)}ms`)
  return result
}
