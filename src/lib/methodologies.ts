import { TFunction } from 'i18next';

export type MethodologyKey = 'sinek' | 'obama' | 'robbins' | 'jobs';

export interface Methodology {
  key: MethodologyKey;
  name: string;
  tagline: string;
  focus: string;
  questions: string[];
  scriptStructure: string[];
  analysisCriteria: string[];
}

// Static English fallback (used by edge functions / non-React contexts)
export const METHODOLOGIES: Record<MethodologyKey, Methodology> = {
  sinek: {
    key: 'sinek',
    name: 'Sinek — Inspire',
    tagline: 'Start with Why',
    focus: 'Purpose-driven communication that inspires action through belief.',
    questions: [
      'Why do you do what you do? What is the deeper purpose behind your work or message?',
      'How do you bring that purpose to life? What is your unique approach or process?',
      'What is the tangible result — the product, service, or idea you are offering?',
      'Who is your audience, and what do you want them to believe after hearing you?',
    ],
    scriptStructure: ['WHY — Purpose & belief', 'HOW — Process & differentiation', 'WHAT — Offer & proof'],
    analysisCriteria: [
      'Clarity of purpose (WHY)',
      'Emotional conviction and authenticity',
      'Logical flow from WHY → HOW → WHAT',
      'Inspirational closing that reinforces belief',
    ],
  },
  obama: {
    key: 'obama',
    name: 'Obama — Connect',
    tagline: 'Tell your story',
    focus: 'Emotional storytelling and personal narrative that creates deep connection.',
    questions: [
      'What personal experience shaped your perspective on this topic?',
      'What challenge or turning point made this story meaningful?',
      'What universal truth or shared value does your story reveal?',
      'What action or reflection do you want your audience to take away?',
    ],
    scriptStructure: ['PERSONAL STORY — Anchor experience', 'CONFLICT — Challenge & tension', 'UNIVERSAL TRUTH — Shared value', 'CALL TO UNITY — Collective action'],
    analysisCriteria: [
      'Emotional authenticity and vulnerability',
      'Narrative arc (setup → conflict → resolution)',
      'Connection to audience\'s lived experience',
      'Rhythmic pacing and rhetorical repetition',
    ],
  },
  robbins: {
    key: 'robbins',
    name: 'Robbins — Activate',
    tagline: 'Move to action',
    focus: 'High-energy persuasion that breaks limiting beliefs and drives immediate action.',
    questions: [
      'What limiting belief or obstacle is holding your audience back right now?',
      'What is the transformation or breakthrough you want them to experience?',
      'What is the first concrete step they can take right now?',
      'What emotional state do you want them to feel — urgency, empowerment, excitement?',
    ],
    scriptStructure: ['PATTERN INTERRUPT — Break the status quo', 'PAIN POINT — Expose the real problem', 'VISION — Show the transformation', 'ACTION COMMAND — Immediate next step'],
    analysisCriteria: [
      'Energy level and vocal intensity',
      'Ability to create urgency and emotional peaks',
      'Clarity of the transformation promise',
      'Strength and specificity of the call to action',
    ],
  },
  jobs: {
    key: 'jobs',
    name: 'Jobs — Present',
    tagline: 'Simplify & wow',
    focus: 'Structured product presentation with problem/solution clarity and theatrical reveals.',
    questions: [
      'What problem does your audience face that they may not fully understand yet?',
      'What is your solution, and what makes it fundamentally different?',
      'What is the single most impressive fact, demo, or result you can show?',
      'How do you want the audience to remember this — what is the "one more thing"?',
    ],
    scriptStructure: ['PROBLEM — Set the stage', 'SOLUTION — Introduce your answer', 'DEMO/PROOF — Show, don\'t tell', 'ONE MORE THING — Memorable close'],
    analysisCriteria: [
      'Simplicity and clarity of the problem statement',
      'Dramatic tension and pacing of reveals',
      'Visual/concrete proof and demonstration quality',
      'Memorable closing moment',
    ],
  },
};

/**
 * Returns methodologies with translated UI strings.
 * analysisCriteria stays in English (used by AI analysis backend).
 */
export const getTranslatedMethodologies = (t: TFunction): Record<MethodologyKey, Methodology> => {
  const keys: MethodologyKey[] = ['sinek', 'obama', 'robbins', 'jobs'];
  const result = {} as Record<MethodologyKey, Methodology>;

  for (const key of keys) {
    const base = METHODOLOGIES[key];
    result[key] = {
      ...base,
      name: t(`methodologies.${key}.name`, base.name),
      tagline: t(`methodologies.${key}.tagline`, base.tagline),
      focus: t(`methodologies.${key}.focus`, base.focus),
      questions: (t(`methodologies.${key}.questions`, { returnObjects: true }) as string[] | string) instanceof Array
        ? (t(`methodologies.${key}.questions`, { returnObjects: true }) as string[])
        : base.questions,
      scriptStructure: (t(`methodologies.${key}.scriptStructure`, { returnObjects: true }) as string[] | string) instanceof Array
        ? (t(`methodologies.${key}.scriptStructure`, { returnObjects: true }) as string[])
        : base.scriptStructure,
    };
  }

  return result;
};

export const getMethodology = (key: MethodologyKey): Methodology => METHODOLOGIES[key];
