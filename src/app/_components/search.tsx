"use client";

import { useEffect, useState } from "react";
import type { FC } from "react";
import { api } from "@/trpc/react";
import { patternToMEI } from "@/common/meiToRegex";
import { Checkbox, Field, Label } from "@headlessui/react";
import { SearchInput } from "./note";
import { useHotkeys } from "react-hotkeys-hook";

const DEFAULT_INPUT = `<beam>
    <note dur="8" dots="1" query:any-pitch="true" />
    <note dur="16" query:any-pitch="true" />
    <note dur="8" query:any-pitch="true" />
</beam>`;

export const Search: FC<{
  setSelectedScoreId: (id: number | null) => void;
  selectedScoreId: number | null;
}> = ({ setSelectedScoreId, selectedScoreId }) => {
  const [advancedInput, setAdvancedInput] = useState(DEFAULT_INPUT);
  const [meiText, setMeiText] = useState(``);
  const { data } = api.search.search.useQuery(
    { meiText },
    { enabled: Boolean(meiText) },
  );
  const [svg, setSvg] = useState("");
  const [isAdvancedSearch, setIsAdvancedSearch] = useState(false);
  const [input, setInput] = useState<SearchInput>(new SearchInput());

  const setInputAndRerender = (newInput: SearchInput) => {
    setInput(newInput);
    rerenderInput(newInput.getMeiText());
  };

  useHotkeys("a", () => setInputAndRerender(input.addNote("a")))
  useHotkeys("b", () => setInputAndRerender(input.addNote("b")))
  useHotkeys("c", () => setInputAndRerender(input.addNote("c")))
  useHotkeys("d", () => setInputAndRerender(input.addNote("d")))
  useHotkeys("e", () => setInputAndRerender(input.addNote("e")))
  useHotkeys("f", () => setInputAndRerender(input.addNote("f")))
  useHotkeys("g", () => setInputAndRerender(input.addNote("g")))

  useHotkeys("backspace", () =>
    setInputAndRerender(input.deleteSelectedNote()),
  );

  useHotkeys("left", () => setInputAndRerender(input.selectPreviousNote()));

  useHotkeys("right", () => setInputAndRerender(input.selectNextNote()));

  const rerenderInput = (input: string) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const svg: string = verovioToolkit.renderData(
      isAdvancedSearch ? advancedInput : patternToMEI(input),
      {},
    );
    setSvg(svg);
  };

  useEffect(() => {
    // HACK: wait for verovio to be loaded before rendering
    const timeout = setTimeout(() => rerenderInput(input.getMeiText()), 500);

    return () => {
      clearTimeout(timeout);
    };
  });

  return (
    <div className="flex h-full w-full max-w-md flex-col gap-6">
      <div
        className="h-36 overflow-clip rounded-md bg-white"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <div className="flex flex-row gap-4">
        <Field className="flex items-center gap-2">
          <Checkbox
            checked={isAdvancedSearch}
            onChange={() => setIsAdvancedSearch(!isAdvancedSearch)}
            className="group block size-4 rounded border bg-white data-[checked]:bg-blue-500"
          />
          <Label>Advanced search</Label>
        </Field>
        {isAdvancedSearch && (
          <Field className="flex items-center gap-2">
            <Checkbox
              checked={true}
              className="group block size-4 rounded border bg-white data-[checked]:bg-blue-500"
            />
            <Label>Use sequential scan</Label>
          </Field>
        )}
      </div>
      {isAdvancedSearch && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setMeiText(advancedInput);
          }}
          className="flex flex-row gap-2"
        >
          <textarea
            placeholder="MEI"
            value={advancedInput}
            onChange={(e) => {
              setAdvancedInput(e.target.value);
              rerenderInput(e.target.value);
            }}
            className="w-full rounded-md px-4 py-2 text-black"
          />
          <div>
            <button
              type="submit"
              className="rounded-full bg-white/10 px-10 py-3 font-semibold transition hover:bg-white/30"
            >
              Search
            </button>
          </div>
        </form>
      )}
      <div className="flex flex-col gap-6 overflow-y-auto">
        <p>{data?.length ?? 0} results.</p>
        {data?.length
          ? data.map((score, i) => (
              <div
                className={`flex cursor-pointer flex-row rounded-md bg-white/10 p-3 backdrop-blur-md transition-all hover:bg-white/30 ${selectedScoreId === score.id && "ring-2 ring-inset ring-white/30"}`}
                key={i}
                onClick={() => setSelectedScoreId(score.id)}
              >
                <p>{score.title}</p>
                <p className="ml-auto">
                  {score.matchCount} match{score.matchCount !== 1 && "es"}
                </p>
              </div>
            ))
          : null}
      </div>
    </div>
  );
};
