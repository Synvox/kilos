// use diesel::prelude::*;

#[derive(Queryable, Debug, Serialize, Deserialize)]
pub struct Scope {
	pub id: i32,
	pub current_transaction_id: Option<i32>
}
