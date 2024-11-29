export const DURATIONS = ["1", "2", "4", "8", "16", "32", "64", "128"] as const;
export type Duration = (typeof DURATIONS)[number];

export const ACCIDENTALS = ["s", "f"] as const;
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

  /**
   * Change the octave of the selected note and also set the selected octave to
   * the given octave so that new notes are added with the same octave.
   *
   * @param octave the new octave of the note
   * @returns a new SearchInput with the selected note's octave changed to the given octave and the selected octave set to the given octave
   */
  private changeSelectedNoteOctave(octave: number): SearchInput {
    if (this.props.selectedIndex === null) {
      return this;
    }
    const newNotes = [...this.props.notes];
    const selectedNote = newNotes[this.props.selectedIndex];
    if (!selectedNote) {
      throw new Error("selectedNote is undefined");
    }
    newNotes[this.props.selectedIndex] = { ...selectedNote, octave };
    return new SearchInput({
      ...this.props,
      notes: newNotes,
      selectedOctave: octave,
    });
  }

  /**
   * @returns a new SearchInput with the selected note's octave incremented by 1 and the selected octave set to the incremented octave
   */
  incrementSelectedNoteOctave(): SearchInput {
    return this.changeSelectedNoteOctave(this.props.selectedOctave + 1);
  }

  /**
   *
   * @returns a new SearchInput with the selected note's octave decremented by 1 and the selected octave set to the decremented octave
   */
  decrementSelectedNoteOctave(): SearchInput {
    return this.changeSelectedNoteOctave(this.props.selectedOctave - 1);
  }

  /**
   * Change the pitch of the selected note.
   *
   * @param pitch the new pitch of the selected note
   * @returns a new SearchInput with the selected note's pitch changed to the given pitch
   */
  private changeSelectedNotePitch(pitch: PitchName): SearchInput {
    if (this.props.selectedIndex === null) {
      return this;
    }
    const newNotes = [...this.props.notes];
    const selectedNote = newNotes[this.props.selectedIndex];
    if (!selectedNote) {
      throw new Error("selectedNote is undefined");
    }
    newNotes[this.props.selectedIndex] = { ...selectedNote, pitchName: pitch };
    return new SearchInput({
      ...this.props,
      notes: newNotes,
    });
  }

  private getSelectedNote(): Note | null {
    if (this.props.selectedIndex === null) {
      return null;
    }
    const selectedNote = this.props.notes[this.props.selectedIndex];
    if (!selectedNote) {
      throw new Error("selectedNote is undefined");
    }
    return selectedNote;
  }

  moveSelectedNoteUp(): SearchInput {
    const selectedNote = this.getSelectedNote();
    if (selectedNote === null) {
      return this;
    }
    const selectedPitchIndex = PITCH_NAMES.indexOf(selectedNote.pitchName);
    const newPitchIndex = (selectedPitchIndex + 1) % PITCH_NAMES.length;
    const newPitch = PITCH_NAMES[newPitchIndex];
    if (!newPitch) {
      throw new Error("newPitch is undefined");
    }
    const newSearchInput = this.changeSelectedNotePitch(newPitch);
    if (newPitch === "c") {
      return newSearchInput.incrementSelectedNoteOctave();
    }
    return newSearchInput;
  }

  moveSelectedNoteDown(): SearchInput {
    const selectedNote = this.getSelectedNote();
    if (selectedNote === null) {
      return this;
    }
    const selectedPitchIndex = PITCH_NAMES.indexOf(selectedNote.pitchName);
    const newPitchIndex =
      (selectedPitchIndex - 1 + PITCH_NAMES.length) % PITCH_NAMES.length;
    const newPitch = PITCH_NAMES[newPitchIndex];
    if (!newPitch) {
      throw new Error("newPitch is undefined");
    }
    const newSearchInput = this.changeSelectedNotePitch(newPitch);
    if (newPitch === "b") {
      return newSearchInput.decrementSelectedNoteOctave();
    }
    return newSearchInput;
  }

  private changeSelectedNoteAccidental(
    accidental: Accidental | undefined,
  ): SearchInput {
    if (this.props.selectedIndex === null) {
      return this;
    }
    const newNotes = [...this.props.notes];
    const selectedNote = newNotes[this.props.selectedIndex];
    if (!selectedNote) {
      throw new Error("selectedNote is undefined");
    }
    newNotes[this.props.selectedIndex] = { ...selectedNote, accidental };
    return new SearchInput({
      ...this.props,
      notes: newNotes,
    });
  }

  toggleSelectedNoteSharp(): SearchInput {
    const selectedNote = this.getSelectedNote();
    if (selectedNote === null) {
      return this;
    }
    if (selectedNote.accidental === "s") {
      return this.changeSelectedNoteAccidental(undefined);
    }
    return this.changeSelectedNoteAccidental("s");
  }

  toggleSelectedNoteFlat(): SearchInput {
    const selectedNote = this.getSelectedNote();
    if (selectedNote === null) {
      return this;
    }
    if (selectedNote.accidental === "f") {
      return this.changeSelectedNoteAccidental(undefined);
    }
    return this.changeSelectedNoteAccidental("f");
  }
}
