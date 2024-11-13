import { Search } from "@/app/_components/search";

export default async function Home() {
  return (
    <main className="flex min-h-screen bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white max-h-screen overflow-clip">
      <div className="container flex flex-col justify-center gap-8 px-16 py-16 max-h-full">
        <h1 className="text-5xl font-extrabold tracking-tight">
          sym<span className="text-[hsl(280,100%,70%)]">sic</span>
        </h1>
        <Search />
      </div>
    </main>
  );
}
