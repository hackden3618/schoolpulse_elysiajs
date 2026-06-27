import bcrypt from 'bcrypt';

export async function listAllUsers(store: any) {
    const result = await store.db.query("SELECT * FROM users WHERE status != 'active'");
    return result.rows;

}
const hash = async (password: string) => {
    const saltrounds = 10;
    const hash = await bcrypt.hash(password, saltrounds);
    return hash
}

const verify = async (password: string, hash: string) => {
    const matches: boolean = await bcrypt.compare(password, hash);
    return matches;
}

export async function postNewUser(store: any, body: any) {
    const id = crypto.randomUUID();
    const { first_name, second_name, last_name, phone, password, email } = body;
    const hashedPassword = await hash(password);
    try {
        const query = "\
        INSERT INTO users (\
        id, first_name, second_name, last_name, phone, hashed_password, email\
        ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *";
        const values = [id, first_name, second_name, last_name, phone, hashedPassword, email];
        const result = await store.db.query(query, values);
        return ({
            message: `user has been created with ID: ${result.rows[0].id}`,
            body: result.rows
        })
    } catch (error: any) {
        return ({ status: 500, message: "Error creating user", body: error.message })
    }
}
