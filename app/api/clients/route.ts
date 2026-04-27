import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/jwt";
import { createClientSchema } from "@/validations/client";

// 고객 목록 조회
export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "admin") {
    return NextResponse.json({ error: "관리자만 조회할 수 있습니다" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const facilityCategory = searchParams.get("facilityCategory") || "";
  const facilityType = searchParams.get("facilityType") || "";
  const activeParam = searchParams.get("active");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "12");
  const offset = (page - 1) * limit;

  const supabase = getSupabase();
  let query = supabase
    .from("clients")
    .select("*", { count: "exact" })
    .eq("tenant_id", session.tenantId)
    .order("is_active", { ascending: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.or(`name.ilike.%${search}%,contact_name.ilike.%${search}%`);
  }
  if (facilityCategory) {
    query = query.eq("facility_category", facilityCategory);
  }
  if (facilityType) {
    query = query.eq("facility_type", facilityType);
  }
  if (activeParam === "true") {
    query = query.eq("is_active", true);
  }

  const { data, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    clients: data || [],
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit),
  });
}

// 고객 등록
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "admin") {
    return NextResponse.json({ error: "관리자만 등록할 수 있습니다" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createClientSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { name, facilityCategory, facilityType, area, areaPyeong, volume, address, contactName, contactPhone, contactPosition, contactEmail } = parsed.data;
  const finalFacilityType = facilityCategory === "mandatory" ? (facilityType ?? null) : null;
  const now = new Date().toISOString();
  const supabase = getSupabase();

  // 고객 코드 채번
  const { data: lastClient } = await supabase
    .from("clients")
    .select("code")
    .eq("tenant_id", session.tenantId)
    .order("code", { ascending: false })
    .limit(1)
    .single();

  let nextCode = "C00001";
  if (lastClient?.code) {
    const currentNum = parseInt(lastClient.code.replace("C", ""), 10);
    nextCode = `C${String(currentNum + 1).padStart(5, "0")}`;
  }

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .insert({
      tenant_id: session.tenantId,
      code: nextCode,
      name,
      facility_category: facilityCategory,
      facility_type: finalFacilityType,
      area: area || null,
      area_pyeong: areaPyeong || null,
      volume: volume || null,
      address: address || null,
      contact_name: contactName || null,
      contact_phone: contactPhone || null,
      contact_position: contactPosition || null,
      contact_email: contactEmail || null,
      created_at: now,
      updated_at: now,
    })
    .select("id")
    .single();

  if (clientError || !client) {
    return NextResponse.json({ error: "고객 등록에 실패했습니다" }, { status: 500 });
  }

  return NextResponse.json({ id: client.id }, { status: 201 });
}
