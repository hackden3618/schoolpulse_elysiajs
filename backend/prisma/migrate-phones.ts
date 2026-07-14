import { prisma } from "../src/infrastructure/database/prisma"

async function migrate() {
  const users = await prisma.user.findMany({ where: { phone: { startsWith: "+" } }, select: { id: true, phone: true } })
  for (const u of users) {
    const stripped = u.phone.slice(1)
    console.log(`User ${u.id}: ${u.phone} -> ${stripped}`)
    await prisma.user.update({ where: { id: u.id }, data: { phone: stripped } })
  }

  const joinRequests = await prisma.joinRequest.findMany({ where: { phone: { startsWith: "+" } }, select: { id: true, phone: true } })
  for (const j of joinRequests) {
    const stripped = j.phone.slice(1)
    console.log(`JoinRequest ${j.id}: ${j.phone} -> ${stripped}`)
    await prisma.joinRequest.update({ where: { id: j.id }, data: { phone: stripped } })
  }

  const admins = await prisma.platformAdmin.findMany({ where: { phone: { startsWith: "+" } }, select: { id: true, phone: true } })
  for (const a of admins) {
    const stripped = a.phone.slice(1)
    console.log(`PlatformAdmin ${a.id}: ${a.phone} -> ${stripped}`)
    await prisma.platformAdmin.update({ where: { id: a.id }, data: { phone: stripped } })
  }

  console.log("Done")
  process.exit(0)
}

migrate().catch((e) => { console.error(e); process.exit(1) })
