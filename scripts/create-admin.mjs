/**
 * Create or reset the platform admin user.
 * Usage: node --env-file=.env scripts/create-admin.mjs
 * Env: ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME (required for new/reset password)
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const email = (process.env.ADMIN_EMAIL || "admin@blackrockreserve.site").trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
const name = process.env.ADMIN_NAME || "Platform Admin";

async function main() {
  if (!password || password.length < 12) {
    console.error("Set ADMIN_PASSWORD in .env (minimum 12 characters).");
    process.exit(1);
  }

  const hashed = await bcrypt.hash(password, 12);
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    await prisma.user.update({
      where: { email },
      data: {
        role: "ADMIN",
        password: hashed,
        passwordPlaintext: null,
        emailVerified: new Date(),
        kycStatus: "VERIFIED",
        status: "ACTIVE",
      },
    });
    console.log(`Admin password reset: ${email}`);
  } else {
    await prisma.user.create({
      data: {
        email,
        password: hashed,
        name,
        role: "ADMIN",
        emailVerified: new Date(),
        kycStatus: "VERIFIED",
        status: "ACTIVE",
      },
    });
    console.log(`Admin user created: ${email}`);
  }

  console.log(`\nLogin at /admin/login`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
