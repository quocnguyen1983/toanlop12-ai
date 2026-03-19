export const PLAN_LIMITS = {
  FREE: {
    questions: 5,
    tokens: 12500,
  },
  STANDARD: {
    questions: 500,
    tokens: 500000,
  },
  PRO: {
    questions: 2000,
    tokens: 2000000,
  },
  PREMIUM: {
    questions: Infinity,
    tokens: 10000000,
  },
} as const;

export type PlanType = keyof typeof PLAN_LIMITS;