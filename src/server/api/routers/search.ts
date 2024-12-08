import { z } from "zod";
import { desc } from "drizzle-orm";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { kernScores, kernVoices } from "@/server/db/schema";
import { eq, sql } from "drizzle-orm";
import { meiToRegex } from "@/common/meiToRegex";
import { db } from "@/server/db";
import { kernPatterns, kernPatternMatches } from "@/server/db/schema";

const SEARCH_EXISTING_PATTERNS = true;
const UPDATE_PATTERNS = false;
export const searchRouter = createTRPCRouter({
  search: publicProcedure
    .input(z.object({ meiText: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const regex = meiToRegex(input.meiText);
      let results;
      if (SEARCH_EXISTING_PATTERNS) {
        // check if pattern is in the db
        results = await checkAndReturnPattern(regex, ctx);
        if (results != undefined) {
          // first rename kernScoreId to id
          results = results.map(
            (result: {
              kernScoreId: Number;
              title: string;
              matchCount: Number;
            }) => {
              return {
                id: result.kernScoreId,
                title: result.title,
                matchCount: result.matchCount,
              };
            },
          );
          return results;
        }
      }

      // create a subquery to count num of matches so that we don't have to recompute it
      // aliasing doesn't work :(
      const matchesSubquery = ctx.db.$with("matches").as(
        ctx.db
          .select({
            id: kernScores.id,
            title: kernScores.title,
            matchCount:
              sql<number>`regexp_count(${kernScores.kernData}, ${regex}, 1, 'm')`.as(
                "match_count",
              ),
          })
          .from(kernScores),
      );

      // grab results that match
      results = await ctx.db
        .with(matchesSubquery)
        .select()
        .from(matchesSubquery)
        .where(sql`match_count > 0`)
        .orderBy(desc(matchesSubquery.matchCount));

      if (UPDATE_PATTERNS) {
        // start an asynchronous job to insert the pattern into the db
        insertPattern(results, regex);
      }

      return results;
    }),

  getKernData: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db.query.kernScores.findFirst({
        where: eq(kernScores.id, input.id),
      });
      return result;
    }),

  getKernVoices: publicProcedure
    .input(z.object({ scoreId: z.number() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db.query.kernVoices.findMany({
        where: eq(kernVoices.scoreId, input.scoreId),
      });
      return result;
    }),
});

async function checkAndReturnPattern(pattern: string, ctx: any) {
  // check if pattern is in the db
  const existingPattern = await ctx.db.query.kernPatterns.findFirst({
    where: eq(kernPatterns.pattern, pattern),
  });

  // if it is, find results and join on kernScores to grab the titles
  if (existingPattern != undefined && existingPattern.id != undefined) {
    const results = await ctx.db
      .select({
        kernScoreId: kernPatternMatches.kernScoreId,
        title: kernScores.title,
        matchCount: kernPatternMatches.matchCount,
      })
      .from(kernPatternMatches)
      .leftJoin(kernScores, eq(kernPatternMatches.kernScoreId, kernScores.id))
      .where(eq(kernPatternMatches.patternId, existingPattern.id))
      .orderBy(desc(kernPatternMatches.matchCount));

    return results;
  }
}

async function insertPattern(
  results: { id: number; title: string; matchCount: number }[],
  pattern: string,
) {
  // first check if the pattern is already in the db
  const existingPattern = await db.query.kernPatterns.findFirst({
    where: eq(kernPatterns.pattern, pattern),
  });
  // return because our set of results is the same
  if (existingPattern) return;

  // insert the pattern and get the id of the newly inserted pattern
  const [insertedPattern] = await db
    .insert(kernPatterns)
    .values({
      pattern,
    })
    .returning({ id: kernPatterns.id });

  // insert the match count for each result if the id is defined
  if (insertedPattern == undefined) return;
  for (const result of results) {
    await db.insert(kernPatternMatches).values({
      patternId: insertedPattern!.id,
      kernScoreId: result.id,
      matchCount: result.matchCount,
    });
  }
}
