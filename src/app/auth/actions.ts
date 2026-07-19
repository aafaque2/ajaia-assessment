"use server";

import { getPrisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export type RegisterResult =
  | { success: true }
  | { success: false; error: string };

export async function registerUser(
  name: string,
  email: string,
  password: string
): Promise<RegisterResult> {
  const trimmedName = name.trim();
  const trimmedEmail = email.trim().toLowerCase();

  if (trimmedName.length < 1) {
    return { success: false, error: "Name is required" };
  }
  if (trimmedEmail.length < 1) {
    return { success: false, error: "Email is required" };
  }
  if (password.length < 6) {
    return { success: false, error: "Password must be at least 6 characters" };
  }

  const db = getPrisma();
  const existing = await db.user.findUnique({
    where: { email: trimmedEmail },
  });

  if (existing) {
    return { success: false, error: "An account with this email already exists" };
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  await db.user.create({
    data: {
      name: trimmedName,
      email: trimmedEmail,
      password: hashedPassword,
    },
  });

  return { success: true };
}
