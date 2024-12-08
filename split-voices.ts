import { db } from "@/server/db";
import { kernVoices } from "@/server/db/schema";
import assert from "assert";
import dotenv from "dotenv";

dotenv.config();

async function insertSplitVoices() {
  const scores = await db.query.kernScores.findMany({ limit: 100 });

  await db.transaction(async (tx) => {
    await tx.insert(kernVoices).values(
      scores.flatMap((score) => {
        const kernStartIndex = score.kernData.indexOf("**kern");
        const kernEndIndex = score.kernData.lastIndexOf("*-") + "*-".length;

        const scoreData = score.kernData.slice(kernStartIndex, kernEndIndex);
        const numVoices =
          scoreData.match(/\*\*kern/)?.length ?? assert.fail("No voices found");
        const voices = Array(numVoices).fill("");

        for (const line of scoreData.split("\n")) {
          line.split("\t").forEach((token, i) => {
            voices[i] += token + "\n";
          });
        }
        return voices.map((voice) => ({ scoreId: score.id, voice }));
      }),
    );
  });
}

insertSplitVoices()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("script pooped :(", error);
    process.exit(1);
  });
