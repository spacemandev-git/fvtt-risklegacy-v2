import { z } from 'zod'

/**
 * Individual rule that can be referenced, modified, or overridden
 */
export const RuleSchema = z.object({
  id: z.string().describe('Unique rule identifier (e.g., "combat.attacking.minimum_troops")'),
  text: z.string().describe('The rule text'),
  priority: z.number().int().default(1).describe('Priority level (1=base, higher=unlock modifications)'),
  modifiers: z.array(z.string()).default([]).describe('List of modifier IDs that have affected this rule'),
  tags: z.array(z.string()).default([]).describe('Tags for searching (e.g., ["combat", "dice"])'),
  phase: z.string().optional().describe('Game phase this rule applies to'),
  applies_to: z.string().default('all').describe('Who this rule applies to (all, attacker, defender, faction, etc.)'),
})

export type Rule = z.infer<typeof RuleSchema>

/**
 * Example scenario for a rule or subsection
 */
export const ExampleSchema = z.object({
  scenario: z.string().describe('Brief scenario description'),
  explanation: z.string().describe('How the rule applies to this scenario'),
})

export type Example = z.infer<typeof ExampleSchema>

/**
 * Subsection within a section
 */
export const SubsectionSchema = z.object({
  title: z.string().describe('Subsection title'),
  content: z.string().describe('Main content/explanation'),
  rules: z.array(RuleSchema).default([]).describe('Specific rules in this subsection'),
  examples: z.array(ExampleSchema).default([]).describe('Example scenarios'),
  related: z.array(z.string()).default([]).describe('Related section/subsection IDs'),
})

export type Subsection = z.infer<typeof SubsectionSchema>

/**
 * Major section of the rulebook
 */
export const SectionSchema = z.object({
  id: z.string().describe('Section identifier (e.g., "combat", "setup")'),
  title: z.string().describe('Section title'),
  summary: z.string().describe('Brief summary of this section'),
  subsections: z.record(z.string(), SubsectionSchema).describe('Subsections organized by key'),
})

export type Section = z.infer<typeof SectionSchema>

/**
 * Faction power definition
 */
export const FactionPowerSchema = z.object({
  id: z.string().describe('Power identifier'),
  text: z.string().describe('Power description'),
  trigger: z.string().describe('When this power activates (e.g., "recruit_phase", "on_attack")'),
})

export type FactionPower = z.infer<typeof FactionPowerSchema>

/**
 * Faction information
 */
export const FactionInfoSchema = z.object({
  id: z.string().describe('Faction identifier'),
  name: z.string().describe('Faction name'),
  description: z.string().describe('Faction description'),
  starting_powers: z.array(FactionPowerSchema).describe('Two starting powers (player chooses one)'),
  strategy_notes: z.string().optional().describe('Strategic advice for playing this faction'),
})

export type FactionInfo = z.infer<typeof FactionInfoSchema>

/**
 * Glossary term definition
 */
export const GlossaryTermSchema = z.object({
  term: z.string().describe('The term being defined'),
  definition: z.string().describe('Definition of the term'),
  related: z.array(z.string()).default([]).describe('Related terms or section IDs'),
})

export type GlossaryTerm = z.infer<typeof GlossaryTermSchema>

/**
 * Complete rulebook structure
 */
export const RulebookSchema = z.object({
  version: z.string().describe('Rulebook version (e.g., "1.0.0")'),
  metadata: z.object({
    title: z.string().describe('Rulebook title'),
    description: z.string().describe('Rulebook description'),
    lastUpdated: z.string().describe('Last update date (ISO 8601)'),
  }),
  sections: z.record(z.string(), SectionSchema).describe('All rulebook sections'),
  factions: z.record(z.string(), FactionInfoSchema).optional().describe('Faction information'),
  glossary: z.array(GlossaryTermSchema).default([]).describe('Glossary of game terms'),
})

export type Rulebook = z.infer<typeof RulebookSchema>

/**
 * Rule modifier types for unlock packs
 */
export const RuleModifierTypeSchema = z.enum([
  'add_section',
  'modify_rule',
  'add_rule',
  'remove_rule',
  'replace_section',
  'add_subsection',
])

export type RuleModifierType = z.infer<typeof RuleModifierTypeSchema>

/**
 * Base modifier interface
 */
export const BaseModifierSchema = z.object({
  type: RuleModifierTypeSchema,
  description: z.string().optional().describe('What this modifier does'),
})

/**
 * Add new section modifier
 */
