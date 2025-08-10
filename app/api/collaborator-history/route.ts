import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { getSession } from "@/lib/session"

type TimeEntryRow = {
  id: string
  date: string
  hours_worked: number | null
  overtime_hours: number | null
  balance_hours: number | null
  entry_type: string
  description: string | null
}

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== "collaborator") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 })
  }

  const supabase = createServerClient()

  // Buscar lançamentos do colaborador logado
  const { data, error } = await supabase
    .from("time_entries")
    .select("id, date, hours_worked, overtime_hours, balance_hours, entry_type, description")
    .eq("collaborator_id", session.userId)
    .order("date", { ascending: false })

  if (error) {
    console.error("Erro ao buscar histórico do colaborador:", error.message)
    return NextResponse.json({ error: "Erro ao buscar histórico." }, { status: 500 })
  }

  // Normalizar números para evitar erros de toFixed no front
  const safe = (n: number | null | undefined) => (Number.isFinite(Number(n)) ? Number(n) : 0)

  const result = (data as TimeEntryRow[]).map((row) => ({
    ...row,
    hours_worked: safe(row.hours_worked),
    overtime_hours: safe(row.overtime_hours),
    balance_hours: safe(row.balance_hours),
    description: row.description ?? "",
  }))

  return NextResponse.json({ entries: result })
}
