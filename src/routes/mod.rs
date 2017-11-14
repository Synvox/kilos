use maud::{html, Markup};
use diesel::prelude::*;
use rocket;
use rocket_contrib::{Json, Value};

use db;
use actions;

#[get("/")]
fn index() -> Markup {
	html! {
		h1 "Welcome"
	}
}

#[get("/user")]
fn get_user(conn: db::PgSqlConn) -> Json<Value> {
	use std::collections::HashMap;
	use schema::users;
	use schema::scopes;
	use schema::scope_permissions;
	use models::user::User;
	use models::scope::Scope;
	use models::scope_permission::ScopePermission;

	let user:User = users::table.find(1)
		.get_result(&*conn)
		.expect("User not found");

	let scope_perms = scope_permissions::table
		.filter(scope_permissions::user_id.eq(user.id))
		.load::<ScopePermission>(&*conn)
		.expect("Error loading permissions");

	let mut user_scopes = HashMap::new();
	for perm in scope_perms {
		let scope:Scope = scopes::table.find(perm.scope_id as i32)
			.get_result(&*conn)
			.expect("Scope does not exist");

		user_scopes.insert(perm.scope_id.to_string(), json!({
			"roles": perm.roles,
			"current_transaction_id": scope.current_transaction_id
		}));
	}

	Json(json!({
		"data": {
			"email": user.email,
			"scopes": user_scopes
		}
	}))
}

#[get("/<scope_id>/<transaction_id>")]
fn get_scope(conn: db::PgSqlConn, scope_id: i32, transaction_id: i32) -> Json<Value> {
	use schema::users;
	use schema::scopes;
	use schema::scope_permissions;
	use schema::scope_transactions;
	use models::by_transaction;
	use models::user::User;
	use models::scope::Scope;
	use models::scope_permission::ScopePermission;
	use models::scope_transaction::ScopeTransaction;

	let user:User = users::table.find(1)
		.get_result(&*conn)
		.expect("User not found");

	let perm:ScopePermission = scope_permissions::table
		.filter(scope_permissions::user_id.eq(user.id))
		.filter(scope_permissions::scope_id.eq(scope_id))
		.get_result(&*conn)
		.expect("Error loading perms");
	
	let scope:Scope = scopes::table.find(perm.scope_id)
		.get_result(&*conn)
		.expect("Scope does not exist");

	let mut transaction_ids = vec![];

	let mut cursor = scope.current_transaction_id;
	while cursor.is_some() && cursor.unwrap() != transaction_id {
		let transaction:ScopeTransaction = scope_transactions::table
			.find(cursor.unwrap())
			.get_result(&*conn)
			.expect("Transaction not found.");
		
		cursor = transaction.previous_transaction_id;
		transaction_ids.push(json!({
			"id": transaction.id,
			"models": by_transaction(&conn, transaction.id)
		}));
	}

	transaction_ids.reverse();

	Json(json!({
		"data": {
			"current_transaction_id": scope.current_transaction_id,
			"transactions": transaction_ids,
		}
	}))
}

#[post("/dispatch/<scope_id>/<transaction_id>",  data="<pending_actions>")]
fn action_route<T>(conn: db::PgSqlConn, scope_id: i32, transaction_id: i32, pending_actions: Json<Vec<actions::Action<T>>>) -> Json<Value> {
	for pending_action in pending_actions.into_inner() {
		actions::resolve(&conn, pending_action);
	}
	get_scope(conn, scope_id, transaction_id)
}

pub fn rocket(conn: db::PgSqlPool) -> rocket::Rocket {
  rocket::ignite()
		.mount("/", routes![index, get_user, get_scope])
		.manage(conn)
}

