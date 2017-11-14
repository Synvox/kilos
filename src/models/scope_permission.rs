// use diesel::prelude::*;

#[derive(Queryable, Debug, Serialize, Deserialize)]
pub struct ScopePermission {
	pub id: i32,
	pub roles: Vec<String>,
	pub user_id: i32,
	pub scope_id: i32
}
