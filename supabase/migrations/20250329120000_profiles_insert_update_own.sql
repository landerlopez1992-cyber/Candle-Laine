-- Permite que cada usuario cree/actualice su fila en `profiles` (p. ej. si faltaba
-- tras migraciones o el trigger no corrió). Necesario para FK en `product_reviews.user_id`.

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert to authenticated
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);
