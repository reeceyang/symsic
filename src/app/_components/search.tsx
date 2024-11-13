"use client";

import { useEffect, useState } from "react";
import { api } from "@/trpc/react";
import { patternToMEI } from "@/common/meiToRegex";
import { Checkbox, Field, Label } from "@headlessui/react";

const DEFAULT_INPUT = `<beam>
    <note dur="8" dots="1" query:any-pitch="true" />
    <note dur="16" query:any-pitch="true" />
    <note dur="8" query:any-pitch="true" />
</beam>`;

export function Search() {
  const [input, setInput] = useState(DEFAULT_INPUT);
  const [meiText, setMeiText] = useState(``);
  const { data } = api.search.search.useQuery(
    { meiText },
    { enabled: Boolean(meiText) },
  );
  const [svg, setSvg] = useState("");
  const [isAdvancedSearch, setIsAdvancedSearch] = useState(true);

  // HACK: wait for verovio to be loaded before rendering
  useEffect(() => {
    const timeout = setTimeout(() => {
      const svg: string = verovioToolkit.renderData(
        patternToMEI(input),
        {},
      );
      setSvg(svg);
    }, 500);

    return () => {
      clearTimeout(timeout);
    }
  }, []);

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
            setMeiText(input);
          }}
          className="flex flex-row gap-2"
        >
          <textarea
            placeholder="MEI"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              const svg: string = verovioToolkit.renderData(
                patternToMEI(e.target.value),
                {},
              );
              setSvg(svg);
            }}
            className="w-full rounded-md px-4 py-2 text-black"
          />
          <div>
            <button
              type="submit"
              className="rounded-full bg-white/10 px-10 py-3 font-semibold transition hover:bg-white/20"
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
                className="flex flex-row rounded-md bg-white/10 p-3 backdrop-blur-md"
                key={i}
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
}
