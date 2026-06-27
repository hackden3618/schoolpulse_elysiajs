// schools
export async function createSchoolsTable(store: any) {
    const db = store.db;
    try {
        const query = `
            CREATE TABLE IF NOT EXISTS schools (
                id UUID PRIMARY KEY,
                school_name TEXT NOT NULL,
                school_phone TEXT NOT NULL,
                school_address TEXT NULL,
                school_logo TEXT NULL,
                school_email TEXT NULL,
                school_website TEXT NULL,
                post_office TEXT NULL,
                streams JSONB[] NOT NULL,
                subscription_status subscription_status DEFAULT 'trial' NOT NULL,
                subscription_type subscription_type DEFAULT 'free' NOT NULL,
                subscription_start_date TIMESTAMPTZ NULL,
                subscription_end_date TIMESTAMPTZ NULL,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
                updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
            );
        `;
        await db.query(query);
        console.log("Schools table created successfully");
    } catch (error: any) {
        console.error("Failed to create schools table error: ", error.message);
    }
}

// users
export async function dropUsersTable(store: any) {
    const db = store.db;
    await db.query("DROP TABLE IF EXISTS users");
    console.log("Users table dropped successfully");
}

export async function createUsersTable(store: any) {
    const db = store.db;
    try {
        const query = `
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY,
                first_name TEXT NOT NULL,
                second_name TEXT NULL,
                last_name TEXT,
                phone TEXT UNIQUE NOT NULL,
                hashed_password TEXT NOT NULL,
                email TEXT UNIQUE,
                status user_status DEFAULT 'active' NOT NULL,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
                updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
            );
        `;
        await db.query(query);
        console.log("Database connected and users table is created");
    } catch (error: any) {
        console.error("Database failed to connect and table wasn't created error: ", error.message);
    }
}

// students
export async function createStudentsTable(store: any) {
    const db = store.db;
    try {
        const query = `CREATE TABLE IF NOT EXISTS students (
                id UUID PRIMARY KEY,
                date_of_birth DATE NOT NULL,
                admission_number TEXT NOT NULL,
                class_id UUID NOT NULL,
                school_id UUID NOT NULL,
                first_name TEXT NOT NULL,
                second_name TEXT NULL,
                last_name TEXT NOT NULL,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
                updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
                FOREIGN KEY (class_id) REFERENCES classes(id),
                FOREIGN KEY (school_id) REFERENCES schools(id)
        )`;
        await db.query(query);
        console.log("SUCCESS: Students table created successfully");

    } catch (error: any) {
        console.log("ERROR: Students table failed to create error: ", error.message);
    }
}

// classes
export async function createClassesTable(store: any) {
    const db = store.db;
    try {
        const query = `CREATE TABLE IF NOT EXISTS classes (
            id UUID PRIMARY KEY,
            class_name TEXT NOT NULL,
            class_teacher TEXT NOT NULL,
            class_level TEXT NOT NULL,
            school_id UUID NOT NULL,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
            FOREIGN KEY (school_id) REFERENCES schools(id)
        )`;
        await db.query(query);
        console.log("SUCCESS: Classes table created successfully");

    } catch (error: any) {
        console.log("ERROR: Classes table failed to create error: ", error.message);
    }
}

// Everything needed to be done
export async function createTables(store: any) {
    const db = store.db;
    try {
        // 1. Create Enum Types Safely
        await db.query(`
            DO $$ BEGIN
                CREATE TYPE subscription_status AS ENUM ('trial', 'active', 'cancelled', 'suspended', 'defaulted', 'terminated');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        await db.query(`
            DO $$ BEGIN
                CREATE TYPE user_status AS ENUM ('active', 'on_leave', 'suspended', 'defaulted', 'terminated');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        await db.query(`
            DO $$ BEGIN
                CREATE TYPE subscription_type AS ENUM ('free', 'monthly', 'termly', 'yearly');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        // 2. Create the Trigger Function (Idempotent)
        // We use CREATE OR REPLACE so it doesn't error if it already exists
        await db.query(`
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = NOW();
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `);

        // 3. Create Tables
        await createSchoolsTable(store);
        await createUsersTable(store);
        await createStudentsTable(store);
        await createClassesTable(store);

        // 4. Create Triggers for each table
        // We check if trigger exists to avoid errors on re-runs if possible, 
        // though dropping and recreating is often safer in migration scripts.

        await db.query(`
            DROP TRIGGER IF EXISTS set_schools_updated_at ON schools;
            CREATE TRIGGER set_schools_updated_at
            BEFORE UPDATE ON schools
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        `);

        await db.query(`
            DROP TRIGGER IF EXISTS set_users_updated_at ON users;
            CREATE TRIGGER set_users_updated_at
            BEFORE UPDATE ON users
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        `);

        await db.query(`
            DROP TRIGGER IF EXISTS set_students_updated_at ON students;
            CREATE TRIGGER set_students_updated_at
            BEFORE UPDATE ON students
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        `);

        console.log("All tables, types, and auto-update triggers initialized successfully");
    } catch (error: any) {
        console.error("ERROR: Something went wrong creating the tables error: ", error.message);
        throw error;
    }
}   
