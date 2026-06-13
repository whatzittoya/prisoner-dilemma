import { CreateRoomForm } from "@/components/game/CreateRoomForm";
import { JoinForm } from "@/components/game/JoinForm";
import { Card } from "@/components/game/ui";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-7 px-5 py-12">
      <header className="text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-amber-500">
          Permainan Kas Bersama
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight">Dilema 10 Tahanan</h1>
        <p className="mt-3 text-sm leading-6 text-stone-400">
          Tiap ronde, pilih berapa token yang kamu masukkan ke kas bersama. Kas
          dikali lalu dibagi rata ke semua pemain. Kumpulkan poin sebanyak-banyaknya!
        </p>
      </header>

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-stone-300">Masuk sebagai Pemain</h2>
        <JoinForm />
      </Card>

      <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-stone-600">
        <span className="h-px flex-1 bg-white/10" />
        atau
        <span className="h-px flex-1 bg-white/10" />
      </div>

      <Card>
        <h2 className="mb-1 text-sm font-semibold text-stone-300">Pandu permainan</h2>
        <p className="mb-3 text-xs text-stone-500">
          Buat room, atur aturan, dan tampilkan kode ke pemain lain.
        </p>
        <CreateRoomForm />
      </Card>

      <p className="text-center text-xs text-stone-600">
        Hingga 10 pemain · main bersama lewat HP masing-masing
      </p>
    </main>
  );
}
