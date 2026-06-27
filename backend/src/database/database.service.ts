export async function dropUsersTable(store: any) {
    const db = store.db;
    await db.query("DROP TABLE IF EXISTS users");
    console.log("users table dropped successfully");
}
export async function createUsersTable(store: any) {
    const db = store.db;
    try {
        const query = "CREATE TABLE IF NOT EXISTS users (\
                 id UUID PRIMARY KEY,\
                 first_name TEXT NOT NULL,\
                 second_name TEXT NULL,\
                 last_name TEXT,\
                 phone TEXT UNIQUE NOT NULL,\
                 hashed_password TEXT NOT NULL,\
                 email TEXT UNIQUE\
                );"
        await db.query(query);
        console.log("database is connected and users table is created");
    } catch (error: any) {
        console.log("database failed to connect and table wasn't created error: ", error.message);
    }
}
export async function alterUsersTable(store: any) {
    const db = store.db;
    try {
        console.log("constraints added successfully");
    } catch (error: any) {
        console.log("database failed to alter and table wasn't changed error: ", error.message);
    }
}
