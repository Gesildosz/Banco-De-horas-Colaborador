"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function SetupAccessCodePage() {
  const [accessCode, setAccessCode] = useState("")
  const [confirmAccessCode, setConfirmAccessCode] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (accessCode !== confirmAccessCode) {
      toast({ title: "Erro", description: "Os códigos informados não conferem." })
      return
    }
    if (accessCode.trim().length < 4) {
      toast({ title: "Erro", description: "O código de acesso deve ter pelo menos 4 caracteres." })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/collaborator/set-access-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessCode, confirmAccessCode }),
      })
      const data = await response.json()
      if (response.ok) {
        toast({ title: "Sucesso", description: "Código de acesso cadastrado!" })
        router.push("/collaborator")
      } else {
        toast({ title: "Erro", description: data.error || "Falha ao cadastrar o código de acesso." })
      }
    } catch (error) {
      console.error("Erro ao cadastrar código de acesso:", error)
      toast({ title: "Erro", description: "Ocorreu um erro inesperado." })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-950 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl">Cadastrar Código de Acesso</CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link href="/login">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Detectamos que este é seu primeiro acesso. Crie seu código para proteger sua conta.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="access-code">Código de Acesso</Label>
              <Input
                id="access-code"
                type="password"
                placeholder="Mínimo de 4 caracteres"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-access-code">Confirmar Código de Acesso</Label>
              <Input
                id="confirm-access-code"
                type="password"
                placeholder="Repita o código"
                value={confirmAccessCode}
                onChange={(e) => setConfirmAccessCode(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Salvando..." : "Cadastrar Código"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
