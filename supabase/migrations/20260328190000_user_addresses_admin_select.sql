-- Admin puede leer direcciones de clientes para cumplir pedidos (panel Órdenes).

drop policy if exists "user_addresses_admin_select" on public.user_addresses;
create policy "user_addresses_admin_select"
  on public.user_addresses for select to authenticated
  using (public.is_admin());
