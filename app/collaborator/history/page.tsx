"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatBrazilianDate } from "@/utils/date-helpers"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

interface TimeEntry {
  id: string
  date: string | null
  hours_worked: number | null
  overtime_hours: number | null
  balance_hours: number | null // impacto no saldo para ESTE lançamento
  entry_type: string
  description: string | null
  created_at: string
}

const toNumber = (v: unknown, fallback = 0) => {
  const n = typeof v === "number" ? v : v == null ? Number.NaN : Number(v)
  return Number.isFinite(n) ? n : fallback
}

export default function CollaboratorHistoryPage() {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true)
      try {
        const sessionRes = await fetch("/api/auth/get-session")
        if (!sessionRes.ok) {
          toast({ title: "Erro", description: "Sessão expirada ou inválida. Por favor, faça login novamente." })
          router.push("/login")
          return
        }
        const sessionData = await sessionRes.json()

        if (sessionData.role !== "collaborator") {
          toast({ title: "Erro", description: "Acesso negado. Você não é um colaborador." })
          router.push("/login")
          return
        }

        const response = await fetch("/api/collaborator-history")
        if (response.ok) {
          const data = await response.json()
          // Normaliza os números para evitar undefined/null no render
          const safeEntries: TimeEntry[] = (data.timeEntries || []).map((e: any) => ({
            id: String(e.id),
            date: e.date ?? null,
            hours_worked: e.hours_worked ?? null,
            overtime_hours: e.overtime_hours ?? null,
            balance_hours: e.balance_hours ?? null,
            entry_type: String(e.entry_type ?? ""),
            description: e.description ?? null,
            created_at: String(e.created_at ?? new Date().toISOString()),
          }))
          setTimeEntries(safeEntries)
        } else {
          const errorData = await response.json()
          toast({ title: "Erro", description: errorData.error || "Falha ao carregar histórico de horas." })
          console.error("Error fetching collaborator history:", errorData)
        }
      } catch (error) {
        console.error("Erro ao buscar histórico de horas:", error)
        toast({ title: "Erro", description: "Ocorreu um erro inesperado ao carregar o histórico." })
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [router])

  const getEntryTypeLabel = (type: string) => {
    switch (type) {
      case "positive":
        return "Positivo"
      case "negative":
        return "Negativo"
      case "overtime":
        return "Extra"
      case "adjustment":
        return "Ajuste"
      default:
        return type
    }
  }

  const getBalanceColor = (balance?: number | null) => {
    const b = toNumber(balance, 0)
    if (b > 0) return "text-green-600"
    if (b < 0) return "text-red-600"
    return "text-gray-500"
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-950">
        <p>Carregando histórico...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-100 p-4 dark:bg-gray-950">
      <Card className="w-full max-w-4xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl whitespace-normal">Histórico de Lançamentos de Horas</CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link href="/collaborator">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {timeEntries.length === 0 ? (
            <p className="text-muted-foreground">Nenhum lançamento de horas encontrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Horas</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Impacto no Saldo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timeEntries.map((entry) => {
                    const hours = toNumber(entry.hours_worked ?? entry.overtime_hours, 0)
                    const balance = toNumber(entry.balance_hours, 0)
                    return (
                      <TableRow key={entry.id}>
                        <TableCell>{entry.date ? formatBrazilianDate(entry.date) : "—"}</TableCell>
                        <TableCell>{getEntryTypeLabel(entry.entry_type)}</TableCell>
                        <TableCell>{hours.toFixed(2)}</TableCell>
                        <TableCell className="max-w-[250px] truncate">{entry.description || "N/A"}</TableCell>
                        <TableCell className={`text-right font-semibold ${getBalanceColor(balance)}`}>
                          {balance > 0 ? "+" : ""}
                          {balance.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
