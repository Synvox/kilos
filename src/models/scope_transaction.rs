// use diesel::prelude::*;

#[derive(Queryable, Debug, Serialize, Deserialize)]
pub struct ScopeTransaction {
	pub id: i32,
	pub user_id: i32,
	pub scope_id: i32,
	pub previous_transaction_id: Option<i32>
}
