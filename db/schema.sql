-- PostgreSQL schema for PLA tensile test data and derived results.
-- Apply with: psql -d <db_name> -f db/schema.sql

CREATE TABLE IF NOT EXISTS materials (
  id bigserial PRIMARY KEY,
  name text NOT NULL UNIQUE,
  grade text,
  supplier text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS print_profiles (
  id bigserial PRIMARY KEY,
  material_id bigint REFERENCES materials(id) ON DELETE SET NULL,
  code text NOT NULL UNIQUE,
  temperature_c double precision,
  speed_mm_s double precision,
  layer_height_mm double precision DEFAULT 0.5,
  extra_params jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (temperature_c IS NULL OR temperature_c >= 0),
  CHECK (speed_mm_s IS NULL OR speed_mm_s >= 0),
  CHECK (layer_height_mm IS NULL OR layer_height_mm >= 0)
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_attribute
    WHERE attrelid = 'print_profiles'::regclass
      AND attname = 'temperature_c'
      AND attnotnull
  ) THEN
    ALTER TABLE print_profiles ALTER COLUMN temperature_c DROP NOT NULL;
  END IF;
  IF EXISTS (
    SELECT 1
    FROM pg_attribute
    WHERE attrelid = 'print_profiles'::regclass
      AND attname = 'speed_mm_s'
      AND attnotnull
  ) THEN
    ALTER TABLE print_profiles ALTER COLUMN speed_mm_s DROP NOT NULL;
  END IF;
  IF EXISTS (
    SELECT 1
    FROM pg_attribute
    WHERE attrelid = 'print_profiles'::regclass
      AND attname = 'layer_height_mm'
      AND attnotnull
  ) THEN
    ALTER TABLE print_profiles ALTER COLUMN layer_height_mm DROP NOT NULL;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS test_runs (
  id bigserial PRIMARY KEY,
  print_profile_id bigint NOT NULL REFERENCES print_profiles(id) ON DELETE CASCADE,
  test_number integer NOT NULL,
  test_code text,
  specimen_length_mm double precision,
  specimen_width_mm double precision,
  specimen_thickness_mm double precision,
  specimen_area_mm2 double precision,
  raw_file_path text,
  processed_file_path text,
  source_columns text[],
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (print_profile_id, test_number),
  CHECK (test_number > 0)
);

CREATE TABLE IF NOT EXISTS test_measurements (
  id bigserial PRIMARY KEY,
  test_run_id bigint NOT NULL REFERENCES test_runs(id) ON DELETE CASCADE,
  point_index integer NOT NULL,
  tempo_s double precision,
  alongamento_mm_mm double precision,
  deformacao_mm_mm double precision,
  deformacao_mm double precision,
  forca_n double precision,
  tensao_pa double precision,
  tensao_mpa double precision,
  extras jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (test_run_id, point_index),
  CHECK (point_index > 0)
);

CREATE INDEX IF NOT EXISTS idx_print_profiles_temp_speed ON print_profiles (temperature_c, speed_mm_s);
CREATE INDEX IF NOT EXISTS idx_test_runs_profile ON test_runs (print_profile_id);
CREATE INDEX IF NOT EXISTS idx_test_measurements_test_run ON test_measurements (test_run_id);
CREATE INDEX IF NOT EXISTS idx_test_measurements_test_run_time ON test_measurements (test_run_id, tempo_s);

CREATE TABLE IF NOT EXISTS ramberg_osgood_fits (
  id bigserial PRIMARY KEY,
  test_run_id bigint NOT NULL REFERENCES test_runs(id) ON DELETE CASCADE,
  method text NOT NULL,
  e_mpa double precision NOT NULL,
  sigma_0_mpa double precision NOT NULL,
  n double precision NOT NULL,
  r2 double precision,
  rmse double precision,
  created_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (test_run_id, method)
);

CREATE TABLE IF NOT EXISTS mechanical_properties (
  id bigserial PRIMARY KEY,
  test_run_id bigint NOT NULL REFERENCES test_runs(id) ON DELETE CASCADE,
  method text NOT NULL,
  yield_stress_mpa double precision,
  ultimate_stress_mpa double precision,
  ductility_percent double precision,
  resilience_mj_m3 double precision,
  toughness_mj_m3 double precision,
  created_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (test_run_id, method)
);

CREATE TABLE IF NOT EXISTS users (
  id bigserial PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  password_salt text NOT NULL,
  password_hash text NOT NULL,
  session_token_hash text,
  session_expires_at timestamptz,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_session_token ON users (session_token_hash);

CREATE OR REPLACE VIEW v_measurements_export AS
SELECT
  p.code AS profile_code,
  p.temperature_c,
  p.speed_mm_s,
  p.layer_height_mm,
  t.test_number,
  t.test_code,
  m.point_index,
  m.tempo_s,
  m.alongamento_mm_mm,
  m.deformacao_mm_mm,
  m.deformacao_mm,
  m.forca_n,
  m.tensao_pa,
  m.tensao_mpa
FROM test_measurements m
JOIN test_runs t ON t.id = m.test_run_id
JOIN print_profiles p ON p.id = t.print_profile_id;
