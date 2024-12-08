import { db } from "@/server/db";
import { kernScores, kernPatterns, kernPatternMatches} from "@/server/db/schema";
import dotenv from 'dotenv';
import { meiToRegex } from "@/common/meiToRegex";
import { desc, sql } from "drizzle-orm";

dotenv.config();
const NOTES = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
const OCTAVES = ['3', '4', '5', '6'];
const DURATIONS = ['1', '2', '4', '8', '16', '32', '64'];

function generatePatterns() {
    // this function generates all possible patterns of length 1 and 2
    // NOT beamed
    let patterns = [];
    for (let note of NOTES) {
        for (let octave of OCTAVES) {
            for (let duration of DURATIONS) {
                patterns.push(`<note pname="${note}" oct="${octave}" dur="${duration}"/>`);
            }
        }
    }
    // let patterns2 = [];
    // for (let pattern of patterns) {
    //     for (let pattern2 of patterns) {
    //         patterns2.push(pattern + pattern2);
    //     }
    // }

    // return patterns.concat(patterns2);
    return patterns;

}

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
    for (let pattern of patterns) {
        console.log("Processing pattern:", pattern);
        let search_regex = meiToRegex(pattern);
        // query the db for the pattern just how we do in search.ts
        console.log("Starting query to find match counts");
        let matchesSubquery = db.$with("matches").as(
            db
                .select({
                    id: kernScores.id,
                    matchCount: sql<number>`regexp_count(${kernScores.kernData}, ${search_regex}, 1, 'm')`.as("match_count"),
                })
                .from(kernScores),
        );

        console.log("Starting query to filter for scores that actually match");
        // grab results that match
        let results = await db
            .with(matchesSubquery)
            .select()
            .from(matchesSubquery)
            .where(sql`match_count > 0`)
            .orderBy(desc(matchesSubquery.matchCount))
            .limit(100)

        console.log("Inserting pattern");
        // insert the "pattern" aka search_regex into the db
        insertPattern(results, search_regex);
        console.log("Inserted pattern:", pattern);
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
