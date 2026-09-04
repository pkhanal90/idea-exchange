"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function attestAccreditationAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) return;

  const attested = formData.get("attested") === "on";

  await prisma.user.update({
    where: { id: session.user.id },
    data: attested
      ? { accreditationStatus: "SELF_ATTESTED", accreditationAttestedAt: new Date() }
      : { accreditationStatus: "UNSUBMITTED", accreditationAttestedAt: null },
  });

  revalidatePath("/dashboard/investor/accreditation");
}
