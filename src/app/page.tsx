"use client";

import { Search } from "@/app/_components/search";
import { api } from "@/trpc/react";
import { useEffect, useState } from "react";

export default function Home() {
  const [selectedScoreId, setSelectedScoreId] = useState<number | null>(null);
  const [svg, setSvg] = useState<string | null>(null);

  const { data } = api.search.getKernData.useQuery(
    { id: selectedScoreId ?? 0 }, // default to 0 to make types work
    { enabled: selectedScoreId !== null },
  );

  useEffect(() => {
    if (data?.kernData) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const svg: string = verovioToolkit.renderData(data.kernData, {});
      console.log("done rendering");
      setSvg(svg);
    }
  }, [selectedScoreId, data?.kernData]);

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
          }}
          selectedScoreId={selectedScoreId}
        />
      </div>
      <div
        className={`flex-grow overflow-auto ${Boolean(svg) ? "bg-white" : "bg-transparent"} transition-all duration-500`}
        dangerouslySetInnerHTML={{ __html: svg ?? "" }}
      />
    </main>
  );
}
