import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const users = [
  { email: "alice@example.com", name: "Alice", password: "password123" },
  { email: "bob@example.com", name: "Bob", password: "password123" },
];

async function main() {
  const prisma = new PrismaClient();

  for (const userData of users) {
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        email: userData.email,
        name: userData.name,
        password: hashedPassword,
      },
    });
    console.log(`Created user: ${user.email} / ${userData.password}`);
  }

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  process.exit(1);
});
