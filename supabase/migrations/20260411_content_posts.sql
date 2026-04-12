-- Content posts table for Instagram/Facebook planner
CREATE TABLE IF NOT EXISTS content_posts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id       UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  caption         TEXT,
  hashtags        TEXT,
  platform        TEXT NOT NULL DEFAULT 'INSTAGRAM' CHECK (platform IN ('INSTAGRAM','FACEBOOK','BOTH')),
  post_type       TEXT NOT NULL DEFAULT 'EDUCATIONAL' CHECK (post_type IN ('EDUCATIONAL','PROMOTIONAL','BEFORE_AFTER','TESTIMONIAL','TEAM','OFFER')),
  scheduled_date  DATE,
  status          TEXT NOT NULL DEFAULT 'IDEA' CHECK (status IN ('IDEA','DRAFT','READY','PUBLISHED')),
  notes           TEXT,
  created_by      UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for clinic + date filtering
CREATE INDEX IF NOT EXISTS content_posts_clinic_date_idx ON content_posts (clinic_id, scheduled_date);

-- RLS
ALTER TABLE content_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinic members can manage their content posts"
  ON content_posts
  FOR ALL
  USING (clinic_id = get_auth_clinic_id())
  WITH CHECK (clinic_id = get_auth_clinic_id());

-- Updated_at trigger
DROP TRIGGER IF EXISTS content_posts_updated_at ON content_posts;
CREATE TRIGGER content_posts_updated_at
  BEFORE UPDATE ON content_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
