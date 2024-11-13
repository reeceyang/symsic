import { z } from "zod";
import { desc } from "drizzle-orm";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { kernScores } from "@/server/db/schema";
import { eq, sql } from "drizzle-orm";
import { meiToRegex } from "@/common/meiToRegex";

export const searchRouter = createTRPCRouter({
  search: publicProcedure
    .input(z.object({ meiText: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const regex = meiToRegex(input.meiText);

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
      const results = await ctx.db
        .with(matchesSubquery)
        .select()
        .from(matchesSubquery)
        .where(sql`match_count > 0`)
        .orderBy(desc(matchesSubquery.matchCount));

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
