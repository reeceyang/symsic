export const DURATIONS = ["1", "2", "4", "8", "16", "32", "64", "128"] as const;
export type Duration = (typeof DURATIONS)[number];

export const ACCIDENTALS = ["sharp", "flat", "natural"] as const;
export type Accidental = (typeof ACCIDENTALS)[number];

export const PITCH_NAMES = ["c", "d", "e", "f", "g", "a", "b"] as const;
export type PitchName = (typeof PITCH_NAMES)[number];

export interface Note {
  duration: Duration;
  dotted?: boolean;
  pitchName: PitchName;
  accidental?: Accidental;
  octave: number;
  selected?: boolean;
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
};

export class SearchInput {
  constructor(
    private notes: Note[],
    private selectedIndex: number | null,
  ) {
    this.notes = notes;
    this.selectedIndex = selectedIndex;
  }

  getMeiText(): string {
    return this.notes
      .map((note, i) =>
        noteToMei({ ...note, selected: i === this.selectedIndex }),
      )
      .join("");
  }

  addNote(a: Omit<Note, "selected">): SearchInput {
    const newNotes = [...this.notes, a];
    const newSelectedIndex = newNotes.length - 1;
    return new SearchInput(newNotes, newSelectedIndex);
  }

  deleteSelectedNote(): SearchInput {
    if (this.selectedIndex === null) {
      return this;
    }
    const newNotes = [...this.notes];
    newNotes.splice(this.selectedIndex, 1);
    // If the no note was selected, we don't need to update the selected index
    if (this.selectedIndex === 0) {
      // if the first note was selected and deleted, selected the first note if it exists
      return new SearchInput(newNotes, newNotes.length === 0 ? null : 0);
    }
    // select the previous note
    return new SearchInput(newNotes, this.selectedIndex - 1);
  }

  selectNextNote(): SearchInput {
    if (this.selectedIndex === null) {
      return this;
    }
    if (this.selectedIndex === this.notes.length - 1) {
      return this;
    }
    return new SearchInput(this.notes, this.selectedIndex + 1);
  }

  selectPreviousNote(): SearchInput {
    if (this.selectedIndex === null) {
      return this;
    }
    if (this.selectedIndex === 0) {
      return this;
    }
    return new SearchInput(this.notes, this.selectedIndex - 1);
  }
}
