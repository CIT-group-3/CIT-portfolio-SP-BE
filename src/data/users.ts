import { pool } from "../db.js";

export interface UserRow {
  id: number;
  username: string;
}

export async function createUser(
  username: string,
  passwordHash: string,
): Promise<UserRow> {
  const result = await pool.query<UserRow>(
    `INSERT INTO users (username, password_hash)
     VALUES ($1, $2)
     RETURNING id, username`,
    [username, passwordHash],
  );

  const user = result.rows[0];

  if (!user) {
    throw new Error("User creation returned no result");
  }

  return user;
}


export interface UserWithPasswordHash extends UserRow {
    password_hash: string;
  }

  export async function findUserByUsername(
    username: string,
  ): Promise<UserWithPasswordHash | undefined> {
    const result = await pool.query<UserWithPasswordHash>(
      `SELECT id, username, password_hash
       FROM users
       WHERE username = $1`,
      [username],
    );

    return result.rows[0];
  }

  export async function findUserById(
    id: number,
  ): Promise<UserRow | undefined> {
    const result = await pool.query<UserRow>(
      `SELECT id, username
       FROM users
       WHERE id = $1`,
      [id],
    );

    return result.rows[0];
  }
