import { z } from "zod";
import { desc } from "drizzle-orm";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { kernScores, kernVoices} from "@/server/db/schema";
import { eq, sql } from "drizzle-orm";
import { meiToRegex } from "@/common/meiToRegex";
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
        results = await checkAndReturnPattern(regex, ctx.db);
        if (results != undefined) {
          // first rename kernScoreId to id
          results = results.map((result: { kernScoreId: Number; title: string; matchCount: Number; }) => {
            return { id: result.kernScoreId, title: result.title, matchCount: result.matchCount };
          });
          return results;
        }
      }

      // did not return early, need to do a sequential scan
      results = await sequentialScan(regex, ctx.db);

      if (UPDATE_PATTERNS) {
        // start an asynchronous job to insert the pattern into the db
        insertPattern(results, regex, ctx.db);
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
});

async function sequentialScan(pattern: string, db: any) {

    // create a subquery to count num of matches in voices and sum them over kernId
    const matchesSubquery = db.$with("matches").as(
      db
        .select({
          kernId: kernVoices.scoreId,
          matchCount:
            sql<number>`SUM(regexp_count(${kernVoices.voice}, ${pattern}, 1, 'm'))`.as(
              "match_count",
            ),
        })
        .from(kernVoices)
        .groupBy(kernVoices.scoreId),
    );

    // grab results that match and join with kernScores to get titles
    const results = await db
      .with(matchesSubquery)
      .select({
        id: kernScores.id,
        title: kernScores.title,
        matchCount: matchesSubquery.matchCount,
      })
      .from(matchesSubquery)
      .leftJoin(kernScores, eq(matchesSubquery.kernId, kernScores.id))
      .where(sql`match_count > 0`)
      .orderBy(desc(matchesSubquery.matchCount));
    
    return results;
}

async function checkAndReturnPattern(pattern: string, db: any) {
  // check if pattern is in the db
  const existingPattern = await db.query.kernPatterns.findFirst({
    where: eq(kernPatterns.pattern, pattern),
  });

  // if it is, find results and join on kernScores to grab the titles
  if (existingPattern != undefined && existingPattern.id != undefined) {
    console.log("found pattern in db");
    const results = await db.select({
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

async function insertPattern(results: { id: number; title: string; matchCount: number }[], pattern: string, db: any) {
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

export {checkAndReturnPattern, sequentialScan}