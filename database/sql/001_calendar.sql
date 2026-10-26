-- Jalali calendar, matching front-end `jalaali-js` 2.0.1 (Borkowski).
-- Used so installment due dates and overdue status agree with the Vue app.
-- Supported years are -61 through 3177. App data is constrained to 1200..1600.

CREATE OR REPLACE FUNCTION jal_div(a bigint, b bigint)
RETURNS bigint
LANGUAGE sql
IMMUTABLE
STRICT
AS $$
  SELECT a / b;
$$;

-- Toward-zero remainder, same as jalaali-js `mod` (`a - trunc(a / b) * b`).
CREATE OR REPLACE FUNCTION jal_mod(a bigint, b bigint)
RETURNS bigint
LANGUAGE sql
IMMUTABLE
STRICT
AS $$
  SELECT a - (a / b) * b;
$$;

CREATE OR REPLACE FUNCTION jal_cal(jy integer)
RETURNS TABLE (leap integer, gy integer, march integer)
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  breaks constant integer[] := ARRAY[
    -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181,
    1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178
  ];
  bl integer := array_length(breaks, 1);
  gy_v integer := jy + 621;
  leap_j integer := -14;
  jp integer := breaks[1];
  jm integer := 0;
  jump integer := 0;
  n integer;
  leap_g integer;
  march_v integer;
  adjusted integer;
  leap_v integer;
  i integer;
BEGIN
  IF jy < breaks[1] OR jy > breaks[bl] - 1 THEN
    RAISE EXCEPTION 'Invalid Jalaali year %', jy;
  END IF;

  FOR i IN 2..bl LOOP
    jm := breaks[i];
    jump := jm - jp;
    EXIT WHEN jy < jm;
    leap_j := leap_j + jal_div(jump, 33) * 8 + jal_div(jal_mod(jump, 33), 4);
    jp := jm;
  END LOOP;

  n := jy - jp;
  leap_j := leap_j + jal_div(n, 33) * 8 + jal_div(jal_mod(n, 33) + 3, 4);
  IF jal_mod(jump, 33) = 4 AND jump - n = 4 THEN
    leap_j := leap_j + 1;
  END IF;

  leap_g := jal_div(gy_v, 4) - jal_div((jal_div(gy_v, 100) + 1) * 3, 4) - 150;
  march_v := 20 + leap_j - leap_g;

  adjusted := n;
  IF jump - n < 6 THEN
    adjusted := n - jump + jal_div(jump + 4, 33) * 33;
  END IF;
  leap_v := jal_mod(jal_mod(adjusted + 1, 33) - 1, 4);
  IF leap_v = -1 THEN
    leap_v := 4;
  END IF;

  leap := leap_v;
  gy := gy_v;
  march := march_v;
  RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION gregorian_to_jdn(gy integer, gm integer, gd integer)
RETURNS bigint
LANGUAGE plpgsql
IMMUTABLE
STRICT
AS $$
DECLARE
  shift bigint := jal_div(gm - 8, 6);
  d bigint;
BEGIN
  d := jal_div((gy + shift + 100100) * 1461, 4)
     + jal_div(153 * jal_mod(gm + 9, 12) + 2, 5)
     + gd
     - 34840408;
  d := d - jal_div(jal_div(gy + 100100 + shift, 100) * 3, 4) + 752;
  RETURN d;
END;
$$;

CREATE OR REPLACE FUNCTION jdn_to_gregorian(jdn bigint)
RETURNS date
LANGUAGE plpgsql
IMMUTABLE
STRICT
AS $$
DECLARE
  j bigint := 4 * jdn + 139361631;
  i bigint;
  gd integer;
  gm integer;
  gy integer;
