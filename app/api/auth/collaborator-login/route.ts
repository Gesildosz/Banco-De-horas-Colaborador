import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { createSession } from "@/lib/session"

/**
 * Novo fluxo:
 * - Recebe badgeNumber
 * - Se colaborador existir e estiver ativo:
 *    - Se NÃO possuir access_code => cria sessão com pendingAccessCode: true e responde { needsAccessCode: true }
 *    - Se JÁ possuir access_code => cria sessão normal e responde { needsAccessCode: false }
 */
export async function POST(request: Request) {
  const { badgeNumber } = await request.json()
  if (!badgeNumber) {
    return NextResponse.json({ error: "Número do crachá é obrigatório." }, { status: 400 })
  }

  const supabase = createServerClient()

  try {
    const { data: collaborator, error } = await supabase
      .from("collaborators")
      .select("id, is_active, access_code")
      .eq("badge_number", badgeNumber)
      .single()

    if (error || !collaborator) {
      return NextResponse.json({ error: "Crachá inválido." }, { status: 401 })
    }

    if (collaborator.is_active === false) {
      return NextResponse.json(
        { error: "Sua conta está inativa. Por favor, contate o administrador." },
        { status: 403 },
      )
    }

    // Se ainda não possui código de acesso, direciona para cadastro do código
    if (!collaborator.access_code) {
      await createSession(collaborator.id, "collaborator", { pendingAccessCode: true })
      return NextResponse.json({ message: "Cadastro de código de acesso necessário.", needsAccessCode: true })
    }

    // Já possui código de acesso
    await createSession(collaborator.id, "collaborator")
    return NextResponse.json({ message: "Login bem-sucedido.", needsAccessCode: false })
  } catch (err: any) {
    console.error("Erro no login do colaborador:", err?.message || err)
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 })
  }
}
