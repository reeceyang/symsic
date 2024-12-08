import { db } from "@/server/db";
import { kernVoices } from "@/server/db/schema";
import assert from "assert";
import dotenv from "dotenv";

dotenv.config();

async function insertSplitVoices() {
  const scores = await db.query.kernScores.findMany();

  await db.transaction(async (tx) => {
    let counter = 0;
    for (const score of scores) {
      counter++;
      if (counter % 100 === 0) {
        console.log(counter);
      }
      const kernStartIndex = score.kernData.indexOf("**kern");
      const kernEndIndex = score.kernData.lastIndexOf("*-") + "*-".length;

      const scoreData = score.kernData.slice(kernStartIndex, kernEndIndex);
      const firstLine =
        scoreData.split("\n")[0] ?? assert.fail("No first line found");
      const columnHeaders = firstLine.split("\t");
      const voices: string[] = Array(columnHeaders.length).fill("");

      for (const line of scoreData.split("\n")) {
        line.split("\t").forEach((token, i) => {
          voices[i] += token + "\n";
        });
      }

      await tx
        .insert(kernVoices)
        .values(
          voices
            .filter((voice) => voice.startsWith("**kern"))
            .map((voice) => ({ scoreId: score.id, voice })),
        );
    }
  });
}

insertSplitVoices()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("script pooped :(", error);
    process.exit(1);
  });
