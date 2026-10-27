import Link from "next/link";
import { HeroCta, NavCta } from "@/components/LandingCta";
import Logo from "@/components/Logo";
import { SCENARIOS } from "@/lib/scenarios";

const STEPS = [
  {
    no: "01",
    title: "選一個情境",
    body: "點餐、面試、機場、會議……八種日常與職場情境，AI 會扮演對應的角色先開口。",
  },
  {
    no: "02",
    title: "用英文回應",
    body: "像真的對話一樣自然回覆。說錯沒關係，AI 不會打斷你，對話會繼續下去。",
  },
  {
    no: "03",
    title: "一鍵看怎麼說更好",
    body: "每一句話都能「糾正文法」或看「更好的回答」，附上中文解釋與實用片語。",
  },
];

const FEATURES = [
  {
    icon: "🎭",
    title: "真實情境角色扮演",
    body: "服務生、面試官、地勤人員、同事、朋友——AI 會維持角色，陪你把對話練完。",
  },
  {
    icon: "✍️",
    title: "文法糾正，附中文解釋",
    body: "標出哪裡錯、該怎麼改，用繁體中文告訴你為什麼，不只給答案。",
  },
  {
    icon: "✨",
    title: "更道地、更完整的說法",
    body: "同一個意思，母語者會怎麼說？附上值得收藏的片語和使用時機。",
  },
  {
    icon: "📚",
    title: "練習紀錄隨時複習",
    body: "每場對話和每一筆糾錯都會保存，回頭翻就知道自己常犯什麼錯。",
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col">
      {/* 導覽列 */}
      <header className="sticky top-0 z-20 border-b border-line/60 bg-paper/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <Logo />
          <nav className="flex items-center gap-6">
            <a href="#how" className="hidden text-sm text-muted hover:text-ink md:inline">
              使用方式
            </a>
            <a href="#features" className="hidden text-sm text-muted hover:text-ink md:inline">
              功能特色
            </a>
            <NavCta />
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="paper-grain relative overflow-hidden">
          <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 pb-20 pt-16 md:pt-24 lg:grid-cols-[1.05fr_1fr]">
            <div className="animate-rise">
              <p className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1 text-xs font-medium text-muted shadow-soft">
                <span className="size-1.5 rounded-full bg-accent" />
                AI 英文口說陪練
              </p>
              <h1 className="mt-6 text-4xl font-bold leading-[1.15] tracking-tight sm:text-5xl lg:text-6xl">
                開口說英文，
                <br />
                <span className="relative inline-block">
                  不再怕說錯
                  <svg
                    aria-hidden
                    viewBox="0 0 300 12"
                    className="absolute -bottom-2 left-0 h-3 w-full text-accent"
                    preserveAspectRatio="none"
                  >
                    <path d="M2 9C60 3 140 2 298 7" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                  </svg>
                </span>
              </h1>
              <p className="mt-5 font-display text-2xl italic text-muted sm:text-3xl">
                Speak up. We&rsquo;ll help you sound natural.
              </p>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
                在真實情境中和 AI 角色對話，說完一句就能看到文法糾正和更道地的說法。
                像有一位隨時待命、從不嫌你煩的英文家教。
              </p>
              <div className="mt-8">
                <HeroCta />
              </div>
              <p className="mt-4 text-xs text-muted">註冊免費 · 使用你自己的 OpenAI API key，費用透明</p>
            </div>

            <HeroPreview />
          </div>
        </section>

        {/* 情境跑馬燈 */}
        <section className="border-y border-line bg-card py-5">
          <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]">
            <div className="marquee-track flex w-max gap-3">
              {[...SCENARIOS, ...SCENARIOS].map((s, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-4 py-2 text-sm whitespace-nowrap"
                >
                  <span>{s.emoji}</span>
                  <span className="font-medium">{s.label}</span>
                  <span className="text-muted">· {s.description}</span>
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* 使用方式 */}
        <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-24">
          <SectionHeading eyebrow="How it works" title="三個步驟，把英文說出口" />
          <ol className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-line bg-line md:grid-cols-3">
            {STEPS.map((s) => (
              <li key={s.no} className="bg-card p-8">
                <span className="font-display text-5xl italic text-accent">{s.no}</span>
                <h3 className="mt-6 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 leading-relaxed text-muted">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* 功能特色 */}
        <section id="features" className="scroll-mt-20 bg-subtle/60 py-24">
          <div className="mx-auto max-w-6xl px-5">
            <SectionHeading eyebrow="Features" title="不只是聊天，是真的在進步" />
            <div className="mt-14 grid gap-5 sm:grid-cols-2">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="group rounded-3xl border border-line bg-card p-8 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift"
                >
                  <span className="grid size-12 place-items-center rounded-2xl bg-accent-soft text-2xl transition group-hover:scale-105">
                    {f.icon}
                  </span>
                  <h3 className="mt-6 text-lg font-semibold">{f.title}</h3>
                  <p className="mt-2 leading-relaxed text-muted">{f.body}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-col gap-3 rounded-3xl border border-line bg-card p-6 sm:flex-row sm:items-center sm:gap-5 sm:p-8">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-ink text-xl text-paper">🔒</span>
              <p className="leading-relaxed text-muted">
                <strong className="font-semibold text-ink">你的資料只屬於你。</strong>
                每個人只看得到自己的練習紀錄；你的 OpenAI API key 加密保存，畫面上不會再完整顯示。
              </p>
            </div>
          </div>
        </section>

        {/* 結尾 CTA */}
        <section className="mx-auto max-w-6xl px-5 py-24">
          <div className="relative overflow-hidden rounded-[2rem] bg-ink px-8 py-16 text-center text-paper sm:px-16">
            <div className="paper-grain absolute inset-0 opacity-30" />
            <p className="relative font-display text-xl italic opacity-70">Ready when you are.</p>
            <h2 className="relative mt-3 text-3xl font-bold tracking-tight sm:text-4xl">今天，就說出第一句英文</h2>
            <p className="relative mx-auto mt-4 max-w-md opacity-70">註冊只要 30 秒，選個情境馬上開始。</p>
            <div className="relative mt-8 flex justify-center">
              <Link
                href="/signup"
                className="group inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-accent-ink transition hover:bg-accent-strong"
              >
                免費註冊
                <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-8 text-sm text-muted sm:flex-row">
          <Logo />
          <p>以 AI 打造的英文口說練習 · Practice makes progress.</p>
        </div>
      </footer>
    </div>
  );
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="max-w-2xl">
      <p className="font-display text-lg italic text-accent">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
    </div>
  );
}

// Hero 右側：示範一段對話與糾錯（靜態畫面）
function HeroPreview() {
  return (
    <div className="relative animate-rise [animation-delay:150ms]">
      <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-accent-soft/60 blur-2xl" />
      <div className="rotate-1 rounded-[1.75rem] border border-line bg-card p-5 shadow-lift transition-transform duration-500 hover:rotate-0 sm:p-6">
        <div className="flex items-center gap-3 border-b border-line pb-4">
          <span className="grid size-10 place-items-center rounded-full bg-subtle text-xl">🍝</span>
          <div>
            <p className="text-sm font-semibold">點餐</p>
            <p className="text-xs text-muted">義式餐廳的服務生</p>
          </div>
          <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-muted">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            對話中
          </span>
        </div>

        <div className="space-y-4 pt-5 text-[15px]">
          <div className="max-w-[85%] rounded-2xl rounded-tl-md border border-line bg-paper px-4 py-2.5">
            Hi there! Welcome to Bella Cucina. Can I get you something to drink?
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-ink px-4 py-2.5 text-paper">
              I want a orange juice, please.
            </div>
            <div className="flex gap-1.5 text-xs">
              <span className="rounded-full border border-accent bg-accent-soft px-2.5 py-1 font-medium text-accent">
                ✓ 糾正文法
              </span>
              <span className="rounded-full border border-line px-2.5 py-1 text-muted">✨ 更好的回答</span>
            </div>
          </div>

          <div className="ml-auto max-w-[92%] rounded-2xl border border-line bg-paper p-4 text-sm">
            <p className="font-medium">I want an orange juice, please.</p>
            <p className="mt-2">
              <span className="mr-2 rounded-md bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800 dark:bg-amber-900/60 dark:text-amber-200">
                文法
              </span>
              <span className="text-red-600 line-through decoration-2 dark:text-red-400">a orange</span>
              <span className="mx-1.5 text-muted">→</span>
              <span className="font-medium text-emerald-700 dark:text-emerald-400">an orange</span>
            </p>
            <p className="mt-1.5 text-muted">orange 是母音開頭，前面要用 an。</p>
          </div>
        </div>
      </div>
    </div>
  );
}
