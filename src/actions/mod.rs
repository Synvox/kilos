use db;

#[derive(Debug, Serialize, Deserialize)]
pub enum ActionTypes {
  #[serde(rename = "LOGIN")]
  Login,
  #[serde(rename = "LOGOUT")]
  Logout
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Action<T> {
  #[serde(rename="type")]
	kind: ActionTypes,
	payload: T
}

pub fn resolve<T>(conn: &db::PgSqlConn, action: Action<T>) {

  println!("{:#?}", action.payload as i32);
}
