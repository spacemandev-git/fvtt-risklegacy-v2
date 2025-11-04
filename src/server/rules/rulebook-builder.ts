import { readFile, readdir } from 'fs/promises'
import { join } from 'path'
import logger from '../logger'
import type {
  Rulebook,
  PackModifiers,
  RuleModifier,
  CampaignRulebook,
  Section,
  Subsection,
  Rule,
} from './schemas'
import {
  RulebookSchema,
  PackModifiersSchema,
} from './schemas'

/**
 * Rulebook builder - generates campaign-specific rulebooks by applying modifiers
 */
export class RulebookBuilder {
  private baseRules: Rulebook | null = null
  private modifierCache: Map<string, PackModifiers> = new Map()
  private compiledCache: Map<string, CampaignRulebook> = new Map()

  /**
   * Load base rules from JSON file
   */
  async loadBaseRules(): Promise<Rulebook> {
    if (this.baseRules) {
      return this.baseRules
    }

    try {
      const rulesPath = join(__dirname, 'base-rules.json')
      const rulesJson = await readFile(rulesPath, 'utf-8')
      const rulesData = JSON.parse(rulesJson)

      // Validate with Zod
      this.baseRules = RulebookSchema.parse(rulesData)
      logger.info('Base rules loaded successfully', {
        version: this.baseRules.version,
        sectionCount: Object.keys(this.baseRules.sections).length,
      })

      return this.baseRules
    } catch (error) {
      logger.error('Failed to load base rules', { error })
      throw new Error(`Failed to load base rules: ${error}`)
    }
  }

  /**
   * Load modifier file for a specific pack
   */
  async loadPackModifiers(packName: string): Promise<PackModifiers> {
    // Check cache first
    if (this.modifierCache.has(packName)) {
      return this.modifierCache.get(packName)!
    }

    try {
      const modifierPath = join(__dirname, 'modifiers', `${packName}.json`)
      const modifierJson = await readFile(modifierPath, 'utf-8')
      const modifierData = JSON.parse(modifierJson)

      // Validate with Zod
      const packModifiers = PackModifiersSchema.parse(modifierData)

      // Cache it
      this.modifierCache.set(packName, packModifiers)

      logger.info('Pack modifiers loaded', {
        pack: packName,
        modifierCount: packModifiers.modifiers.length,
      })

      return packModifiers
    } catch (error) {
      logger.warn('Failed to load pack modifiers', { packName, error })
      // Return empty modifiers if file doesn't exist
      return {
        pack: packName,
        name: packName,
        description: 'No modifiers available',
        modifiers: [],
      }
    }
  }

  /**
   * Get all available pack names
   */
  async getAvailablePacks(): Promise<string[]> {
    try {
      const modifiersDir = join(__dirname, 'modifiers')
      const files = await readdir(modifiersDir)
      return files
        .filter(f => f.endsWith('.json'))
        .map(f => f.replace('.json', ''))
    } catch (error) {
      logger.warn('Failed to read modifiers directory', { error })
      return []
    }
  }

  /**
   * Apply a single modifier to the rulebook
   */
  private applyModifier(rulebook: Rulebook, modifier: RuleModifier): void {
    switch (modifier.type) {
      case 'add_section':
        rulebook.sections[modifier.section_id] = modifier.data
        logger.debug('Added section', { sectionId: modifier.section_id })
        break

      case 'add_subsection': {
        const targetSection = rulebook.sections[modifier.section_id]
        if (targetSection) {
          if (!targetSection.subsections) {
            targetSection.subsections = {}
          }
          targetSection.subsections[modifier.subsection_id] = modifier.data
          logger.debug('Added subsection', {
            sectionId: modifier.section_id,
            subsectionId: modifier.subsection_id,
          })
        } else {
          logger.warn('Cannot add subsection: section not found', {
            sectionId: modifier.section_id,
          })
        }
        break
      }

      case 'add_rule': {
        const targetSection = rulebook.sections[modifier.section_id]
        const targetSubsection = targetSection?.subsections?.[modifier.subsection_id]
        if (targetSubsection) {
          if (!targetSubsection.rules) {
            targetSubsection.rules = []
          }
          targetSubsection.rules.push(modifier.rule)
          logger.debug('Added rule', {
            sectionId: modifier.section_id,
            subsectionId: modifier.subsection_id,
            ruleId: modifier.rule.id,
          })
        } else {
          logger.warn('Cannot add rule: subsection not found', {
            sectionId: modifier.section_id,
            subsectionId: modifier.subsection_id,
          })
        }
        break
      }

      case 'modify_rule':
        // Find and modify the rule
        let ruleFound = false
        for (const section of Object.values(rulebook.sections)) {
          if (!section.subsections) continue
          for (const subsection of Object.values(section.subsections)) {
            if (!subsection.rules) continue
            const ruleIndex = subsection.rules.findIndex(r => r.id === modifier.rule_id)
            if (ruleIndex >= 0) {
              const rule = subsection.rules[ruleIndex]
              if (rule) {
                subsection.rules[ruleIndex] = {
                  ...rule,
                  ...modifier.changes,
                  modifiers: [...(rule.modifiers || []), 'modified'],
                }
                ruleFound = true
                logger.debug('Modified rule', { ruleId: modifier.rule_id })
                break
              }
            }
          }
          if (ruleFound) break
        }
        if (!ruleFound) {
          logger.warn('Cannot modify rule: rule not found', { ruleId: modifier.rule_id })
        }
        break

      case 'remove_rule':
        // Find and remove the rule
        let removed = false
        for (const section of Object.values(rulebook.sections)) {
          for (const subsection of Object.values(section.subsections)) {
            const ruleIndex = subsection.rules.findIndex(r => r.id === modifier.rule_id)
            if (ruleIndex >= 0) {
              subsection.rules.splice(ruleIndex, 1)
              removed = true
              logger.debug('Removed rule', { ruleId: modifier.rule_id })
              break
            }
          }
          if (removed) break
        }
        if (!removed) {
          logger.warn('Cannot remove rule: rule not found', { ruleId: modifier.rule_id })
        }
        break

      case 'replace_section':
        rulebook.sections[modifier.section_id] = modifier.data
        logger.debug('Replaced section', { sectionId: modifier.section_id })
        break

      default:
        logger.warn('Unknown modifier type', { modifier })
    }
  }

