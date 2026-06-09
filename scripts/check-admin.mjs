import { readFileSync } from "fs";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const envText = readFileSync(".env", "utf8");
const get = (key) => envText.match(new RegExp(`${key}="([^"]+)"`))?.[1];

const email = (get("ADMIN_EMAIL") || "admin@blackrockreserve.site").trim().toLowerCase();
const password = get("ADMIN_PASSWORD");

const prisma = new PrismaClient();

const admin = await prisma.user.findUnique({
  where: { email },
  select: { id: true, email: true, role: true, status: true, emailVerified: true, password: true },
});

console.log("Looking up:", email);
console.log("Admin:", {
  found: Boolean(admin),
  role: admin?.role,
  status: admin?.status,
  verified: Boolean(admin?.emailVerified),
  hasPassword: Boolean(admin?.password),
});

if (admin?.password && password) {
  const ok = await bcrypt.compare(password, admin.password);
  console.log("ADMIN_PASSWORD from .env matches:", ok);
}

await prisma.$disconnect();
