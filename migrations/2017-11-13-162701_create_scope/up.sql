create table "scopes" (
  "id" serial primary key
);

create table "scope_permissions" (
  "id" serial primary key,
  "roles" text[] not null
);

create table "scope_transactions" (
  "id" serial primary key
);

alter table "scopes"
  add column "current_transaction_id" int
    references scope_transactions(id);

alter table "scope_permissions"
  add column "user_id" int not null,
  add constraint "scope_permissions_user_id_fkey"
    foreign key (user_id)
    references users(id) on delete cascade,
  add column "scope_id" int not null,
  add constraint "scope_permissions_scope_id_fkey"
    foreign key (scope_id)
    references scopes(id) on delete cascade,
  add constraint scope_permissions_user_id_scope_id unique ("user_id", "scope_id");

alter table "scope_transactions"
  add column "user_id" int not null,
  add constraint "scope_transactions_user_id_fkey"
    foreign key (user_id)
    references users(id) on delete cascade,
  add column "scope_id" int not null,
  add constraint "scope_transactions_scope_id_fkey"
    foreign key (scope_id)
    references scopes(id) on delete cascade,
  add column "previous_transaction_id" int,
  add constraint "scope_transactions_previous_transaction_id_fkey"
    foreign key (previous_transaction_id)
    references scope_transactions(id) on delete cascade,
  add constraint scope_transactions_user_id_scope_id unique ("id", "user_id", "scope_id");
