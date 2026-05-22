CREATE POLICY "Lecture publique des publications"
   ON publications
   FOR SELECT
   TO anon, authenticated
   USING (true);

 CREATE POLICY "Écriture pour utilisateurs authentifiés"
   ON publications
   FOR INSERT
   TO authenticated
   WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Modification pour utilisateurs authentifiés"
  ON publications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Suppression pour utilisateurs authentifiés"
  ON publications
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
