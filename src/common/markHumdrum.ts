function getLineIndex(characterIndex: number, lines: string[]) {
  let characters = 0;
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    // +1 to account for the \n.
    const line = lines[lineIndex];
    if (!line) {
      throw new Error("Empty line found.");
    }
    characters += line.length + 1;
    if (characterIndex + 1 <= characters) {
      return lineIndex;
    }
  }
  throw new Error("Character index greater than string length.");
}

export const markHumdrum = (humdrumData: string, regexPattern: string) => {
  const regex = new RegExp(regexPattern, "gm");
  const dataLines = humdrumData.split("\n");
  let outputLines = dataLines.slice();
  let match;
  const lineIndices = [];
  while ((match = regex.exec(humdrumData)) !== null) {
    console.log("Match!", match.index, regex.lastIndex);
    const startLine = getLineIndex(match.index, dataLines);
    const endLine = getLineIndex(regex.lastIndex - 2, dataLines);
    for (let lineIndex = startLine; lineIndex <= endLine; lineIndex++) {
      const line = outputLines[lineIndex];
      if (!line) {
        throw new Error("Empty line found.");
      }
      lineIndices.push(lineIndex);
      if (line[0] != ".") {
        outputLines[lineIndex] += "@";
      }
    }
  }
  return lineIndices;
  // // Remove empty lines (invalid in Humdrum).
  // outputLines = outputLines.filter(function (line) {
  //   return line != "";
  // });
  // outputLines.push("!!!RDF**kern: @ = marked note");
  // return outputLines.join("\n");
};
