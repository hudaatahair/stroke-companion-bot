
-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name TEXT,
  age INT,
  recovery_stage TEXT DEFAULT 'early' CHECK (recovery_stage IN ('early','intermediate','advanced')),
  affected_side TEXT DEFAULT 'left' CHECK (affected_side IN ('left','right','both')),
  mobility_level TEXT DEFAULT 'limited' CHECK (mobility_level IN ('limited','moderate','good')),
  daily_goal INT DEFAULT 5,
  view_mode TEXT DEFAULT 'patient' CHECK (view_mode IN ('patient','caregiver')),
  created_at TIMESTAMPTZ DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON public.profiles FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name) VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name',''));
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Exercises (public read)
CREATE TABLE public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('arm','leg','balance','speech','hand')),
  time_of_day TEXT NOT NULL CHECK (time_of_day IN ('morning','afternoon','evening','any')),
  duration_min INT NOT NULL DEFAULT 5,
  difficulty TEXT NOT NULL DEFAULT 'easy' CHECK (difficulty IN ('easy','medium','hard')),
  description TEXT NOT NULL,
  instructions TEXT NOT NULL
);
GRANT SELECT ON public.exercises TO authenticated, anon;
GRANT ALL ON public.exercises TO service_role;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read exercises" ON public.exercises FOR SELECT USING (true);

-- Progress
CREATE TABLE public.progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, exercise_id, date)
);
CREATE INDEX progress_user_date_idx ON public.progress(user_id, date);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.progress TO authenticated;
GRANT ALL ON public.progress TO service_role;
ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own progress" ON public.progress FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Medications
CREATE TABLE public.medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  dosage TEXT,
  reminder_time TIME NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.medications TO authenticated;
GRANT ALL ON public.medications TO service_role;
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own meds" ON public.medications FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Medication logs
CREATE TABLE public.medication_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  medication_id UUID NOT NULL REFERENCES public.medications ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  taken_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (medication_id, date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.medication_logs TO authenticated;
GRANT ALL ON public.medication_logs TO service_role;
ALTER TABLE public.medication_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own med logs" ON public.medication_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Chat messages
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX chat_user_created_idx ON public.chat_messages(user_id, created_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own chat" ON public.chat_messages FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Seed exercises
INSERT INTO public.exercises (title, category, time_of_day, duration_min, difficulty, description, instructions) VALUES
('Shoulder Rolls','arm','morning',3,'easy','Gentle shoulder mobility to start the day.','Sit tall. Slowly roll both shoulders forward 10 times, then backward 10 times. Breathe deeply.'),
('Arm Raises','arm','morning',5,'easy','Rebuild strength in the affected arm.','Sit or stand. Lift both arms slowly to shoulder height, hold 3 seconds, lower. Repeat 10 times.'),
('Fist Open & Close','hand','morning',4,'easy','Improve hand grip and finger control.','Open your hand wide, then close into a soft fist. Repeat slowly 15 times with each hand.'),
('Finger Touches','hand','afternoon',4,'medium','Fine motor coordination.','Touch your thumb to each fingertip, one at a time. Repeat 10 rounds per hand.'),
('Seated Marching','leg','afternoon',5,'easy','Warm up hips and legs safely.','Sit in a sturdy chair. Lift one knee at a time, alternating for 60 seconds. Rest, then repeat.'),
('Ankle Circles','leg','afternoon',3,'easy','Improve ankle mobility and circulation.','Lift one foot. Rotate the ankle 10 times each direction. Switch feet.'),
('Standing Balance','balance','evening',5,'medium','Improve stability. Do near a wall.','Stand near a wall for support. Balance on both feet, feet close together, for 30 seconds. Rest, repeat 3 times.'),
('Heel-to-Toe Walk','balance','evening',5,'hard','Advanced balance training.','Along a wall, walk placing heel directly in front of the other toe for 10 steps. Only if steady.'),
('Vowel Sounds','speech','morning',4,'easy','Strengthen mouth and voice muscles.','Slowly say A-E-I-O-U out loud, exaggerating each sound. Repeat 5 times.'),
('Read Aloud','speech','evening',5,'easy','Rebuild speech fluency and confidence.','Read a short paragraph out loud, slowly and clearly. Try again focusing on clarity.');
