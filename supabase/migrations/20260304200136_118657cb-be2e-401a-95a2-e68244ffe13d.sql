
-- Enums
CREATE TYPE public.experience_level AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE public.script_format AS ENUM ('vertical', 'horizontal');
CREATE TYPE public.script_duration AS ENUM ('30s', '60s');

-- Extend profiles
ALTER TABLE public.profiles
  ADD COLUMN sector TEXT,
  ADD COLUMN experience_level experience_level DEFAULT 'beginner',
  ADD COLUMN confidence_level INTEGER DEFAULT 1,
  ADD COLUMN target_audience TEXT;

-- Templates
CREATE TABLE public.templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  description TEXT,
  methodology TEXT,
  recommended_duration script_duration,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read templates" ON public.templates FOR SELECT USING (true);

-- Scripts
CREATE TABLE public.scripts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.templates(id),
  methodology TEXT,
  hook TEXT,
  development TEXT,
  call_to_action TEXT,
  format script_format DEFAULT 'vertical',
  duration script_duration DEFAULT '60s',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.scripts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own scripts" ON public.scripts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Videos
CREATE TABLE public.videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  script_id UUID REFERENCES public.scripts(id) ON DELETE SET NULL,
  file_url TEXT,
  analysis_score NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own videos" ON public.videos FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Feedback
CREATE TABLE public.feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  hook_score NUMERIC,
  clarity_score NUMERIC,
  energy_score NUMERIC,
  coherence_score NUMERIC,
  cta_strength NUMERIC,
  suggestions TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own feedback" ON public.feedback FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.videos WHERE videos.id = feedback.video_id AND videos.user_id = auth.uid()));
CREATE POLICY "System can insert feedback" ON public.feedback FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.videos WHERE videos.id = feedback.video_id AND videos.user_id = auth.uid())
);

-- Sessions
CREATE TABLE public.sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_step INTEGER DEFAULT 1,
  methodology TEXT,
  script_id UUID REFERENCES public.scripts(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own sessions" ON public.sessions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Updated_at triggers
CREATE TRIGGER update_scripts_updated_at BEFORE UPDATE ON public.scripts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
