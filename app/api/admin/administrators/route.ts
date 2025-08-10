import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { getSession } from "@/lib/session"

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 })
    }

    const supabase = createServerClient()
    // Seleciona apenas colunas que existem
    const { data, error } = await supabase
      .from("administrators")
      .select(
        `
        id,
        full_name,
        username,
        can_create_collaborator,
        can_create_admin,
        can_enter_hours,
        can_change_access_code
      `,
      )
      .order("full_name", { ascending: true })

    if (error) {
      console.error("Erro ao listar administradores:", error.message)
      return NextResponse.json({ error: "Falha ao carregar administradores." }, { status: 500 })
    }

    return NextResponse.json(data ?? [])
  } catch (err: any) {
    console.error("Erro interno ao listar administradores:", err?.message || err)
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 })
  }
}
