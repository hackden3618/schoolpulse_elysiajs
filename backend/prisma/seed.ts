import { prisma } from "../src/infrastructure/database/prisma"
import { hashPassword } from "../src/common/auth"

async function main() {
    console.log("Seeding database...")

    // Roles (school-level only; Platform Admin is handled via PlatformAdmin model)
    const roleNames = [
        "Principal",
        "Deputy Principal",
        "Academic Master",
        "Super Admin",
        "Bursar",
        "Teacher",
        "Admissions",
        "Reception",
        "Guardian",
    ] as const

    const roles = await Promise.all(
        roleNames.map((name) =>
            prisma.role.upsert({
                where: { name },
                create: { name, description: `${name} role`, permissions: [] },
                update: {},
            })
        )
    )

    const roleMap = Object.fromEntries(roles.map((r) => [r.name, r.id]))

    // PlatformAdmin super_admin (SchoolPulse internal)
    const platformPhone = "+254757030743"
    const platformEmail = "mainadenniswambugu@gmail.com"
    const platformPassword = await hashPassword("admin123")
    await prisma.platformAdmin.upsert({
        where: { email: platformEmail },
        create: {
            firstName: "Dennis",
            lastName: "Maina",
            email: platformEmail,
            phone: platformPhone,
            role: "super_admin",
            hashedPassword: platformPassword,
            status: "active",
        },
        update: {},
    })

    console.log("Seed completed successfully!")
    console.log(`  Roles: ${roles.length} created`)
    console.log(`  Platform Admin: ${platformEmail} / admin123`)
}

main()
    .catch((e) => {
        console.error("Seed failed:", e)
        process.exit(1)
    })
    .finally(() => prisma.$disconnect())