BEGIN
  j := j + jal_div(jal_div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
  i := jal_div(jal_mod(j, 1461), 4) * 5 + 308;
  gd := jal_div(jal_mod(i, 153), 5) + 1;
  gm := jal_mod(jal_div(i, 153), 12) + 1;
  gy := jal_div(j, 1461) - 100100 + jal_div(8 - gm, 6);
  RETURN make_date(gy, gm, gd);
END;
$$;

CREATE OR REPLACE FUNCTION jalali_month_length(jy integer, jm integer)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF jm < 1 OR jm > 12 THEN
    RAISE EXCEPTION 'Invalid Jalaali month %', jm;
  END IF;
  IF jm <= 6 THEN
    RETURN 31;
  END IF;
  IF jm <= 11 THEN
    RETURN 30;
  END IF;
  IF (SELECT c.leap FROM jal_cal(jy) AS c) = 0 THEN
    RETURN 30;
  END IF;
  RETURN 29;
END;
$$;

-- Nominal due day is clamped the same way as `clampDueDay` in the Vue app.
CREATE OR REPLACE FUNCTION jalali_clamp_day(jy integer, jm integer, jd integer)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT LEAST(GREATEST(jd, 1), jalali_month_length(jy, jm));
$$;

CREATE OR REPLACE FUNCTION jalali_to_date(jy integer, jm integer, jd integer)
RETURNS date
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  cal record;
  safe_day integer;
  jdn bigint;
BEGIN
  IF jm < 1 OR jm > 12 THEN
    RAISE EXCEPTION 'Invalid Jalaali month %', jm;
  END IF;
  safe_day := jalali_clamp_day(jy, jm, jd);
  SELECT * INTO cal FROM jal_cal(jy);
  jdn := gregorian_to_jdn(cal.gy, 3, cal.march)
       + (jm - 1) * 31
       - jal_div(jm, 7) * (jm - 7)
       + safe_day
       - 1;
  RETURN jdn_to_gregorian(jdn);
END;
$$;

CREATE OR REPLACE FUNCTION jalali_month_name(jm integer)
RETURNS text
LANGUAGE sql
IMMUTABLE
STRICT
AS $$
  SELECT (ARRAY[
    'Farvardin', 'Ordibehesht', 'Khordad', 'Tir', 'Mordad', 'Shahrivar',
    'Mehr', 'Aban', 'Azar', 'Dey', 'Bahman', 'Esfand'
  ])[jm];
$$;

-- Fail the migration if the port drifts from jalaali-js.
DO $$
DECLARE
  cal record;
BEGIN
  SELECT * INTO cal FROM jal_cal(1390);
  IF cal.leap <> 3 OR cal.gy <> 2011 OR cal.march <> 21 THEN
    RAISE EXCEPTION 'jal_cal(1390) = %', cal;
  END IF;

  SELECT * INTO cal FROM jal_cal(1391);
  IF cal.leap <> 0 OR cal.gy <> 2012 OR cal.march <> 20 THEN
    RAISE EXCEPTION 'jal_cal(1391) = %', cal;
  END IF;

  SELECT * INTO cal FROM jal_cal(1395);
  IF cal.leap <> 0 OR cal.gy <> 2016 OR cal.march <> 20 THEN
    RAISE EXCEPTION 'jal_cal(1395) = %', cal;
  END IF;

  IF jalali_month_length(1394, 12) <> 29 OR jalali_month_length(1395, 12) <> 30 THEN
    RAISE EXCEPTION 'Esfand length mismatch';
  END IF;

  IF jalali_to_date(1395, 1, 23) <> DATE '2016-04-11' THEN
    RAISE EXCEPTION '1395-01-23 converted to %', jalali_to_date(1395, 1, 23);
  END IF;

  IF jalali_to_date(1400, 4, 30) <> DATE '2021-07-21' THEN
    RAISE EXCEPTION '1400-04-30 converted to %', jalali_to_date(1400, 4, 30);
  END IF;

  IF gregorian_to_jdn(2016, 4, 11) <> 2457490 THEN
    RAISE EXCEPTION 'g2d mismatch %', gregorian_to_jdn(2016, 4, 11);
  END IF;
END;
$$;
