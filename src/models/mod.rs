use diesel::prelude::*;
pub mod user;
pub mod scope;
pub mod scope_permission;
pub mod scope_transaction;

pub mod comment;

use db;

#[derive(Debug, Serialize, Deserialize)]
pub struct Batch {
  comments: Vec<comment::Comment>
}

pub fn by_transaction(conn: &db::PgSqlConn, transaction_id: i32) -> Batch {
  use schema::comments;

  Batch {
    comments: comments::table.filter(comments::transaction_id.eq(transaction_id))
      .load::<comment::Comment>(&**conn)
      .expect("Error")
  }
}
