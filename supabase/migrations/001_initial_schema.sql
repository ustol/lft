-- =============================================
-- LFT — Initial Schema Migration
-- 001_initial_schema.sql
-- =============================================

-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =============================================
-- ENUMS
-- =============================================
CREATE TYPE person_status AS ENUM ('alive', 'deceased');
CREATE TYPE relationship_type AS ENUM ('mother', 'father', 'brother', 'sister', 'son', 'daughter');
CREATE TYPE connection_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
CREATE TYPE tree_visibility AS ENUM ('private', 'connections_only', 'public');

-- =============================================
-- USERS
-- =============================================
CREATE TABLE public.users (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  lftid           TEXT UNIQUE NOT NULL,
  display_name    TEXT NOT NULL,
  avatar_url      TEXT,
  bio             TEXT,
  tree_visibility tree_visibility DEFAULT 'private',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_users_lftid ON public.users(lftid);
CREATE INDEX idx_users_lftid_trgm ON public.users USING GIN(lftid gin_trgm_ops);

-- =============================================
-- PERSONS
-- =============================================
CREATE TABLE public.persons (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lftid           TEXT UNIQUE NOT NULL,
  owner_id        UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  first_name      TEXT NOT NULL,
  middle_names    TEXT,
  surname         TEXT NOT NULL,
  date_of_birth   DATE,
  date_of_death   DATE,
  status          person_status NOT NULL DEFAULT 'alive',
  cause_of_death  TEXT,
  place_of_birth  TEXT,
  birth_lat       DECIMAL(10,7),
  birth_lng       DECIMAL(10,7),
  place_of_death  TEXT,
  death_lat       DECIMAL(10,7),
  death_lng       DECIMAL(10,7),
  is_self         BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_persons_owner        ON public.persons(owner_id);
CREATE UNIQUE INDEX idx_persons_lftid ON public.persons(lftid);
CREATE INDEX idx_persons_surname_trgm ON public.persons USING GIN(surname gin_trgm_ops);
CREATE INDEX idx_persons_fname_trgm   ON public.persons USING GIN(first_name gin_trgm_ops);

-- =============================================
-- PHOTOS
-- =============================================
CREATE TABLE public.photos (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id     UUID NOT NULL REFERENCES public.persons(id) ON DELETE CASCADE,
  owner_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  storage_path  TEXT NOT NULL,
  url           TEXT NOT NULL,
  title         TEXT,
  description   TEXT,
  sort_order    SMALLINT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_photos_person ON public.photos(person_id);
CREATE INDEX idx_photos_owner  ON public.photos(owner_id);

-- Enforce max 4 photos per person
CREATE OR REPLACE FUNCTION enforce_photo_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.photos WHERE person_id = NEW.person_id) >= 4 THEN
    RAISE EXCEPTION 'Maximum of 4 photos allowed per person';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_photo_limit
  BEFORE INSERT ON public.photos
  FOR EACH ROW EXECUTE FUNCTION enforce_photo_limit();

-- =============================================
-- RELATIONSHIPS
-- =============================================
CREATE TABLE public.relationships (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_a_id   UUID NOT NULL REFERENCES public.persons(id) ON DELETE CASCADE,
  person_b_id   UUID NOT NULL REFERENCES public.persons(id) ON DELETE CASCADE,
  relationship  relationship_type NOT NULL,
  owner_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  is_cross_tree BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT no_self_relationship CHECK (person_a_id != person_b_id),
  CONSTRAINT unique_relationship  UNIQUE (person_a_id, person_b_id, relationship)
);

CREATE INDEX idx_rel_person_a ON public.relationships(person_a_id);
CREATE INDEX idx_rel_person_b ON public.relationships(person_b_id);
CREATE INDEX idx_rel_owner     ON public.relationships(owner_id);

-- =============================================
-- TREE CONNECTIONS
-- =============================================
CREATE TABLE public.tree_connections (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id        UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  target_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  requester_person_id UUID REFERENCES public.persons(id),
  target_person_id    UUID REFERENCES public.persons(id),
  relationship        relationship_type NOT NULL,
  status              connection_status DEFAULT 'pending',
  message             TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  resolved_at         TIMESTAMPTZ,

  CONSTRAINT no_self_connection       CHECK (requester_id != target_id),
  CONSTRAINT unique_connection_request UNIQUE (requester_id, target_id, requester_person_id, target_person_id)
);

CREATE INDEX idx_conn_requester ON public.tree_connections(requester_id);
CREATE INDEX idx_conn_target    ON public.tree_connections(target_id);
CREATE INDEX idx_conn_status    ON public.tree_connections(status);

-- =============================================
-- LFTID GENERATION
-- =============================================
CREATE OR REPLACE FUNCTION generate_lftid(prefix TEXT DEFAULT 'LFT')
RETURNS TEXT AS $$
DECLARE
  chars  TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := prefix || '-';
  i      INT;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::INT, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- UPDATED_AT TRIGGER
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at   BEFORE UPDATE ON public.users   FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_persons_updated_at BEFORE UPDATE ON public.persons FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- AUTO-CREATE USER PROFILE ON SIGNUP
-- =============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_lftid TEXT;
BEGIN
  LOOP
    new_lftid := generate_lftid('LFT');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.users WHERE lftid = new_lftid);
  END LOOP;

  INSERT INTO public.users (id, lftid, display_name, avatar_url)
  VALUES (
    NEW.id,
    new_lftid,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE public.users            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.persons          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relationships    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tree_connections ENABLE ROW LEVEL SECURITY;

-- USERS
CREATE POLICY "users_select_own"    ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_select_public" ON public.users FOR SELECT USING (tree_visibility = 'public');
CREATE POLICY "users_update_own"    ON public.users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- PERSONS
CREATE POLICY "persons_owner_all"   ON public.persons FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "persons_connected_read" ON public.persons FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.tree_connections tc
    WHERE tc.status = 'approved'
      AND ((tc.requester_id = auth.uid() AND tc.target_id = owner_id)
        OR (tc.target_id = auth.uid() AND tc.requester_id = owner_id))
  )
);
CREATE POLICY "persons_public_read" ON public.persons FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users u WHERE u.id = owner_id AND u.tree_visibility = 'public')
);

-- PHOTOS
CREATE POLICY "photos_owner_all"    ON public.photos FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "photos_person_read"  ON public.photos FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.persons p WHERE p.id = person_id
      AND (p.owner_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = p.owner_id AND u.tree_visibility = 'public'))
  )
);

-- RELATIONSHIPS
CREATE POLICY "relationships_owner_all"       ON public.relationships FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "relationships_connected_read"  ON public.relationships FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.persons p WHERE p.id = person_a_id
      AND (p.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.tree_connections tc
          WHERE tc.status = 'approved'
            AND (tc.requester_id = auth.uid() OR tc.target_id = auth.uid())
        ))
  )
);

-- TREE CONNECTIONS
CREATE POLICY "connections_parties_all" ON public.tree_connections FOR ALL
  USING (auth.uid() = requester_id OR auth.uid() = target_id)
  WITH CHECK (auth.uid() = requester_id OR auth.uid() = target_id);

-- =============================================
-- STORAGE BUCKETS (run in Supabase dashboard
-- or via supabase CLI after this migration)
-- =============================================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('person-photos', 'person-photos', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('user-avatars',  'user-avatars',  true);
