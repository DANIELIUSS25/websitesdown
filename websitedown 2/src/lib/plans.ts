export type PlanId = "free" | "pro" | "pro_plus";

export interface Plan {
  id: PlanId;
  name: string;
  price: number;
  monitorLimit: number;
  checkInterval: number;
  channelLimit: number;
  historyDays: number;
  features: string[];
  stripePriceId: string | null;
}

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free", name: "Free", price: 0, monitorLimit: 0, checkInterval: 0,
    channelLimit: 0, historyDays: 0, stripePriceId: null,
    features: ["Manual checks", "AI intelligence", "Public status pages", "Community reports"],
  },
  pro: {
    id: "pro", name: "Pro", price: 1.99, monitorLimit: 5, checkInterval: 60,
    channelLimit: 3, historyDays: 30,
    stripePriceId: process.env.STRIPE_PRICE_PRO || "",
    features: ["5 monitors", "60s checks", "3 alert channels", "30-day history", "Email + Telegram + Discord"],
  },
  pro_plus: {
    id: "pro_plus", name: "Pro+", price: 5, monitorLimit: 25, checkInterval: 60,
    channelLimit: 10, historyDays: 90,
    stripePriceId: process.env.STRIPE_PRICE_PRO_PLUS || "",
    features: ["25 monitors", "60s checks", "10 alert channels", "90-day history", "Priority support"],
  },
};

export function getPlan(id: string): Plan { return PLANS[id as PlanId] || PLANS.free; }
