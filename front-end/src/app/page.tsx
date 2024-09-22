import { Room } from "@/components/Room";

export default function Home() {
  return (
    <div className="grid grid-rows-[10px_1fr_10px] items-center justify-items-center min-h-screen p-8 pb-20 gap-8 sm:p-10 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-4 row-start-2 items-center sm:items-start">
        <Room />
      </main>
      <footer className="row-start-3 border-t-[1px] border-t-gray-200 w-[100%] flex gap-6 flex-wrap items-center justify-center">
        <p>Power by mild.tnz</p>
      </footer>
    </div>
  );
}
