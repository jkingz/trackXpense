import { toErrorMessage } from "@/actions/lib";
import { seedTransactions } from "@/actions/seed";

export async function GET() {
  try {
    const result = await seedTransactions();
    return Response.json(result);
  } catch (error) {
    return Response.json({ success: false, error: toErrorMessage(error) });
  }
}