  /**
   * Build a campaign-specific rulebook
   */
  async buildCampaignRulebook(
    campaignId: string,
    unlockedPacks: string[]
  ): Promise<CampaignRulebook> {
    // Check cache
    const cacheKey = `${campaignId}:${unlockedPacks.sort().join(',')}`
    if (this.compiledCache.has(cacheKey)) {
      logger.debug('Returning cached rulebook', { campaignId, unlockedPacks })
      return this.compiledCache.get(cacheKey)!
    }

    // Load base rules
    const baseRules = await this.loadBaseRules()

    // Deep clone base rules to avoid mutation
    const compiledRulebook: Rulebook = JSON.parse(JSON.stringify(baseRules))

    // Load and apply modifiers for each unlocked pack
    const allModifiers: RuleModifier[] = []

    for (const packName of unlockedPacks) {
      const packModifiers = await this.loadPackModifiers(packName)
      allModifiers.push(...packModifiers.modifiers)

      // Apply each modifier
      for (const modifier of packModifiers.modifiers) {
        this.applyModifier(compiledRulebook, modifier)
      }
    }

    // Update version string
    const version = unlockedPacks.length > 0
      ? `${baseRules.version}+${unlockedPacks.join('+')}`
      : baseRules.version

    // Update metadata
    compiledRulebook.metadata.lastUpdated = new Date().toISOString()

    // Create campaign rulebook
    const campaignRulebook: CampaignRulebook = {
      campaignId,
      baseRules,
      unlockedPacks,
      modifiers: allModifiers,
      compiledRulebook,
      version,
    }

    // Cache it
    this.compiledCache.set(cacheKey, campaignRulebook)

    logger.info('Built campaign rulebook', {
      campaignId,
      unlockedPacks,
      version,
      modifierCount: allModifiers.length,
    })

    return campaignRulebook
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.compiledCache.clear()
    this.modifierCache.clear()
    this.baseRules = null
    logger.info('Rulebook cache cleared')
  }

  /**
   * Clear cache for specific campaign
   */
  clearCampaignCache(campaignId: string): void {
    const keysToDelete: string[] = []
    for (const key of this.compiledCache.keys()) {
      if (key.startsWith(`${campaignId}:`)) {
        keysToDelete.push(key)
      }
    }
    keysToDelete.forEach(key => this.compiledCache.delete(key))
    logger.info('Cleared campaign rulebook cache', { campaignId, count: keysToDelete.length })
  }

  /**
   * Search rules by query
   */
  searchRules(rulebook: Rulebook, query: string, sections?: string[], tags?: string[]): Rule[] {
    const results: Rule[] = []
    const queryLower = query.toLowerCase()

    for (const [sectionId, section] of Object.entries(rulebook.sections)) {
      // Skip if sections filter provided and this section not included
      if (sections && sections.length > 0 && !sections.includes(sectionId)) {
        continue
      }

      for (const subsection of Object.values(section.subsections)) {
        for (const rule of subsection.rules) {
          // Check text match
          const textMatch = rule.text.toLowerCase().includes(queryLower)

          // Check tag match
          const tagMatch = tags && tags.length > 0
            ? tags.some(tag => rule.tags.includes(tag))
            : true

          if (textMatch && tagMatch) {
            results.push(rule)
          }
        }
      }
    }

    return results
  }

  /**
   * Get rule by ID
   */
  getRuleById(rulebook: Rulebook, ruleId: string): Rule | null {
    for (const section of Object.values(rulebook.sections)) {
      for (const subsection of Object.values(section.subsections)) {
        const rule = subsection.rules.find(r => r.id === ruleId)
        if (rule) {
          return rule
        }
      }
    }
    return null
  }

  /**
   * Get section by ID
   */
  getSectionById(rulebook: Rulebook, sectionId: string): Section | null {
    return rulebook.sections[sectionId] || null
  }
}

// Singleton instance
export const rulebookBuilder = new RulebookBuilder()
