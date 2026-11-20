-- Least-privilege role for the backend (requirement 2-A.4).
--
-- Run once as a database administrator (a user with CREATEROLE that
-- owns the database and schema):
--   psql -v app_password='...' -f db/app-role.sql
-- The course server's cit03 account lacks CREATEROLE, so there the
-- backend still connects as cit03, the owner of all objects.
-- Then point PGUSER/PGPASSWORD in the backend's .env at cit_app.
--
-- The role can read everything the API exposes, write only the
-- framework tables, and call the SP1 functions. It cannot create,
-- alter, drop or truncate anything, and it does not own any objects.

\set ON_ERROR_STOP on

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'cit_app') THEN
    CREATE ROLE cit_app NOLOGIN;
  END IF;
END
$$;

ALTER ROLE cit_app LOGIN PASSWORD :'app_password'
  NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;

SELECT format('GRANT CONNECT ON DATABASE %I TO cit_app', current_database())
\gexec

-- Use objects in the schema, but never create new ones.
GRANT USAGE ON SCHEMA public TO cit_app;
REVOKE CREATE ON SCHEMA public FROM cit_app;

-- IMDb data is read-only through the API (2-A.1).
GRANT SELECT ON ALL TABLES IN SCHEMA public TO cit_app;

-- Framework data: full create, read, update and delete.
GRANT INSERT, UPDATE, DELETE ON
  users,
  bookmark_media,
  bookmark_person,
  search_log,
  user_rating
TO cit_app;

-- The update_application_rating trigger on user_rating upserts the
-- application's own average into media_rating whenever a user rates.
GRANT INSERT, UPDATE ON media_rating TO cit_app;

-- SERIAL ids for new users and search-log entries.
GRANT USAGE ON SEQUENCE users_id_seq, search_log_id_seq TO cit_app;

-- The SP1 functions (search, rating, bookmarks, co-players, ...).
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO cit_app;
