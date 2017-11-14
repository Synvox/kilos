use rocket::Outcome;
use rocket::request::{self, FromRequest, Request};
use diesel::prelude::*;
use ::schema::users;
use ::db;

#[derive(Queryable, Debug, Serialize, Deserialize)]
pub struct User {
	pub id: i32,
	pub email: String,
	pub password: String
}

#[derive(Insertable)]
#[table_name="users"]
pub struct NewUser {
	pub email: String,
	pub password: String
}

impl<'a, 'r> FromRequest<'a, 'r> for User {
	type Error = ();

	fn from_request(req: &'a Request<'r>) -> request::Outcome<User, ()> {
		use ::schema::users::dsl::*;
		let conn = match <db::PgSqlConn as FromRequest>::from_request(req) {
			Outcome::Success(conn) => conn,
			_ => return Outcome::Forward(()),
		};

		let user = req.cookies()
			.get_private("user_id")
			.and_then(|cookie| cookie.value().parse::<i32>().ok())
			.map(|user_id| {
				users.find(user_id).get_result(&*conn)
			});

		let user = match user {
			None => return Outcome::Forward(()),
			Some(u) => u,
		};

		match user {
			Err(_) => Outcome::Failure((::rocket::http::Status::NotFound, ())),
			Ok(u) => Outcome::Success(u)
		}
	}
}
