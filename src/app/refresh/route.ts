import { redirect } from "next/navigation";
import { getOrBuildDataset } from "@/lib/build";

export const maxDuration = 300;

export async function POST() {
  try {
    await getOrBuildDataset(true);
  } catch {
    redirect("/?refreshError=1");
  }
  redirect("/?refreshed=1");
}
