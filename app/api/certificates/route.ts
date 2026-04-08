import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/jwt";

// 증명서 목록 조회
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("certificates")
    .select(`
      id, certificate_number, pdf_url, created_at,
      visits(id, scheduled_date, method, clients(id, name, facility_type))
    `)
    .eq("tenant_id", session.tenantId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ certificates: data || [] });
}
