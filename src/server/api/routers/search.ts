import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { kernScores } from "@/server/db/schema";
import { getTableColumns, sql } from "drizzle-orm";
import { meiToRegex } from "@/common/meiToRegex";

export const searchRouter = createTRPCRouter({
  search: publicProcedure
    .input(z.object({ meiText: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const regex = meiToRegex(input.meiText);

      // this retrieves all scores in the database and adds a column for the number of matches
      const allScores = await ctx.db
        .select({
          ...getTableColumns(kernScores),
          numMatches: sql<number>`regexp_count(${kernScores.kernData}, ${regex}, 1, 'm')`,
        })
        .from(kernScores);

      // filter out scores with no matches
      const results = allScores.filter((score) => score.numMatches > 0);

      // sort by descending order of number of matches
      results.sort((a, b) => b.numMatches - a.numMatches);

      return results;
    }),
});
