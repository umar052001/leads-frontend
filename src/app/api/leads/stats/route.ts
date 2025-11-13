import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import fs from "fs";
import path from "path";
import Papa from "papaparse";

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const industry = searchParams.get("industry") || "";
    const email_status = searchParams.get("email_status") || "";
    const country = searchParams.get("country") || "";
    const lead_status = searchParams.get("lead_status") || "";

    const filePath = path.join(process.cwd(), "public", "leads.csv");
    const fileContent = fs.readFileSync(filePath, "utf-8");

    const { data } = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
    });

    // Apply same filters
    let filteredData = data;

    if (search) {
      const searchLower = search.toLowerCase();
      filteredData = filteredData.filter(
        (lead: any) =>
          lead.first_name?.toLowerCase().includes(searchLower) ||
          lead.last_name?.toLowerCase().includes(searchLower) ||
          lead.email?.toLowerCase().includes(searchLower) ||
          lead.company?.toLowerCase().includes(searchLower),
      );
    }

    if (industry)
      filteredData = filteredData.filter((l: any) => l.industry === industry);
    if (email_status)
      filteredData = filteredData.filter(
        (l: any) => l.email_status === email_status,
      );
    if (country)
      filteredData = filteredData.filter((l: any) => l.country === country);
    if (lead_status)
      filteredData = filteredData.filter(
        (l: any) => l.lead_status === lead_status,
      );

    const totalLeads = filteredData.length;
    const verifiedEmails = filteredData.filter(
      (l: any) => l.email_status === "Verified",
    ).length;
    const uniqueCompanies = new Set(filteredData.map((l: any) => l.company))
      .size;
    const avgRevenue =
      filteredData.reduce(
        (acc: number, l: any) => acc + (l.annual_revenue || 0),
        0,
      ) / totalLeads;

    return NextResponse.json({
      totalLeads,
      verifiedEmails,
      uniqueCompanies,
      avgRevenue,
    });
  } catch (error) {
    console.error("Stats API error:", error);
    return NextResponse.json(
      { error: "Failed to load stats" },
      { status: 500 },
    );
  }
}
