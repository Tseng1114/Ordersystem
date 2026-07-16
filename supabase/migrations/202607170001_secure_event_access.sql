begin;

create extension if not exists pgcrypto with schema extensions;

alter table public.events
  add column if not exists access_token uuid;

update public.events
set access_token = gen_random_uuid()
where access_token is null;

alter table public.events
  alter column access_token set default gen_random_uuid(),
  alter column access_token set not null;

create unique index if not exists events_access_token_idx
  on public.events (access_token);

alter table public.events
  add column if not exists admin_token_hash text;

update public.events
set admin_token_hash = encode(
  extensions.digest(convert_to(encode(extensions.gen_random_bytes(32), 'hex'), 'UTF8'), 'sha256'),
  'hex'
)
where admin_token_hash is null;

alter table public.events
  alter column admin_token_hash set not null;

alter table public.events
  drop constraint if exists events_shop_length,
  add constraint events_shop_length
    check (char_length(btrim(shop)) between 1 and 80) not valid,
  drop constraint if exists events_category_allowed,
  add constraint events_category_allowed
    check (category in ('drink', 'food')) not valid,
  drop constraint if exists events_status_allowed,
  add constraint events_status_allowed
    check (status in ('open', 'closed')) not valid;

alter table public.orders
  drop constraint if exists orders_customer_length,
  add constraint orders_customer_length
    check (char_length(btrim(customer)) between 1 and 40) not valid,
  drop constraint if exists orders_name_length,
  add constraint orders_name_length
    check (char_length(btrim(name)) between 1 and 120) not valid,
  drop constraint if exists orders_suger_length,
  add constraint orders_suger_length
    check (char_length(coalesce(suger, '')) <= 40) not valid,
  drop constraint if exists orders_ice_length,
  add constraint orders_ice_length
    check (char_length(coalesce(ice, '')) <= 40) not valid,
  drop constraint if exists orders_qty_range,
  add constraint orders_qty_range
    check (qty between 1 and 99) not valid;

alter table public.events enable row level security;
alter table public.orders enable row level security;

do $$
declare
  policy_record record;
begin
  for policy_record in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('events', 'orders')
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      policy_record.policyname,
      policy_record.schemaname,
      policy_record.tablename
    );
  end loop;
end
$$;

revoke all on table public.events from anon, authenticated;
revoke all on table public.orders from anon, authenticated;

