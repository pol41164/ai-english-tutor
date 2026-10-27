import Link from "next/link";

export default function Logo({ href = "/", inverted = false }: { href?: string; inverted?: boolean }) {
  return (
    <Link href={href} className={`group inline-flex items-center gap-2.5 ${inverted ? "text-paper" : ""}`}>
      <span
        className={`grid size-8 place-items-center rounded-[10px] font-display text-base italic leading-none transition-transform group-hover:-rotate-6 ${
          inverted ? "bg-paper text-ink" : "bg-ink text-paper"
        }`}
      >
        Aa
      </span>
      <span className="font-semibold tracking-tight">
        AI 英文家教
        <span
          className={`ml-1.5 hidden font-display text-sm font-normal italic sm:inline ${
            inverted ? "opacity-60" : "text-muted"
          }`}
        >
          English Tutor
        </span>
      </span>
    </Link>
  );
}
