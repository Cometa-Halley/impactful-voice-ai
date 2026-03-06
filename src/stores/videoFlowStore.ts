import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MethodologyKey } from '@/lib/methodologies';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface VideoFlowState {
  // Wizard navigation
  currentStep: number;

  // Step 1: Format
  videoFormat: 'vertical' | 'horizontal' | null;
  videoDuration: '30s' | '60s' | null;

  // Step 2: Strategy
  methodology: MethodologyKey | null;
  answers: string[];

  // Step 3: Script & Refine
  script: string;
  chatMessages: ChatMessage[];
  isGenerating: boolean;
  isRefining: boolean;

  // Step 4: Record (blob not persisted)
  scriptId: string | null;

  // Step 5: Review
  analysisResult: any | null;

  // Actions
  setStep: (step: number) => void;
  setVideoFormat: (fmt: 'vertical' | 'horizontal') => void;
  setVideoDuration: (dur: '30s' | '60s') => void;
  setMethodology: (key: MethodologyKey) => void;
  setAnswers: (answers: string[]) => void;
  updateAnswer: (index: number, value: string) => void;
  setScript: (script: string) => void;
  appendScript: (delta: string) => void;
  setIsGenerating: (v: boolean) => void;
  setIsRefining: (v: boolean) => void;
  setChatMessages: (msgs: ChatMessage[]) => void;
  addChatMessage: (msg: ChatMessage) => void;
  updateLastAssistantMessage: (content: string) => void;
  setScriptId: (id: string | null) => void;
  setAnalysisResult: (result: any | null) => void;
  reset: () => void;
}

const initialState = {
  currentStep: 0,
  videoFormat: null as 'vertical' | 'horizontal' | null,
  videoDuration: null as '30s' | '60s' | null,
  methodology: null as MethodologyKey | null,
  answers: [] as string[],
  script: '',
  chatMessages: [] as ChatMessage[],
  isGenerating: false,
  isRefining: false,
  scriptId: null as string | null,
  analysisResult: null as any | null,
};

export const useVideoFlowStore = create<VideoFlowState>()(
  persist(
    (set) => ({
      ...initialState,

      setStep: (step) => set({ currentStep: step }),
      setVideoFormat: (fmt) => set({ videoFormat: fmt }),
      setVideoDuration: (dur) => set({ videoDuration: dur }),
      setMethodology: (key) => set({ methodology: key }),
      setAnswers: (answers) => set({ answers }),
      updateAnswer: (index, value) =>
        set((s) => {
          const next = [...s.answers];
          next[index] = value;
          return { answers: next };
        }),
      setScript: (script) => set({ script }),
      appendScript: (delta) => set((s) => ({ script: s.script + delta })),
      setIsGenerating: (v) => set({ isGenerating: v }),
      setIsRefining: (v) => set({ isRefining: v }),
      setChatMessages: (msgs) => set({ chatMessages: msgs }),
      addChatMessage: (msg) =>
        set((s) => ({ chatMessages: [...s.chatMessages, msg] })),
      updateLastAssistantMessage: (content) =>
        set((s) => {
          const msgs = [...s.chatMessages];
          const last = msgs[msgs.length - 1];
          if (last?.role === 'assistant') {
            msgs[msgs.length - 1] = { ...last, content };
          } else {
            msgs.push({ role: 'assistant', content });
          }
          return { chatMessages: msgs };
        }),
      setScriptId: (id) => set({ scriptId: id }),
      setAnalysisResult: (result) => set({ analysisResult: result }),
      reset: () => set(initialState),
    }),
    {
      name: 'presencia-video-flow',
      partialize: (state) => ({
        currentStep: state.currentStep,
        videoFormat: state.videoFormat,
        videoDuration: state.videoDuration,
        methodology: state.methodology,
        answers: state.answers,
        script: state.script,
        chatMessages: state.chatMessages,
        scriptId: state.scriptId,
        // Don't persist: isGenerating, isRefining, analysisResult
      }),
    }
  )
);
