// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import {
  index,
  integer,
  pgTableCreator,
  varchar,
} from "drizzle-orm/pg-core";

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
    // 2 million because our largest kern file in the db approaches that
    kernData: varchar("kern_data", { length: 2000000 }).notNull(),
  },
  (table) => ({
    titleIndex: index("title_idx").on(table.title),
  })
);
