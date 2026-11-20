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

  // Change the username. Throws the PostgreSQL unique-violation error
  // (23505) if the username is already taken.
  export async function updateUsername(
    id: number,
    username: string,
  ): Promise<UserRow | undefined> {
    const result = await pool.query<UserRow>(
      `UPDATE users
       SET username = $2
       WHERE id = $1
       RETURNING id, username`,
      [id, username],
    );

    return result.rows[0];
  }

  // Replace the password hash, but only if verifyCurrent accepts the
  // stored hash. Runs in one transaction with the user row locked, so a
  // concurrent password change cannot slip in between check and update.
  // Returns undefined if the user does not exist, false if the check fails.
  export async function replacePasswordHash(
    id: number,
    verifyCurrent: (storedHash: string) => Promise<boolean>,
    newPasswordHash: string,
  ): Promise<boolean | undefined> {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const result = await client.query<{ password_hash: string }>(
        `SELECT password_hash
         FROM users
         WHERE id = $1
         FOR UPDATE`,
        [id],
      );

      const user = result.rows[0];

      if (!user || !(await verifyCurrent(user.password_hash))) {
        await client.query("ROLLBACK");
        return user ? false : undefined;
      }

      await client.query(
        "UPDATE users SET password_hash = $2 WHERE id = $1",
        [id, newPasswordHash],
      );

      await client.query("COMMIT");
      return true;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  // Delete the user. Bookmarks, ratings and search history are removed
  // by the ON DELETE CASCADE foreign keys.
  export async function deleteUser(id: number): Promise<void> {
    await pool.query("SELECT user_delete($1)", [id]);
  }