create or replace function public.create_event_secure(
  p_shop text,
  p_category text,
  p_deadline timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  created_event public.events%rowtype;
  admin_token text := encode(extensions.gen_random_bytes(32), 'hex');
begin
  p_shop := btrim(coalesce(p_shop, ''));
  p_category := lower(btrim(coalesce(p_category, '')));

  if char_length(p_shop) not between 1 and 80 then
    raise exception using errcode = '22023', message = 'INVALID_SHOP';
  end if;
  if p_category not in ('drink', 'food') then
    raise exception using errcode = '22023', message = 'INVALID_CATEGORY';
  end if;
  if p_deadline is null
    or p_deadline <= now()
    or p_deadline > now() + interval '30 days' then
    raise exception using errcode = '22023', message = 'INVALID_DEADLINE';
  end if;

  insert into public.events (
    title,
    shop,
    category,
    deadline,
    status,
    admin_token_hash
  )
  values (
    p_shop || ' 訂購活動',
    p_shop,
    p_category,
    p_deadline,
    'open',
    encode(extensions.digest(convert_to(admin_token, 'UTF8'), 'sha256'), 'hex')
  )
  returning * into created_event;

  return jsonb_build_object(
    'id', created_event.id,
    'access_token', created_event.access_token,
    'admin_token', admin_token
  );
end;
$$;

create or replace function public.get_event_secure(p_access_token uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  select jsonb_build_object(
    'id', event_row.id,
    'access_token', event_row.access_token,
    'title', event_row.title,
    'shop', event_row.shop,
    'category', event_row.category,
    'deadline', event_row.deadline,
    'status', event_row.status,
    'created_at', event_row.created_at,
    'orders', coalesce((
      select jsonb_agg(to_jsonb(order_row) order by order_row.created_at)
      from public.orders as order_row
      where order_row.event_id = event_row.id
    ), '[]'::jsonb)
  )
  into result
  from public.events as event_row
  where event_row.access_token = p_access_token;

  if result is null then
    raise exception using errcode = 'P0002', message = 'EVENT_NOT_FOUND';
  end if;

  return result;
end;
$$;

create or replace function public.get_event_admin(p_admin_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  token_hash text;
  result jsonb;
begin
  if p_admin_token is null or p_admin_token !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = '28000', message = 'INVALID_ADMIN_TOKEN';
  end if;

  token_hash := encode(
    extensions.digest(convert_to(lower(p_admin_token), 'UTF8'), 'sha256'),
    'hex'
  );

  select jsonb_build_object(
    'id', event_row.id,
    'access_token', event_row.access_token,
    'title', event_row.title,
    'shop', event_row.shop,
    'category', event_row.category,
    'deadline', event_row.deadline,
    'status', event_row.status,
    'created_at', event_row.created_at,
    'orders', coalesce((
      select jsonb_agg(to_jsonb(order_row) order by order_row.created_at)
      from public.orders as order_row
      where order_row.event_id = event_row.id
    ), '[]'::jsonb)
  )
  into result
  from public.events as event_row
  where event_row.admin_token_hash = token_hash;

  if result is null then
    raise exception using errcode = '28000', message = 'INVALID_ADMIN_TOKEN';
  end if;

  return result;
end;
$$;

create or replace function public.submit_orders_secure(
  p_access_token uuid,
  p_orders jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_event public.events%rowtype;
  input_order record;
  created_order public.orders%rowtype;
  created_orders jsonb := '[]'::jsonb;
begin
  if p_orders is null or jsonb_typeof(p_orders) <> 'array' then
    raise exception using errcode = '22023', message = 'INVALID_ORDER_COUNT';
  end if;
  if jsonb_array_length(p_orders) not between 1 and 20 then
    raise exception using errcode = '22023', message = 'INVALID_ORDER_COUNT';
  end if;

  select * into target_event
  from public.events
  where access_token = p_access_token;

  if not found then
    raise exception using errcode = 'P0002', message = 'EVENT_NOT_FOUND';
  end if;
  if target_event.status <> 'open' or target_event.deadline <= now() then
    raise exception using errcode = '22023', message = 'EVENT_CLOSED';
  end if;

  for input_order in
    select *
    from jsonb_to_recordset(p_orders) as item(
      customer text,
      name text,
      suger text,
      ice text,
      qty integer
    )
  loop
    input_order.customer := btrim(coalesce(input_order.customer, ''));
    input_order.name := btrim(coalesce(input_order.name, ''));
    input_order.suger := btrim(coalesce(input_order.suger, ''));
    input_order.ice := btrim(coalesce(input_order.ice, ''));
    input_order.qty := coalesce(input_order.qty, 1);

    if char_length(input_order.customer) not between 1 and 40
      or char_length(input_order.name) not between 1 and 120
      or char_length(input_order.suger) > 40
      or char_length(input_order.ice) > 40
      or input_order.qty not between 1 and 99 then
      raise exception using errcode = '22023', message = 'INVALID_ORDER';
    end if;

    insert into public.orders (event_id, customer, name, suger, ice, qty)
    values (
      target_event.id,
      input_order.customer,
      input_order.name,
      input_order.suger,
      input_order.ice,
      input_order.qty
    )
    returning * into created_order;

    created_orders := created_orders || jsonb_build_array(to_jsonb(created_order));
  end loop;

  return created_orders;
end;
$$;

create or replace function public.add_order_admin(
  p_admin_token text,
  p_customer text,
  p_name text,
  p_suger text,
  p_ice text,
  p_qty integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_event public.events%rowtype;
  created_order public.orders%rowtype;
  token_hash text;
begin
  token_hash := encode(
    extensions.digest(convert_to(lower(coalesce(p_admin_token, '')), 'UTF8'), 'sha256'),
    'hex'
  );

  select * into target_event
  from public.events
  where admin_token_hash = token_hash;

  if not found then
    raise exception using errcode = '28000', message = 'INVALID_ADMIN_TOKEN';
  end if;
  if target_event.status <> 'open' or target_event.deadline <= now() then
    raise exception using errcode = '22023', message = 'EVENT_CLOSED';
  end if;

  p_customer := btrim(coalesce(p_customer, ''));
  p_name := btrim(coalesce(p_name, ''));
  p_suger := btrim(coalesce(p_suger, ''));
  p_ice := btrim(coalesce(p_ice, ''));
  p_qty := coalesce(p_qty, 1);

  if char_length(p_customer) not between 1 and 40
    or char_length(p_name) not between 1 and 120
    or char_length(p_suger) > 40
    or char_length(p_ice) > 40
    or p_qty not between 1 and 99 then
    raise exception using errcode = '22023', message = 'INVALID_ORDER';
  end if;

  insert into public.orders (event_id, customer, name, suger, ice, qty)
  values (target_event.id, p_customer, p_name, p_suger, p_ice, p_qty)
  returning * into created_order;

  return to_jsonb(created_order);
end;
$$;

create or replace function public.update_order_admin(
  p_admin_token text,
  p_order_id uuid,
  p_customer text,
  p_name text,
  p_suger text,
  p_ice text,
  p_qty integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_event public.events%rowtype;
  updated_order public.orders%rowtype;
  token_hash text;
begin
  token_hash := encode(
    extensions.digest(convert_to(lower(coalesce(p_admin_token, '')), 'UTF8'), 'sha256'),
    'hex'
  );

  select event_row.* into target_event
  from public.events as event_row
  join public.orders as order_row on order_row.event_id = event_row.id
  where event_row.admin_token_hash = token_hash
    and order_row.id = p_order_id;

  if not found then
    raise exception using errcode = '28000', message = 'INVALID_ADMIN_TOKEN';
  end if;
  if target_event.status <> 'open' or target_event.deadline <= now() then
    raise exception using errcode = '22023', message = 'EVENT_CLOSED';
  end if;

  p_customer := btrim(coalesce(p_customer, ''));
  p_name := btrim(coalesce(p_name, ''));
  p_suger := btrim(coalesce(p_suger, ''));
  p_ice := btrim(coalesce(p_ice, ''));
  p_qty := coalesce(p_qty, 1);

  if char_length(p_customer) not between 1 and 40
    or char_length(p_name) not between 1 and 120
    or char_length(p_suger) > 40
    or char_length(p_ice) > 40
    or p_qty not between 1 and 99 then
    raise exception using errcode = '22023', message = 'INVALID_ORDER';
  end if;

  update public.orders
  set customer = p_customer,
      name = p_name,
      suger = p_suger,
      ice = p_ice,
      qty = p_qty
  where id = p_order_id
    and event_id = target_event.id
  returning * into updated_order;

  return to_jsonb(updated_order);
end;
$$;

create or replace function public.delete_order_admin(
  p_admin_token text,
  p_order_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_event public.events%rowtype;
  token_hash text;
begin
  token_hash := encode(
    extensions.digest(convert_to(lower(coalesce(p_admin_token, '')), 'UTF8'), 'sha256'),
    'hex'
  );

  select event_row.* into target_event
  from public.events as event_row
  join public.orders as order_row on order_row.event_id = event_row.id
  where event_row.admin_token_hash = token_hash
    and order_row.id = p_order_id;

  if not found then
    raise exception using errcode = '28000', message = 'INVALID_ADMIN_TOKEN';
  end if;
  if target_event.status <> 'open' or target_event.deadline <= now() then
    raise exception using errcode = '22023', message = 'EVENT_CLOSED';
  end if;

  delete from public.orders
  where id = p_order_id
    and event_id = target_event.id;

  return found;
end;
$$;

revoke all on function public.create_event_secure(text, text, timestamptz) from public;
revoke all on function public.get_event_secure(uuid) from public;
revoke all on function public.get_event_admin(text) from public;
revoke all on function public.submit_orders_secure(uuid, jsonb) from public;
revoke all on function public.add_order_admin(text, text, text, text, text, integer) from public;
revoke all on function public.update_order_admin(text, uuid, text, text, text, text, integer) from public;
revoke all on function public.delete_order_admin(text, uuid) from public;

grant execute on function public.create_event_secure(text, text, timestamptz) to anon, authenticated;
grant execute on function public.get_event_secure(uuid) to anon, authenticated;
grant execute on function public.get_event_admin(text) to anon, authenticated;
grant execute on function public.submit_orders_secure(uuid, jsonb) to anon, authenticated;
grant execute on function public.add_order_admin(text, text, text, text, text, integer) to anon, authenticated;
grant execute on function public.update_order_admin(text, uuid, text, text, text, text, integer) to anon, authenticated;
grant execute on function public.delete_order_admin(text, uuid) to anon, authenticated;

commit;
