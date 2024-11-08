import { Search } from "@/app/_components/search";

export default async function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
          sym<span className="text-[hsl(280,100%,70%)]">sic</span>
        </h1>
        <Search />
      </div>
    </main>
  );
}
