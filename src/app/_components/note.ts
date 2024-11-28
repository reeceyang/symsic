export const DURATIONS = ["1", "2", "4", "8", "16", "32", "64", "128"] as const;
export type Duration = typeof DURATIONS[number];

export const ACCIDENTALS = ["sharp", "flat", "natural"] as const;
export type Accidental = typeof ACCIDENTALS[number];

export const PITCH_NAMES = ["C", "D", "E", "F", "G", "A", "B"] as const;
export type PitchName = typeof PITCH_NAMES[number];

export interface Note {
  duration: Duration;
  dotted: boolean;
  pitchName: PitchName;
  accidental?: Accidental; 
  octave: number;
  selected: boolean;
}

export const noteToMei = (note: Note): string => {
  const attrs = [];
  attrs.push(`pname="${note.pitchName}"`);
  attrs.push(`dur="${note.duration}"`);
  attrs.push(`oct="${note.octave}"`);
  if (note.dotted) {
    attrs.push(`dots="1"`);
  }
  if (note.accidental !== null) {
    attrs.push(`accid="${note.accidental}"`);
  }
  if (note.selected) {
    attrs.push(`color="red"`);
  }
  return `<note ${attrs.join(" ")} />`;
}