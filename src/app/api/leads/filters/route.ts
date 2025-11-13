import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import fs from "fs";
import path from "path";
import Papa from "papaparse";

export async function GET() {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const filePath = path.join(process.cwd(), "public", "leads.csv");
    const fileContent = fs.readFileSync(filePath, "utf-8");

    const { data } = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
    });

    const industries = [
      ...new Set(data.map((l: any) => l.industry).filter(Boolean)),
    ].sort();
    const statuses = [
      ...new Set(data.map((l: any) => l.email_status).filter(Boolean)),
    ].sort();
    const countries = [
      ...new Set(data.map((l: any) => l.country).filter(Boolean)),
    ].sort();
    const leadStatuses = [
      ...new Set(data.map((l: any) => l.lead_status).filter(Boolean)),
    ].sort();

    return NextResponse.json({ industries, statuses, countries, leadStatuses });
  } catch (error) {
    console.error("Filter API error:", error);
    return NextResponse.json(
      { error: "Failed to load filters" },
      { status: 500 },
    );
  }
}
