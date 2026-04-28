-- Allow authenticated users to delete sales (and cashiers).
--
-- The original migration only granted SELECT/INSERT/UPDATE on sales, which
-- meant booth-cleanup deletes from the client (logout, tab close) were
-- rejected by RLS with 42501 and discarded by the upload queue. Locally the
-- draft sale was gone but on Supabase it stuck around, so the active-sales
-- view on other clients still rendered the row (with 0 items but a non-zero
-- total — sale_items already had a delete policy so those did clear).
--
-- sale_items already had a delete policy and is not included here.

CREATE POLICY "Users can delete sales" ON sales
    FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete cashiers" ON cashiers
    FOR DELETE USING (auth.role() = 'authenticated');
