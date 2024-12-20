"use client";

import { Search } from "@/app/_components/search";
import { api } from "@/trpc/react";
import { useEffect, useState } from "react";
import KeyboardKey from "./_components/keyboard-key";
import { PITCH_NAMES } from "./_components/note";
import { markHumdrum } from "@/common/markHumdrum";
import { meiToRegex } from "@/common/meiToRegex";

export default function Home() {
  const [selectedScoreId, setSelectedScoreId] = useState<number | null>(null);
  const [svg, setSvg] = useState<string | null>(null);
  const [meiText, setMeiText] = useState("");
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);

  const { data } = api.search.getKernData.useQuery(
    { id: selectedScoreId ?? 0 }, // default to 0 to make types work
    { enabled: selectedScoreId !== null },
  );

  useEffect(() => {
    if (data?.kernData) {
      const numVoices = (/\*\*kern/.exec(data.kernData))?.length ?? 0;
      const humdrum =
        numVoices === 1
          ? markHumdrum(data.kernData, meiToRegex(meiText))
          : data.kernData;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      verovioToolkit.loadData(humdrum);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const svg: string = verovioToolkit.renderToSVG(page, {});
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const newPageCount: number = verovioToolkit.getPageCount();
      setPageCount(newPageCount);
      setSvg(svg);
    }
  }, [selectedScoreId, data?.kernData, page, meiText]);

  return (
    <main className="flex max-h-screen min-h-screen flex-row overflow-clip bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <div className="flex max-h-full flex-col justify-center gap-8 px-16 py-16">
        <h1 className="text-5xl font-extrabold tracking-tight">
          sym<span className="text-[hsl(280,100%,70%)]">sic</span>
        </h1>
        <Search
          setSelectedScoreId={(newId) => {
            setSelectedScoreId(newId);
            setSvg(null);
            setPage(1);
          }}
          selectedScoreId={selectedScoreId}
          meiText={meiText}
          setMeiText={setMeiText}
        />
      </div>
      {!svg && (
        <div className="m-6 mt-16 flex h-min w-full flex-col gap-8 rounded-md bg-white/10 p-6 shadow-md backdrop-blur-md">
          <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-bold">Welcome</h1>
            <p>
              <span className="text-md font-medium">
                sym<span className="text-[hsl(280,100%,70%)]">sic</span>
              </span>{" "}
              is the fast and easy-to-use symbolic music search engine.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-bold">Getting started</h1>
            <div className="grid grid-cols-2 gap-4">
              <p>Insert notes: </p>
              <p>
                {PITCH_NAMES.map((pitch) => (
                  <KeyboardKey name={pitch} key={pitch} />
                ))}
              </p>
              <p>Select note:</p>
              <p>
                <KeyboardKey name="Left" />
                <KeyboardKey name="Right" />
              </p>
              <p>Delete note:</p>
              <p>
                <KeyboardKey name="Backspace" />
              </p>
              <p>Move note up or down:</p>
              <p>
                <KeyboardKey name="Up" />
                <KeyboardKey name="Down" />
              </p>
              <p>Move note up or down octave:</p>
              <p>
                <KeyboardKey name="Mod" /> + <KeyboardKey name="Up" />/
                <KeyboardKey name="Down" />
              </p>
              <p>Toggle note accidental:</p>
              <p>
                <KeyboardKey name="+" />
                <KeyboardKey name="-" />
              </p>
              <p>Change selected duration: </p>
              <p>
                {[1, 2, 3, 4, 5, 6, 7].map((duration) => (
                  <KeyboardKey name={`${duration}`} key={duration} />
                ))}
              </p>
              <p>Toggle dotted duration:</p>
              <p>
                <KeyboardKey name="." />
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-bold">Advanced search</h1>
            <p>
              Enable advanced search to use the MEI format to search for more
              complex patterns.
            </p>
          </div>
        </div>
      )}
      <div
        className={`flex-grow overflow-auto ${Boolean(svg) ? "bg-white" : "bg-transparent"} transition-all duration-500`}
      >
        {svg && (
          <div className="fixed float-start flex w-full flex-row gap-1 bg-gradient-to-b from-white to-white/50 px-4 py-2 font-serif text-xl backdrop-blur-sm">
            <button onClick={() => setPage(Math.max(page - 1, 1))}>⬅️</button>
            <button onClick={() => setPage(Math.min(page + 1, pageCount))}>
              ➡️
            </button>
            <p className="mx-4 text-black">
              Page {page} of {pageCount}
            </p>
          </div>
        )}
        <div className="mt-6" dangerouslySetInnerHTML={{ __html: svg ?? "" }} />
      </div>
    </main>
  );
}
