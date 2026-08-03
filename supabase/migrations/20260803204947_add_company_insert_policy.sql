-- Allow authenticated users to insert a new company during sign-up
-- (they don't have a profile yet, so we can't check company membership)
DROP POLICY IF EXISTS "insert_own_company" ON companies;
CREATE POLICY "insert_own_company" ON companies FOR INSERT TO authenticated
WITH CHECK (true);
