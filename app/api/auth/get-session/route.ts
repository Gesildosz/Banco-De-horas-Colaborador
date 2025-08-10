import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"

export async function GET() {
  const session = await getSession()

  if (!session) {
    return NextResponse.json({ error: "Nenhuma sessão ativa." }, { status: 401 })
  }

  return NextResponse.json({ userId: session.userId, role: session.role })
}
