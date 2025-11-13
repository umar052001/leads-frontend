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
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search") || "";
    const industry = searchParams.get("industry") || "";
    const email_status = searchParams.get("email_status") || "";
    const country = searchParams.get("country") || "";
    const lead_status = searchParams.get("lead_status") || "";

    // Read CSV file
    const filePath = path.join(process.cwd(), "public", "leads.csv");
    const fileContent = fs.readFileSync(filePath, "utf-8");

    const { data } = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
    });

    // Filter data
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

    if (industry) {
      filteredData = filteredData.filter(
        (lead: any) => lead.industry === industry,
      );
    }

    if (email_status) {
      filteredData = filteredData.filter(
        (lead: any) => lead.email_status === email_status,
      );
    }

    if (country) {
      filteredData = filteredData.filter(
        (lead: any) => lead.country === country,
      );
    }

    if (lead_status) {
      filteredData = filteredData.filter(
        (lead: any) => lead.lead_status === lead_status,
      );
    }

    const total = filteredData.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = filteredData.slice(startIndex, endIndex);

    return NextResponse.json({ data: paginatedData, total });
  } catch (error) {
    console.error("Leads API error:", error);
    return NextResponse.json(
      { error: "Failed to load leads" },
      { status: 500 },
    );
  }
}
