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
                 fname TEXT NOT NULL,\
                 sname TEXT,\
                 lname TEXT,\
                 phone TEXT NOT NULL,\
                 schoolID TEXT,\
                 hashPwd TEXT NOT NULL,\
                 email TEXT\
                );"
        db.query(query);
        console.log("database is connected and users table is created");
    } catch (error: any) {
        return ({ status: 500, message: "Error creating table", body: error.message })
    }
}
