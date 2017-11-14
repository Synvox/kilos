#![feature(plugin)]
#![feature(proc_macro)]
#![plugin(rocket_codegen)]

extern crate rocket;
#[macro_use] extern crate diesel;
#[macro_use] extern crate diesel_codegen;
#[macro_use] extern crate rocket_contrib;
#[macro_use] extern crate serde_derive;

extern crate maud;
extern crate dotenv;
extern crate r2d2;
extern crate r2d2_diesel;

mod db;
mod actions;
mod routes;
mod schema;
mod models;

fn main() {
	use db;
	use routes;

	let conn = db::establish_connection();
	routes::rocket(conn).launch();
}
