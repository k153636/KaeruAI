-- CaeruAI: Supabase schema
-- Supabase ダッシュボードの SQL Editor で実行してください

CREATE TABLE IF NOT EXISTS user_data (
  user_id    TEXT        PRIMARY KEY,
  profile    JSONB,
  feedback   JSONB,
  history    JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