export const AddSectionModifierSchema = BaseModifierSchema.extend({
  type: z.literal('add_section'),
  section_id: z.string().describe('New section ID'),
  data: SectionSchema.describe('Section data'),
})

/**
 * Modify existing rule modifier
 */
export const ModifyRuleModifierSchema = BaseModifierSchema.extend({
  type: z.literal('modify_rule'),
  rule_id: z.string().describe('Rule ID to modify'),
  changes: z.object({
    text: z.string().optional(),
    priority: z.number().int().optional(),
    tags: z.array(z.string()).optional(),
    phase: z.string().optional(),
    applies_to: z.string().optional(),
  }).describe('Fields to change'),
})

/**
 * Add new rule modifier
 */
export const AddRuleModifierSchema = BaseModifierSchema.extend({
  type: z.literal('add_rule'),
  section_id: z.string().describe('Section ID to add rule to'),
  subsection_id: z.string().describe('Subsection ID within section'),
  rule: RuleSchema.describe('Rule to add'),
})

/**
 * Remove rule modifier
 */
export const RemoveRuleModifierSchema = BaseModifierSchema.extend({
  type: z.literal('remove_rule'),
  rule_id: z.string().describe('Rule ID to remove/disable'),
})

/**
 * Replace section modifier
 */
export const ReplaceSectionModifierSchema = BaseModifierSchema.extend({
  type: z.literal('replace_section'),
  section_id: z.string().describe('Section ID to replace'),
  data: SectionSchema.describe('New section data'),
})

/**
 * Add subsection modifier
 */
export const AddSubsectionModifierSchema = BaseModifierSchema.extend({
  type: z.literal('add_subsection'),
  section_id: z.string().describe('Section ID to add subsection to'),
  subsection_id: z.string().describe('New subsection ID'),
  data: SubsectionSchema.describe('Subsection data'),
})

/**
 * Union of all modifier types
 */
export const RuleModifierSchema = z.discriminatedUnion('type', [
  AddSectionModifierSchema,
  ModifyRuleModifierSchema,
  AddRuleModifierSchema,
  RemoveRuleModifierSchema,
  ReplaceSectionModifierSchema,
  AddSubsectionModifierSchema,
])

export type RuleModifier = z.infer<typeof RuleModifierSchema>

/**
 * Pack modifiers - all modifications from a single unlock pack
 */
export const PackModifiersSchema = z.object({
  pack: z.string().describe('Pack name (e.g., "secondwin", "minorcities")'),
  name: z.string().describe('Human-readable pack name'),
  description: z.string().describe('What this pack adds'),
  modifiers: z.array(RuleModifierSchema).describe('All rule modifications in this pack'),
})

export type PackModifiers = z.infer<typeof PackModifiersSchema>

/**
 * Campaign-specific rulebook instance
 */
export const CampaignRulebookSchema = z.object({
  campaignId: z.string().describe('Campaign identifier'),
  baseRules: RulebookSchema.describe('Base rulebook'),
  unlockedPacks: z.array(z.string()).describe('List of unlocked pack names'),
  modifiers: z.array(RuleModifierSchema).describe('All applied modifiers'),
  compiledRulebook: RulebookSchema.describe('Compiled rulebook with all modifiers applied'),
  version: z.string().describe('Compiled version string'),
})

export type CampaignRulebook = z.infer<typeof CampaignRulebookSchema>

/**
 * Search result
 */
export const SearchResultSchema = z.object({
  section: z.string().describe('Section/subsection path (e.g., "combat.defending")'),
  rule: RuleSchema.describe('Matching rule'),
  relevance: z.number().min(0).max(1).describe('Relevance score (0-1)'),
})

export type SearchResult = z.infer<typeof SearchResultSchema>

/**
 * Search request
 */
export const SearchRequestSchema = z.object({
  query: z.string().min(1).describe('Search query'),
  campaignId: z.string().optional().describe('Campaign ID for campaign-specific rules'),
  sections: z.array(z.string()).optional().describe('Limit search to specific sections'),
  tags: z.array(z.string()).optional().describe('Filter by tags'),
})

export type SearchRequest = z.infer<typeof SearchRequestSchema>

/**
 * Search response
 */
export const SearchResponseSchema = z.object({
  results: z.array(SearchResultSchema).describe('Search results ordered by relevance'),
  total: z.number().int().describe('Total number of results'),
})

export type SearchResponse = z.infer<typeof SearchResponseSchema>
