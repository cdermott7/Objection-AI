-- TuriCheck Supabase Schema and Functions

-- Profiles Table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a trigger to automatically create a profile for new users
CREATE OR REPLACE FUNCTION create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_profile_for_user();

-- Chat Sessions Table
CREATE TABLE IF NOT EXISTS sessions (
  session_id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  partner_type TEXT NOT NULL CHECK (partner_type IN ('human', 'ai')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE
);

-- Chat Messages Table
CREATE TABLE IF NOT EXISTS messages (
  message_id BIGSERIAL PRIMARY KEY,
  session_id BIGINT REFERENCES sessions(session_id),
  user_message TEXT NOT NULL,
  response TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Guesses Table
CREATE TABLE IF NOT EXISTS guesses (
  guess_id BIGSERIAL PRIMARY KEY,
  session_id BIGINT REFERENCES sessions(session_id),
  user_id UUID REFERENCES profiles(id),
  guess TEXT NOT NULL CHECK (guess IN ('human', 'ai')),
  correct BOOLEAN NOT NULL,
  badge_minted BOOLEAN DEFAULT FALSE,
  badge_tx_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function: Create a new chat session
CREATE OR REPLACE FUNCTION create_session(partner_type TEXT)
RETURNS JSON AS $$
DECLARE
  new_session_id BIGINT;
  user_id UUID;
BEGIN
  -- Get user ID from JWT
  user_id := auth.uid();
  
  -- Validate partner type
  IF partner_type NOT IN ('human', 'ai') THEN
    RAISE EXCEPTION 'Invalid partner_type. Must be "human" or "ai".';
  END IF;

  -- Create new session
  INSERT INTO sessions (user_id, partner_type)
  VALUES (user_id, partner_type)
  RETURNING session_id INTO new_session_id;

  -- Return the session ID in JSON format
  RETURN json_build_object('session_id', new_session_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Log a chat message
CREATE OR REPLACE FUNCTION log_chat_message(session_id BIGINT, user_message TEXT, response TEXT)
RETURNS VOID AS $$
DECLARE
  user_id UUID;
BEGIN
  -- Get user ID from JWT
  user_id := auth.uid();
  
  -- Verify the session belongs to the user
  IF NOT EXISTS (SELECT 1 FROM sessions WHERE session_id = log_chat_message.session_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Session not found or not owned by the current user.';
  END IF;

  -- Insert the message
  INSERT INTO messages (session_id, user_message, response)
  VALUES (session_id, user_message, response);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: End a chat session
CREATE OR REPLACE FUNCTION end_session(session_id BIGINT)
RETURNS VOID AS $$
DECLARE
  user_id UUID;
BEGIN
  -- Get user ID from JWT
  user_id := auth.uid();
  
  -- Verify the session belongs to the user
  IF NOT EXISTS (SELECT 1 FROM sessions WHERE session_id = end_session.session_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Session not found or not owned by the current user.';
  END IF;

  -- Update the session end time
  UPDATE sessions
  SET ended_at = NOW()
  WHERE session_id = end_session.session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Log a user's guess
CREATE OR REPLACE FUNCTION log_guess(session_id BIGINT, guess TEXT, correct BOOLEAN)
RETURNS VOID AS $$
DECLARE
  user_id UUID;
BEGIN
  -- Get user ID from JWT
  user_id := auth.uid();
  
  -- Verify the session belongs to the user
  IF NOT EXISTS (SELECT 1 FROM sessions WHERE session_id = log_guess.session_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Session not found or not owned by the current user.';
  END IF;

  -- Insert the guess
  INSERT INTO guesses (session_id, user_id, guess, correct)
  VALUES (session_id, user_id, guess, correct);
  
  -- Mark the session as ended
  UPDATE sessions
  SET ended_at = NOW()
  WHERE session_id = log_guess.session_id
    AND ended_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Update badge minted status
CREATE OR REPLACE FUNCTION update_badge_minted(session_id BIGINT, badge_tx_id TEXT)
RETURNS VOID AS $$
DECLARE
  user_id UUID;
BEGIN
  -- Get user ID from JWT
  user_id := auth.uid();
  
  -- Verify the session belongs to the user
  IF NOT EXISTS (SELECT 1 FROM sessions WHERE session_id = update_badge_minted.session_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Session not found or not owned by the current user.';
  END IF;

  -- Update the guess record
  UPDATE guesses
  SET badge_minted = TRUE,
      badge_tx_id = update_badge_minted.badge_tx_id
  WHERE session_id = update_badge_minted.session_id
    AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Row Level Security Policies

-- Profiles: Users can only read/update their own profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select_policy ON profiles
  FOR SELECT USING (auth.uid() = id);
  
CREATE POLICY profiles_update_policy ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Sessions: Users can only access their own sessions
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY sessions_select_policy ON sessions
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY sessions_insert_policy ON sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Messages: Users can only access messages from their own sessions
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY messages_select_policy ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sessions 
      WHERE sessions.session_id = messages.session_id 
      AND sessions.user_id = auth.uid()
    )
  );
  
CREATE POLICY messages_insert_policy ON messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions 
      WHERE sessions.session_id = messages.session_id 
      AND sessions.user_id = auth.uid()
    )
  );

-- Guesses: Users can only access their own guesses
ALTER TABLE guesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY guesses_select_policy ON guesses
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY guesses_insert_policy ON guesses
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY guesses_update_policy ON guesses
  FOR UPDATE USING (auth.uid() = user_id);