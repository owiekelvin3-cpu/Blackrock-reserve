import { spawn, execSync } from "node:child_process";

function runDevServer() {
  return new Promise((resolve, reject) => {
    const child = spawn("npx next dev", {
      stdio: "inherit",
      shell: true,
    });
    child.on("exit", (code) => {
      if (code === 0) resolve(0);
      else reject(new Error(`next dev exited with code ${code}`));
    });
    child.on("error", reject);
  });
}

function isPrismaLockError(error) {
  const text = [
    error?.message,
    error?.stderr?.toString?.(),
    error?.stdout?.toString?.(),
  ]
    .filter(Boolean)
    .join(" ");
  return text.includes("EPERM") || text.includes("operation not permitted");
}

try {
  execSync("npx prisma@5.22.0 generate", { stdio: "pipe" });
} catch (error) {
  if (isPrismaLockError(error)) {
    console.warn(
      "Prisma generate skipped (client file locked). Stop other Node processes if you changed the schema."
    );
  } else {
    const stderr = error?.stderr?.toString?.() ?? "";
    const stdout = error?.stdout?.toString?.() ?? "";
    if (stdout) process.stdout.write(stdout);
    if (stderr) process.stderr.write(stderr);
    throw error;
  }
}

try {
  execSync("node scripts/apply-deposit-proof-image.mjs", { stdio: "inherit" });
} catch {
  console.warn("Deposit proof image migration skipped.");
}

try {
  execSync("node scripts/apply-physical-cards-schema.mjs", { stdio: "inherit" });
} catch {
  console.warn("Physical cards schema migration skipped.");
}

await runDevServer();
