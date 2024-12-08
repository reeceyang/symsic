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
    // generating select two note patterns
    let notes_slice = NOTES.slice(2, 4);
    let octaves_slice = OCTAVES.slice(1, 3);
    let durations_slice = DURATIONS.slice(2, 3);
    let patterns2 = [];
    for (let pattern1 of patterns) {
        for (let note of notes_slice) {
            for (let octave of octaves_slice) {
                for (let duration of durations_slice) {
                    patterns2.push(`${pattern1} ${`<note pname="${note}" oct="${octave}" dur="${duration}"/>`}`);
                }
            }
        }
    }

    return patterns.concat(patterns2);

}

export { generatePatterns };