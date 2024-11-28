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

interface SearchInputProps {
  isDottedMode: boolean;
  selectedDuration: Duration;
  selectedOctave: number;
  notes: Note[];
  selectedIndex: number | null;
}

export class SearchInput {
  private props: SearchInputProps;

  constructor(
    props: SearchInputProps = {
      isDottedMode: false,
      selectedDuration: "4",
      selectedOctave: 4,
      notes: [],
      selectedIndex: null,
    },
  ) {
    this.props = props;
  }

  getMeiText(): string {
    return this.props.notes
      .map((note, i) =>
        noteToMei({ ...note, selected: i === this.props.selectedIndex }),
      )
      .join("");
  }

  getSelectedDuration(): Duration {
    return this.props.selectedDuration;
  }

  setSelectedDuration(duration: Duration): SearchInput {
    return new SearchInput({ ...this.props, selectedDuration: duration });
  }

  getSelectedOctave(): number {
    return this.props.selectedOctave;
  }

  increaseSelectedOctave(): SearchInput {
    return new SearchInput({
      ...this.props,
      selectedOctave: this.props.selectedOctave + 1,
    });
  }

  decreaseSelectedOctave(): SearchInput {
    return new SearchInput({
      ...this.props,
      selectedOctave: this.props.selectedOctave - 1,
    });
  }

  getIsDottedMode(): boolean {
    return this.props.isDottedMode;
  }

  toggleDottedMode(): SearchInput {
    return new SearchInput({
      ...this.props,
      isDottedMode: !this.props.isDottedMode,
    });
  }

  addNote(pitchName: PitchName): SearchInput {
    const newNotes: Note[] = [
      ...this.props.notes,
      {
        duration: this.props.selectedDuration,
        pitchName,
        octave: this.props.selectedOctave,
        dotted: this.props.isDottedMode,
      },
    ];
    const newSelectedIndex = newNotes.length - 1;
    return new SearchInput({
      ...this.props,
      notes: newNotes,
      selectedIndex: newSelectedIndex,
    });
  }

  deleteSelectedNote(): SearchInput {
    if (this.props.selectedIndex === null) {
      return this;
    }
    const newNotes = [...this.props.notes];
    newNotes.splice(this.props.selectedIndex, 1);
    // If the no note was selected, we don't need to update the selected index
    if (this.props.selectedIndex === 0) {
      // if the first note was selected and deleted, selected the first note if it exists
      return new SearchInput({
        ...this.props,
        notes: newNotes,
        selectedIndex: newNotes.length === 0 ? null : 0,
      });
    }
    // select the previous note
    return new SearchInput({
      ...this.props,
      notes: newNotes,
      selectedIndex: this.props.selectedIndex - 1,
    });
  }

  selectNextNote(): SearchInput {
    if (this.props.selectedIndex === null) {
      return this;
    }
    if (this.props.selectedIndex === this.props.notes.length - 1) {
      return this;
    }
    return new SearchInput({
      ...this.props,
      selectedIndex: this.props.selectedIndex + 1,
    });
  }

  selectPreviousNote(): SearchInput {
    if (this.props.selectedIndex === null) {
      return this;
    }
    if (this.props.selectedIndex === 0) {
      return this;
    }
    return new SearchInput({
      ...this.props,
      selectedIndex: this.props.selectedIndex - 1,
    });
  }
}
