import { describe, test, expect, beforeAll, afterAll } from 'bun:test'

describe('Module 1.2: Machine-Readable Rulebook', () => {
  let serverUrl: string
  let server: any

  beforeAll(async () => {
    console.log('\n=== Testing Module 1.2: Machine-Readable Rulebook ===\n')

    // Import and start the server
    const serverModule = await import('../../src/server/index')
    server = serverModule.default
    serverUrl = `http://localhost:${server.port}`

    console.log(`✅ Test server started on ${serverUrl}\n`)
  })

  afterAll(() => {
    console.log('\n=== Module 1.2 Tests Complete ===\n')
  })

  describe('Base Rulebook API', () => {
    test('should load base rulebook successfully', async () => {
      console.log('📝 Test: Load base rulebook')

      const response = await fetch(`${serverUrl}/api/rulebook/base`)
      const data = await response.json()

      console.log('Response status:', response.status)
      console.log('Response data structure:', {
        success: data.success,
        version: data.data?.version,
        sectionCount: Object.keys(data.data?.sections || {}).length,
        factionCount: Object.keys(data.data?.factions || {}).length,
        glossaryTerms: data.data?.glossary?.length,
      })

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toBeDefined()
      expect(data.data.version).toBe('1.0.0')
      expect(data.data.sections).toBeDefined()
      expect(Object.keys(data.data.sections).length).toBeGreaterThan(0)

      console.log('✅ Base rulebook loaded successfully\n')
    })

    test('should include all expected sections', async () => {
      console.log('📝 Test: Verify all expected sections exist')

      const response = await fetch(`${serverUrl}/api/rulebook/base`)
      const data = await response.json()

      const expectedSections = [
        'overview',
        'setup',
        'turn_structure',
        'recruit',
        'combat',
        'maneuver',
        'cards',
        'victory',
        'hq',
        'cities',
        'missions',
        'territories',
        'legacy',
        'unlocks',
        'endgame',
      ]

      const sections = Object.keys(data.data.sections)
      console.log('Expected sections:', expectedSections.length)
      console.log('Found sections:', sections.length)
      console.log('Sections:', sections.join(', '))

      for (const expectedSection of expectedSections) {
        expect(sections).toContain(expectedSection)
      }

      console.log('✅ All expected sections present\n')
    })

    test('should include all 5 factions', async () => {
      console.log('📝 Test: Verify all factions are defined')

      const response = await fetch(`${serverUrl}/api/rulebook/base`)
      const data = await response.json()

      const expectedFactions = [
        'imperial_balkania',
        'enclave_of_the_bear',
        'khan_industries',
        'die_mechaniker',
        'saharan_republic',
      ]

      const factions = Object.keys(data.data.factions || {})
      console.log('Expected factions:', expectedFactions.length)
      console.log('Found factions:', factions.length)

      for (const expectedFaction of expectedFactions) {
        expect(factions).toContain(expectedFaction)
      }

      // Display sample faction
      const sampleFaction = data.data.factions['imperial_balkania']
      console.log('\nSample faction (Imperial Balkania):')
      console.log(JSON.stringify(sampleFaction, null, 2))

      console.log('\n✅ All factions present with starting powers\n')
    })
  })

  describe('Section API', () => {
    test('should retrieve specific section', async () => {
      console.log('📝 Test: Retrieve combat section')

      const response = await fetch(`${serverUrl}/api/rulebook/section/combat`)
      const data = await response.json()

      console.log('Response status:', response.status)
      console.log('Section ID:', data.data?.id)
      console.log('Section title:', data.data?.title)
      console.log('Subsections:', Object.keys(data.data?.subsections || {}).join(', '))

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.id).toBe('combat')
      expect(data.data.title).toBe('Combat Rules')
      expect(data.data.subsections).toBeDefined()

      // Display sample subsection
      const attacking = data.data.subsections.attacking
      console.log('\nSample subsection (Attacking):')
      console.log('  Title:', attacking.title)
      console.log('  Rules count:', attacking.rules.length)
      console.log('  First rule:', attacking.rules[0]?.text)

      console.log('\n✅ Section retrieved successfully\n')
    })

    test('should return 404 for non-existent section', async () => {
      console.log('📝 Test: Non-existent section returns 404')

      const response = await fetch(`${serverUrl}/api/rulebook/section/nonexistent`)
      const data = await response.json()

      console.log('Response status:', response.status)
      console.log('Error message:', data.error)

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)

      console.log('✅ 404 returned correctly\n')
    })
  })

  describe('Rule Search', () => {
    test('should search rules by keyword', async () => {
      console.log('📝 Test: Search for "fortified" keyword')

      const response = await fetch(`${serverUrl}/api/rulebook/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: 'fortified',
        }),
      })
      const data = await response.json()

      console.log('Response status:', response.status)
      console.log('Results found:', data.data?.total)

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.results).toBeDefined()
      expect(data.data.total).toBeGreaterThan(0)

      // Display top 3 results
      console.log('\nTop search results:')
      data.data.results.slice(0, 3).forEach((result: any, index: number) => {
        console.log(`${index + 1}. [${result.section}] ${result.rule.text}`)
        console.log(`   Relevance: ${result.relevance.toFixed(2)}`)
      })

      console.log('\n✅ Search completed successfully\n')
    })

    test('should search with section filter', async () => {
      console.log('📝 Test: Search for "star" in victory section only')

      const response = await fetch(`${serverUrl}/api/rulebook/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: 'star',
          sections: ['victory'],
        }),
      })
      const data = await response.json()

      console.log('Response status:', response.status)
      console.log('Results found:', data.data?.total)

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)

      // Verify all results are from victory section
      const allFromVictory = data.data.results.every((result: any) =>
        result.section.startsWith('victory')
      )
      expect(allFromVictory).toBe(true)

      console.log('Sample results:')
      data.data.results.slice(0, 2).forEach((result: any) => {
        console.log(`  - [${result.section}] ${result.rule.text}`)
      })

      console.log('\n✅ Section filtering works correctly\n')
    })

    test('should search with tag filter', async () => {
      console.log('📝 Test: Search with "combat" and "dice" tags')

      const response = await fetch(`${serverUrl}/api/rulebook/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: 'roll',
          tags: ['combat', 'dice'],
        }),
      })
      const data = await response.json()

      console.log('Response status:', response.status)
      console.log('Results found:', data.data?.total)

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)

      // Verify all results have the required tags
      const allHaveTags = data.data.results.every((result: any) =>
        result.rule.tags.some((tag: string) => ['combat', 'dice'].includes(tag))
      )
      expect(allHaveTags).toBe(true)

      console.log('Sample result with tags:')
      const sampleResult = data.data.results[0]
      if (sampleResult) {
        console.log(`  Text: ${sampleResult.rule.text}`)
        console.log(`  Tags: ${sampleResult.rule.tags.join(', ')}`)
      }

      console.log('\n✅ Tag filtering works correctly\n')
    })
  })

  describe('Available Packs', () => {
    test('should list available unlock packs', async () => {
      console.log('📝 Test: List available unlock packs')

      const response = await fetch(`${serverUrl}/api/rulebook/packs`)
      const data = await response.json()

      console.log('Response status:', response.status)
      console.log('Available packs:', data.data?.count)
      console.log('Pack names:', data.data?.packs.join(', '))

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.packs).toBeDefined()
      expect(Array.isArray(data.data.packs)).toBe(true)

      // Should at least have the two packs we created
      expect(data.data.packs).toContain('secondwin')
      expect(data.data.packs).toContain('minorcities')

      console.log('\n✅ Available packs retrieved\n')
    })
  })

  describe('Rulebook Builder Integration', () => {
    test('should demonstrate rulebook builder directly', async () => {
      console.log('📝 Test: Direct rulebook builder usage')

      const { rulebookBuilder } = await import('../../src/server/rules/rulebook-builder')

      // Load base rules
      const baseRules = await rulebookBuilder.loadBaseRules()
      console.log('Base rules version:', baseRules.version)
      console.log('Base sections:', Object.keys(baseRules.sections).length)

      // Build campaign rulebook with no unlocks
      const campaignRulebook1 = await rulebookBuilder.buildCampaignRulebook('test-campaign-1', [])
      console.log('\nCampaign 1 (no unlocks):')
      console.log('  Version:', campaignRulebook1.version)
      console.log('  Unlocked packs:', campaignRulebook1.unlockedPacks.join(', ') || 'none')
      console.log('  Modifiers applied:', campaignRulebook1.modifiers.length)

      expect(campaignRulebook1.unlockedPacks.length).toBe(0)
      expect(campaignRulebook1.modifiers.length).toBe(0)

      // Build campaign rulebook with unlocks
      const campaignRulebook2 = await rulebookBuilder.buildCampaignRulebook('test-campaign-2', [
        'secondwin',
        'minorcities',
      ])
      console.log('\nCampaign 2 (with unlocks):')
      console.log('  Version:', campaignRulebook2.version)
      console.log('  Unlocked packs:', campaignRulebook2.unlockedPacks.join(', '))
      console.log('  Modifiers applied:', campaignRulebook2.modifiers.length)

      expect(campaignRulebook2.unlockedPacks.length).toBe(2)
      expect(campaignRulebook2.modifiers.length).toBeGreaterThan(0)

      // Verify new content added
      const hasDraftSection = 'draft' in campaignRulebook2.compiledRulebook.sections
      console.log('  Has draft section (from minorcities):', hasDraftSection)
      expect(hasDraftSection).toBe(true)

      // Test search in compiled rulebook
      const searchResults = rulebookBuilder.searchRules(
        campaignRulebook2.compiledRulebook,
        'draft'
      )
      console.log('  Search for "draft" found:', searchResults.length, 'rules')
      expect(searchResults.length).toBeGreaterThan(0)

      console.log('\n✅ Rulebook builder working correctly\n')
    })

    test('should demonstrate modifier application', async () => {
      console.log('📝 Test: Modifier application details')

      const { rulebookBuilder } = await import('../../src/server/rules/rulebook-builder')

      // Build base rulebook
      const baseRulebook = await rulebookBuilder.buildCampaignRulebook('base', [])

      // Build rulebook with secondwin pack
      const modifiedRulebook = await rulebookBuilder.buildCampaignRulebook('modified', [
        'secondwin',
      ])

      // Compare sections
      const baseSections = Object.keys(baseRulebook.compiledRulebook.sections)
      const modifiedSections = Object.keys(modifiedRulebook.compiledRulebook.sections)

      console.log('Base sections:', baseSections.length)
      console.log('Modified sections:', modifiedSections.length)

      // Check if private missions subsection was added
      const hasPrivateMissions =
        modifiedRulebook.compiledRulebook.sections.missions?.subsections?.private_missions

      console.log('Private missions subsection added:', !!hasPrivateMissions)
      expect(hasPrivateMissions).toBeDefined()

      if (hasPrivateMissions) {
        console.log('\nPrivate Missions subsection:')
        console.log('  Title:', hasPrivateMissions.title)
        console.log('  Rules:', hasPrivateMissions.rules.length)
        hasPrivateMissions.rules.forEach((rule: any) => {
          console.log(`    - ${rule.text}`)
        })
      }

      console.log('\n✅ Modifiers applied correctly\n')
    })
  })

  describe('Zod Schema Validation', () => {
    test('should validate rulebook structure with Zod', async () => {
      console.log('📝 Test: Zod schema validation')

      const { RulebookSchema } = await import('../../src/server/rules/schemas')
      const { rulebookBuilder } = await import('../../src/server/rules/rulebook-builder')

      const baseRules = await rulebookBuilder.loadBaseRules()

      // Should already be validated, but let's verify
      const parseResult = RulebookSchema.safeParse(baseRules)

      console.log('Validation success:', parseResult.success)
      if (!parseResult.success) {
        console.log('Validation errors:', parseResult.error.errors)
      }

      expect(parseResult.success).toBe(true)

      console.log('✅ Rulebook passes Zod validation\n')
    })

    test('should validate individual rules', async () => {
      console.log('📝 Test: Individual rule validation')

      const { RuleSchema } = await import('../../src/server/rules/schemas')

      // Test valid rule
      const validRule = {
        id: 'test.rule',
        text: 'This is a test rule',
        priority: 1,
        modifiers: [],
        tags: ['test'],
        phase: 'test_phase',
        applies_to: 'all',
      }

      const validResult = RuleSchema.safeParse(validRule)
      console.log('Valid rule passes:', validResult.success)
      expect(validResult.success).toBe(true)

      // Test invalid rule (missing required fields)
      const invalidRule = {
        id: 'test.rule',
        // Missing 'text' field
      }

      const invalidResult = RuleSchema.safeParse(invalidRule)
      console.log('Invalid rule fails:', !invalidResult.success)
      expect(invalidResult.success).toBe(false)

      console.log('✅ Rule schema validation working\n')
    })
  })

  describe('Cache Management', () => {
    test('should clear cache successfully', async () => {
      console.log('📝 Test: Cache clearing')

      const response = await fetch(`${serverUrl}/api/rulebook/clear-cache`, {
        method: 'POST',
      })
      const data = await response.json()

      console.log('Response status:', response.status)
      console.log('Message:', data.message)

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)

      // Verify base rules can still be loaded after cache clear
      const baseResponse = await fetch(`${serverUrl}/api/rulebook/base`)
      const baseData = await baseResponse.json()

      expect(baseResponse.status).toBe(200)
      expect(baseData.success).toBe(true)

      console.log('✅ Cache cleared and rules reloaded\n')
    })
  })

  describe('Performance Tests', () => {
    test('should load rulebook quickly', async () => {
      console.log('📝 Test: Rulebook loading performance')

      const iterations = 5
      const times: number[] = []

      for (let i = 0; i < iterations; i++) {
        const start = performance.now()
        await fetch(`${serverUrl}/api/rulebook/base`)
        const end = performance.now()
        times.push(end - start)
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length
      const minTime = Math.min(...times)
      const maxTime = Math.max(...times)

      console.log(`Iterations: ${iterations}`)
      console.log(`Average time: ${avgTime.toFixed(2)}ms`)
      console.log(`Min time: ${minTime.toFixed(2)}ms`)
      console.log(`Max time: ${maxTime.toFixed(2)}ms`)

      // Should be reasonably fast (under 100ms on average)
      expect(avgTime).toBeLessThan(100)

      console.log('✅ Performance acceptable\n')
    })
  })
})
