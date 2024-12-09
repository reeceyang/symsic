import { db } from "@/server/db";
import { kernScores } from "@/server/db/schema";
import { readdir, readFile } from "fs/promises";
import { join } from "path";
import dotenv from 'dotenv';

dotenv.config();

async function readKernFilesRecursively(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) {
        return readKernFilesRecursively(path);
      } else if (entry.name.endsWith('.krn')) {
        return [path];
      }
      return [];
    })
  );
  return files.flat();
}

async function importKernFiles() {
  try {
    // This is the important line
    // if you have a directory of kern scores you want to put in the db put it here
    // TODO: ignore duplicates (?)
    // trivial solution is to not push if filename is the same, but filenames could be different
    // and content the same. maybe literally check content.
    const kernFilesDir = "kern/humdrum-data/.source/";
    const kernFiles = await readKernFilesRecursively(kernFilesDir);
    let insertedCount = 0;
    let maxLength = -1;
    
    console.log(`Found ${kernFiles.length} kern files`);
    for (const filePath of kernFiles) {
      try {
        const kernData = await readFile(filePath, 'utf-8');
        const title = filePath.split('/').pop()?.replace('.krn', '') ?? '';
        // check that the number of characters in the kern file is less than 2000000
        // if it is, throw an error
        maxLength = Math.max(maxLength, kernData.length);
        // should never happenw ith our dataset fingers crossed
        if (kernData.length > 2000000) {
          throw new Error(`${filePath} is too long: ${kernData.length}`);
        }
        
        await db.insert(kernScores).values({
          title,
          kernData,
        });
        
        // console.log(`Successfully imported: ${title} (${filePath})`);
        insertedCount++;
      } catch (error) {
        console.error(`Error importing ${filePath}:`, error);
      }
    }
    
    console.log("Inserted", insertedCount, "kern scores")
    console.log("Max length was", maxLength)
  } catch (error) {
    console.error('Failed to import kern files:', error);
  }
}

importKernFiles()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('script pooped :(', error);
    process.exit(1);
  }); 