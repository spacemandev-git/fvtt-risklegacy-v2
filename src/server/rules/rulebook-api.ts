import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { rulebookBuilder } from './rulebook-builder'
import type { SearchResult, SearchResponse } from './schemas'
import { SearchRequestSchema } from './schemas'
import logger from '../logger'

const rulebookApi = new Hono()

/**
 * GET /api/rulebook/base
 * Returns the base rulebook (no modifications)
 */
rulebookApi.get('/base', async (c) => {
  try {
    const baseRules = await rulebookBuilder.loadBaseRules()

    return c.json({
      success: true,
      data: baseRules,
    })
  } catch (error) {
    logger.error('Failed to get base rulebook', { error })
    return c.json(
      {
        success: false,
        error: 'Failed to load base rulebook',
      },
      500
    )
  }
})

/**
 * GET /api/rulebook/section/:sectionId
 * Returns a specific section from base rules or campaign rules
 */
rulebookApi.get(
  '/section/:sectionId',
  zValidator(
    'query',
    z.object({
      campaignId: z.string().optional(),
      detailed: z.enum(['true', 'false']).optional(),
    })
  ),
  async (c) => {
    try {
      const { sectionId } = c.req.param()
      const { campaignId, detailed } = c.req.valid('query')

      let rulebook
      if (campaignId) {
        // Get campaign-specific rulebook
        // TODO: Fetch campaign's unlocked packs from database
        const unlockedPacks: string[] = [] // Placeholder
        const campaignRulebook = await rulebookBuilder.buildCampaignRulebook(
          campaignId,
          unlockedPacks
        )
        rulebook = campaignRulebook.compiledRulebook
      } else {
        // Get base rulebook
        rulebook = await rulebookBuilder.loadBaseRules()
      }

      const section = rulebookBuilder.getSectionById(rulebook, sectionId)

      if (!section) {
        return c.json(
          {
            success: false,
            error: `Section '${sectionId}' not found`,
          },
          404
        )
      }

      return c.json({
        success: true,
        data: section,
      })
    } catch (error) {
      logger.error('Failed to get section', { error })
      return c.json(
        {
          success: false,
          error: 'Failed to get section',
        },
        500
      )
    }
  }
)

/**
 * POST /api/rulebook/search
 * Search rules by keyword or tag
 */
rulebookApi.post(
  '/search',
  zValidator('json', SearchRequestSchema),
  async (c) => {
    try {
      const searchRequest = c.req.valid('json')

      let rulebook
      if (searchRequest.campaignId) {
        // Get campaign-specific rulebook
        // TODO: Fetch campaign's unlocked packs from database
        const unlockedPacks: string[] = [] // Placeholder
        const campaignRulebook = await rulebookBuilder.buildCampaignRulebook(
          searchRequest.campaignId,
          unlockedPacks
        )
        rulebook = campaignRulebook.compiledRulebook
      } else {
        // Get base rulebook
        rulebook = await rulebookBuilder.loadBaseRules()
      }

      // Search rules
      const rules = rulebookBuilder.searchRules(
        rulebook,
        searchRequest.query,
        searchRequest.sections,
        searchRequest.tags
      )

      // Calculate relevance scores (simple text match for now)
      const results: SearchResult[] = rules.map(rule => {
        const queryLower = searchRequest.query.toLowerCase()
        const textLower = rule.text.toLowerCase()

        // Simple relevance: exact match = 1.0, contains = 0.5
        let relevance = 0.5
        if (textLower === queryLower) {
          relevance = 1.0
        } else if (textLower.includes(queryLower)) {
          // Calculate based on position (earlier = more relevant)
          const position = textLower.indexOf(queryLower)
          relevance = 0.5 + (1 - position / textLower.length) * 0.4
        }

        // Find section path
        let sectionPath = 'unknown'
        for (const [sectionId, section] of Object.entries(rulebook.sections)) {
          for (const [subsectionId, subsection] of Object.entries(section.subsections)) {
            if (subsection.rules.some(r => r.id === rule.id)) {
              sectionPath = `${sectionId}.${subsectionId}`
              break
            }
          }
        }

        return {
          section: sectionPath,
          rule,
          relevance,
        }
      })

      // Sort by relevance
      results.sort((a, b) => b.relevance - a.relevance)

      const response: SearchResponse = {
        results,
        total: results.length,
      }

      return c.json({
        success: true,
        data: response,
      })
    } catch (error) {
      logger.error('Failed to search rules', { error })
      return c.json(
        {
          success: false,
          error: 'Failed to search rules',
        },
        500
      )
    }
  }
)

/**
 * GET /api/rulebook/packs
 * Get list of available unlock packs
 */
rulebookApi.get('/packs', async (c) => {
  try {
    const packs = await rulebookBuilder.getAvailablePacks()

    return c.json({
      success: true,
      data: {
        packs,
        count: packs.length,
      },
    })
  } catch (error) {
    logger.error('Failed to get packs', { error })
    return c.json(
      {
        success: false,
        error: 'Failed to get packs',
      },
      500
    )
  }
})

/**
 * POST /api/rulebook/clear-cache
 * Clear rulebook cache (for development/admin use)
 */
rulebookApi.post('/clear-cache', async (c) => {
  try {
    rulebookBuilder.clearCache()

    return c.json({
      success: true,
      message: 'Cache cleared successfully',
    })
  } catch (error) {
    logger.error('Failed to clear cache', { error })
    return c.json(
      {
        success: false,
        error: 'Failed to clear cache',
      },
      500
    )
  }
})

export default rulebookApi
