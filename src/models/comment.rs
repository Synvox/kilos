// use diesel::prelude::*;

#[derive(Queryable, Debug, Serialize, Deserialize)]
pub struct Comment {
	pub id: i32,
	pub body: String,
  pub user_id: i32,
  
  #[serde(skip)]
  pub scope_id: i32,
  #[serde(skip)]
  pub transaction_id: i32
}
