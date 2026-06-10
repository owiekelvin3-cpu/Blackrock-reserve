import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const password = process.env.ADMIN_PASSWORD;

const admins = await prisma.user.findMany({
  where: { role: "ADMIN" },
  select: { email: true, emailVerified: true, status: true, password: true },
});

for (const admin of admins) {
  const hasPassword = Boolean(admin.password);
  let passwordOk = false;
  if (hasPassword && password) {
    passwordOk = await bcrypt.compare(password, admin.password);
  }
  console.log({
    email: admin.email,
    hasPassword,
    passwordOk,
    verified: Boolean(admin.emailVerified),
    status: admin.status,
  });
}

await prisma.$disconnect();
