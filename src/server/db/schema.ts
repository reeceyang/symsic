// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import { relations } from "drizzle-orm";
import { index, integer, pgTableCreator, varchar } from "drizzle-orm/pg-core";

// 2 million because our largest kern file in the db approaches that
const MAX_KERN_LENGTH = 2000000;

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `symsic_${name}`);

export const kernScores = createTable(
  "kern_score",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    title: varchar("title", { length: 256 }).notNull(),
    kernData: varchar("kern_data", { length: MAX_KERN_LENGTH }).notNull(),
  },
  (table) => ({
    titleIndex: index("title_idx").on(table.title),
  }),
);

export const kernVoices = createTable("kern_voice", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  scoreId: integer("score_id").notNull(),
  voice: varchar("voice", { length: MAX_KERN_LENGTH }).notNull(),
});

export const kernVoicesRelations = relations(kernVoices, ({ one }) => ({
  score: one(kernScores, {
    fields: [kernVoices.scoreId],
    references: [kernScores.id],
  }),
}));
// inverted indexes available for searching
export const kernPatterns = createTable(
  "kern_pattern",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    pattern: varchar("pattern", { length: 512 }).notNull(),
  },
  (table) => ({
    patternIndex: index("pattern_idx").on(table.pattern),
  }),
);

// table for storing number of matches for a given pattern and kern score
export const kernPatternMatches = createTable(
  "kern_pattern_match",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    patternId: integer("pattern_id").notNull(),
    kernScoreId: integer("kern_score_id").notNull(),
    matchCount: integer("match_count").notNull(),
  },
  (table) => ({
    patternIdIndex: index("pattern_id_idx").on(table.patternId),
    patternIdHashIndex: index().using("hash", table.patternId),
    kernScoreIdIndex: index("kern_score_id_idx").on(table.kernScoreId),
  }),
);
