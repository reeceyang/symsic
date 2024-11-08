"use client";

import { useState } from "react";

import { api } from "@/trpc/react";
import { meiToRegex } from "@/common/meiToRegex";

export function Search() {
  const [input, setInput] = useState("");
  const [meiText, setMeiText] = useState(``);
  const { data } = api.search.search.useQuery(
    { meiText },
    { enabled: Boolean(meiText) },
  );

  return (
    <div className="flex w-full max-w-md flex-col gap-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setMeiText(input);
        }}
        className="flex flex-row gap-2"
      >
        <input
          type="text"
          placeholder="MEI"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full rounded-full px-4 py-2 text-black"
        />
        <button
          type="submit"
          className="rounded-full bg-white/10 px-10 py-3 font-semibold transition hover:bg-white/20"
        >
          Search
        </button>
      </form>
      <div className="flex flex-col gap-6">
        <p>{data?.length ?? 0} results.</p>
        {data?.length
          ? data.map((score, i) => {
              const regex = meiToRegex(meiText);
              const numMatches = [
                ...score.kernData.matchAll(new RegExp(regex, "g")),
              ].length;
              return (
                <div
                  className="flex flex-row rounded-md bg-white/10 p-3 backdrop-blur-md"
                  key={i}
                >
                  <p>{score.title}</p>
                  <p className="ml-auto">
                    {numMatches} match{numMatches !== 1 && "es"}
                  </p>
                </div>
              );
            })
          : null}
      </div>
    </div>
  );
}
