import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateLFTID } from "@/lib/utils/lftid";

// GET /api/lftid — generate a unique LFTID (authenticated)
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Generate until unique (collision probability is negligible but we check anyway)
  let lftid: string;
  let attempts = 0;
  do {
    lftid = generateLFTID("LFT");
    const { count } = await supabase
      .from("persons")
      .select("id", { count: "exact", head: true })
      .eq("lftid", lftid);
    if (count === 0) break;
    attempts++;
  } while (attempts < 10);

  return NextResponse.json({ lftid });
}
