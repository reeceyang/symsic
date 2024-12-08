import { db } from "@/server/db";
import { kernScores, kernPatterns, kernPatternMatches, kernVoices} from "@/server/db/schema";
import dotenv from 'dotenv';
import { meiToRegex } from "@/common/meiToRegex";
import { desc, sql, eq} from "drizzle-orm";
import { generatePatterns } from "pattern-generator";

dotenv.config();

// decoupling from search.ts implementation in case we want the behavior to be different for benchmarking
async function insertPattern(results: any, pattern: string) {
    // this function inserts the pattern (regex) into the db
    db.insert(kernPatterns).values({
        pattern,
    });
    console.log(`inserting pattern ${pattern} into kernPatterns table`)
    // insert the pattern and get the id of the newly inserted pattern
    const [insertedPattern] = await db
        .insert(kernPatterns)
        .values({
        pattern,
        })
        .returning({ id: kernPatterns.id });

    console.log(`inserting matches for ${pattern} into kernPatternMatches table`)
    // insert the match count for each result if the id is defined
    if (insertedPattern == undefined) return;
    const insertValues = results.map((result: any) => ({
        patternId: insertedPattern!.id,
        kernScoreId: result.id,
        matchCount: result.matchCount,
    }));
    if (insertValues.length == 0) return;
    await db.insert(kernPatternMatches).values(insertValues);
} 

async function createInvertedIndex() {
    // this function gets the patterns, queries the kern scores for each pattern
    // creates an inverted index, and uploads it to the db into the kernPatternMatches table
    let patterns = generatePatterns();
    let results : [any, string][] = [];
    for (let pattern of patterns) {
        console.log("Processing pattern:", pattern);
        let search_regex = meiToRegex(pattern);
        // query the db for the pattern just how we do in search.ts
        console.log("Starting query to find match counts");
        // create a subquery to count num of matches in voices and sum them over kernId
        const matchesSubquery = db.$with("matches").as(
            db
            .select({
                kernId: kernVoices.scoreId,
                matchCount:
                sql<number>`SUM(regexp_count(${kernVoices.voice}, ${search_regex}, 1, 'm'))`.as(
                    "match_count",
                ),
            })
            .from(kernVoices)
            .groupBy(kernVoices.scoreId),
        );
  
      // grab results that match and join with kernScores to get titles
      let result = await db
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

        results.push([result, search_regex])
    }

    for (let [result, search_regex] of results) {
        // insert the pattern into the db
        console.log(`Inserting pattern into db`);
        await insertPattern(result, search_regex);
    }

}

async function clearPatterns() {
    // Delete everything in the kernPatterns and kernPatternMatches tables
    // Utility method for testing and benchmarking
    await db.delete(kernPatterns).execute();
    await db.delete(kernPatternMatches).execute();
}

// first, clear all patterns
clearPatterns().then(() => {
    console.log("Cleared patterns");
    createInvertedIndex().then(() => {
        console.log("Inverted index created");
    }).catch((error) => {
        console.error("Failed to create inverted index:", error);
    });
}).catch((error) => {
    console.error("Failed to clear patterns:", error);
});
