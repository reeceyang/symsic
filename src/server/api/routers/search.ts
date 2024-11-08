import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { kernScores } from "@/server/db/schema";
import { sql } from "drizzle-orm";
import { meiToRegex } from "@/common/meiToRegex";

export const searchRouter = createTRPCRouter({
  search: publicProcedure
    .input(z.object({ meiText: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const regex = meiToRegex(input.meiText);

      const scores = await ctx.db
        .select()
        .from(kernScores)
        .where(sql`${kernScores.kernData} ~ ${regex}`);

      return scores;
    }),
});
