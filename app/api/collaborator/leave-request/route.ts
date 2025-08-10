import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { getSession } from "@/lib/session"

export async function POST(request: Request) {
  const session = await getSession()
  if (!session || session.role !== "collaborator") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 })
  }

  const { start_date, end_date, reason } = await request.json()
  const supabase = createServerClient()

  if (!start_date || !end_date || !reason) {
    return NextResponse.json({ error: "Data de início, data de término e motivo são obrigatórios." }, { status: 400 })
  }

  try {
    const { data, error } = await supabase.from("leave_requests").insert([
      {
        collaborator_id: session.userId,
        start_date,
        end_date,
        reason,
        status: "pending", // Default status
      },
    ])

    if (error) {
      console.error("Erro ao criar solicitação de folga:", error.message)
      return NextResponse.json({ error: "Falha ao enviar solicitação de folga." }, { status: 500 })
    }

    return NextResponse.json({ message: "Solicitação de folga enviada com sucesso.", request: data })
  } catch (error: any) {
    console.error("Erro interno do servidor ao enviar solicitação de folga:", error.message)
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 })
  }
}
