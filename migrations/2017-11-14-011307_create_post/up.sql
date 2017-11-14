create table "comments" (
  "id" serial primary key,
  "body" text not null
);

alter table "comments"
  add column "user_id" int not null,
  add constraint "posts_user_id_fkey"
    foreign key (user_id)
    references users(id) on delete cascade,
  add column "scope_id" int not null,
  add constraint "posts_scope_id_fkey"
    foreign key (scope_id)
    references scopes(id) on delete cascade,
  add column "transaction_id" int not null,
  add constraint "posts_transaction_id_fkey"
    foreign key (transaction_id)
    references scope_transactions(id) on delete cascade;
