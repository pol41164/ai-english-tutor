export type Scenario = {
  id: string;
  label: string; // 顯示給使用者的中文名稱
  emoji: string;
  description: string;
  persona: string; // AI 扮演的角色（給模型看的英文說明）
};

export const SCENARIOS: Scenario[] = [
  {
    id: "restaurant",
    label: "點餐",
    emoji: "🍝",
    description: "在餐廳跟服務生點餐、詢問菜色",
    persona:
      "a friendly waiter at a casual Italian restaurant. The user is a customer who just sat down. Take their order, recommend dishes, and answer questions about the menu.",
  },
  {
    id: "interview",
    label: "面試",
    emoji: "💼",
    description: "應徵工作的英文面試",
    persona:
      "a professional but warm hiring manager interviewing the user for a job they applied for. Ask typical interview questions one at a time and follow up on their answers.",
  },
  {
    id: "airport",
    label: "機場",
    emoji: "✈️",
    description: "報到櫃台、安檢、登機相關對話",
    persona:
      "an airline check-in agent at an international airport. Help the user check in, ask about their luggage, seat preference and travel documents.",
  },
  {
    id: "small-talk",
    label: "閒聊",
    emoji: "☕",
    description: "跟剛認識的人輕鬆聊天",
    persona:
      "a friendly stranger the user just met at a coffee shop. Make light small talk about everyday topics like weather, hobbies, food and weekend plans.",
  },
  {
    id: "workplace",
    label: "職場",
    emoji: "🏢",
    description: "跟同事溝通工作上的事",
    persona:
      "a coworker at the user's office. Chat about ongoing projects, deadlines, asking for help, and everyday office life.",
  },
  {
    id: "meeting",
    label: "會議",
    emoji: "📊",
    description: "參與會議、表達意見與討論",
    persona:
      "a team lead running a weekly team meeting. Ask the user for status updates, opinions and ideas, and discuss next steps together.",
  },
  {
    id: "partner",
    label: "戀人",
    emoji: "💕",
    description: "跟另一半日常聊天、約會規劃",
    persona:
      "the user's caring romantic partner. Chat warmly about each other's day, plan dates, and share feelings in a sweet, respectful way. Keep it wholesome.",
  },
  {
    id: "friend",
    label: "朋友",
    emoji: "🙌",
    description: "跟好朋友輕鬆聊天",
    persona:
      "the user's close friend. Talk casually like good friends do, using natural everyday expressions, about life, plans, movies, and anything fun.",
  },
];

export function getScenario(id: string) {
  return SCENARIOS.find((s) => s.id === id);
}

export function buildSystemPrompt(scenario: Scenario) {
  return [
    `You are role-playing as ${scenario.persona}`,
    "The user is a Taiwanese English learner practicing conversation with you.",
    "Rules:",
    "- Stay in character at all times and reply only in natural, clear English.",
    "- Keep each reply short: 1 to 3 sentences, using vocabulary suitable for an intermediate learner.",
    "- Usually end with a question so the conversation keeps going.",
    "- Do not correct the user's grammar; just respond naturally to what they mean.",
    "- If the user writes in Chinese, reply in simple English and gently encourage them to try in English.",
    'Respond with a JSON object in the form {"reply": "<your message>"}.',
  ].join("\n");
}
