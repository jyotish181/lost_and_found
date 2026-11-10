-- database/schema.sql
-- Lost & Found schema for PostgreSQL.
-- Run in pgAdmin (Query Tool) on the "lost_and_found" database, or with: npm run db:init
-- Safe to run more than once.

CREATE TABLE IF NOT EXISTS users (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(255) NOT NULL,
  email      VARCHAR(255) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,
  is_admin   BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS items (
  id                   SERIAL PRIMARY KEY,
  title                TEXT        NOT NULL,
  description          TEXT        NOT NULL,
  category             VARCHAR(100) NOT NULL DEFAULT 'Other',
  color                VARCHAR(100) NOT NULL DEFAULT '',
  brand                VARCHAR(100) NOT NULL DEFAULT '',
  location             TEXT        NOT NULL,
  date                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status               VARCHAR(10) NOT NULL CHECK (status IN ('lost', 'found')),
  reported_by          INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  image_url            TEXT        NOT NULL DEFAULT '',
  cloudinary_public_id TEXT        NOT NULL DEFAULT '',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS claims (
  id         SERIAL PRIMARY KEY,
  item_id    INTEGER     NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  claimed_by INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status     VARCHAR(10) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  message    TEXT        NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- one user can claim the same item only once
  CONSTRAINT claims_item_user_unique UNIQUE (item_id, claimed_by)
);

CREATE TABLE IF NOT EXISTS notifications (
  id           SERIAL PRIMARY KEY,
  recipient_id INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id      INTEGER     REFERENCES items(id) ON DELETE CASCADE,
  title        TEXT        NOT NULL,
  message      TEXT        NOT NULL,
  is_read      BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_items_status      ON items(status);
CREATE INDEX IF NOT EXISTS idx_items_category    ON items(category);
CREATE INDEX IF NOT EXISTS idx_items_reported_by ON items(reported_by);
CREATE INDEX IF NOT EXISTS idx_items_created_at  ON items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_claims_claimed_by ON claims(claimed_by);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id, created_at DESC);

-- Keep updated_at fresh automatically
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated         ON users;
DROP TRIGGER IF EXISTS trg_items_updated         ON items;
DROP TRIGGER IF EXISTS trg_claims_updated        ON claims;
DROP TRIGGER IF EXISTS trg_notifications_updated ON notifications;

CREATE TRIGGER trg_users_updated         BEFORE UPDATE ON users         FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_items_updated         BEFORE UPDATE ON items         FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_claims_updated        BEFORE UPDATE ON claims        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_notifications_updated BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION set_updated_at();
