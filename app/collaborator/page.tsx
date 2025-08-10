"use client"

import Link from "next/link"

import { Separator } from "@/components/ui/separator"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"
import { formatBrazilianDate } from "@/utils/date-helpers"
import { CountdownTimer } from "@/components/countdown-timer"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Bell, CalendarCheck, History, Megaphone } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface CollaboratorData {
  id: string
  full_name: string
  badge_number: string
  balance_hours: number
  direct_leader: string | null
}

interface TimeBankPeriod {
  id: string
  start_date: string
  end_date: string
  is_active: boolean
  admin_id: string | null
  created_at: string
  updated_at: string
}

interface Notification {
  id: string
  message: string
  created_at: string
  is_read: boolean
}

export default function CollaboratorDashboardPage() {
  const [collaborator, setCollaborator] = useState<CollaboratorData | null>(null)
  const [currentPeriod, setCurrentPeriod] = useState<TimeBankPeriod | null>(null)
  const [announcement, setAnnouncement] = useState<{ content: string; created_at: string | null } | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmittingLeaveRequest, setIsSubmittingLeaveRequest] = useState(false)
  const [leaveStartDate, setLeaveStartDate] = useState("")
  const [leaveEndDate, setLeaveEndDate] = useState("")
  const [leaveReason, setLeaveReason] = useState("")
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false)

  const router = useRouter()

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications/collaborator")
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications)
        setHasUnreadNotifications(data.notifications.some((n: Notification) => !n.is_read))
      } else {
        console.error("Falha ao carregar notificações:", await response.json())
      }
    } catch (error) {
      console.error("Erro ao buscar notificações:", error)
    }
  }, [])

  const markNotificationsAsRead = useCallback(async () => {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id)
    if (unreadIds.length === 0) return

    try {
      const response = await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds: unreadIds }),
      })

      if (response.ok) {
        toast({ title: "Sucesso", description: "Notificações marcadas como lidas." })
        fetchNotifications() // Re-fetch to update UI
      } else {
        toast({ title: "Erro", description: "Falha ao marcar notificações como lidas." })
      }
    } catch (error) {
      console.error("Erro ao marcar notificações como lidas:", error)
      toast({ title: "Erro", description: "Ocorreu um erro inesperado." })
    }
  }, [notifications, fetchNotifications])

  useEffect(() => {
    const fetchData = async () => {
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

        // Fetch collaborator data
        const collabRes = await fetch("/api/collaborator-data")
        if (collabRes.ok) {
          const collabData = await collabRes.json()
          setCollaborator(collabData)
        } else {
          const errorData = await collabRes.json()
          toast({ title: "Erro", description: errorData.error || "Falha ao carregar dados do colaborador." })
          router.push("/login")
          return
        }

        // Fetch current time bank period
        const periodRes = await fetch("/api/admin/time-bank-period") // Reusing admin endpoint for simplicity
        if (periodRes.ok) {
          const periodData = await periodRes.json()
          setCurrentPeriod(periodData)
        } else {
          console.error("Falha ao carregar período do banco de horas:", await periodRes.json())
        }

        // Fetch current announcement
        const announcementRes = await fetch("/api/collaborator/announcement")
        if (announcementRes.ok) {
          const announcementData = await announcementRes.json()
          if (announcementData && announcementData.content) {
            setAnnouncement(announcementData)
          }
        } else {
          console.error("Falha ao carregar aviso:", await announcementRes.json())
        }

        // Fetch notifications
        await fetchNotifications()
      } catch (error) {
        console.error("Erro ao carregar dados do painel do colaborador:", error)
        toast({ title: "Erro", description: "Ocorreu um erro inesperado ao carregar o painel." })
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Set up polling for notifications
    const notificationPollingInterval = setInterval(fetchNotifications, 30000) // Poll every 30 seconds
    return () => clearInterval(notificationPollingInterval)
  }, [router, fetchNotifications])

  const handleLogout = async () => {
    const response = await fetch("/api/auth/logout", { method: "POST" })
    if (response.ok) {
      router.push("/login")
    } else {
      toast({ title: "Erro", description: "Falha ao fazer logout." })
    }
  }

  const handleLeaveRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmittingLeaveRequest(true)

    if (!leaveStartDate || !leaveEndDate || !leaveReason) {
      toast({ title: "Erro", description: "Por favor, preencha todos os campos da solicitação de folga." })
      setIsSubmittingLeaveRequest(false)
      return
    }

    if (new Date(leaveStartDate) > new Date(leaveEndDate)) {
      toast({ title: "Erro", description: "A data de início não pode ser posterior à data de término." })
      setIsSubmittingLeaveRequest(false)
      return
    }

    try {
      const response = await fetch("/api/collaborator/leave-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start_date: leaveStartDate,
          end_date: leaveEndDate,
          reason: leaveReason,
        }),
      })

      if (response.ok) {
        toast({ title: "Sucesso", description: "Solicitação de folga enviada com sucesso!" })
        setLeaveStartDate("")
        setLeaveEndDate("")
        setLeaveReason("")
      } else {
        const errorData = await response.json()
        toast({ title: "Erro", description: errorData.error || "Falha ao enviar solicitação de folga." })
      }
    } catch (error) {
      console.error("Erro ao enviar solicitação de folga:", error)
      toast({ title: "Erro", description: "Ocorreu um erro inesperado." })
    } finally {
      setIsSubmittingLeaveRequest(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-950">
        <p>Carregando painel...</p>
      </div>
    )
  }

  if (!collaborator) {
    return null
  }

  const balanceColor =
    collaborator.balance_hours > 0
      ? "text-green-600"
      : collaborator.balance_hours < 0
        ? "text-red-600"
        : "text-gray-500"

  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-100 p-4 dark:bg-gray-950">
      <Card className="w-full max-w-4xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl">Painel do Colaborador</CardTitle>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className={hasUnreadNotifications ? "text-red-500" : "text-green-500"} />
                  {hasUnreadNotifications && (
                    <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-background" />
                  )}
                  <span className="sr-only">Notificações</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notificações</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <DropdownMenuItem key={notification.id} className="flex flex-col items-start">
                      <p className="text-sm font-medium">{notification.message}</p>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(notification.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </span>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <DropdownMenuItem className="text-muted-foreground">Nenhuma notificação nova.</DropdownMenuItem>
                )}
                {notifications.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={markNotificationsAsRead} className="justify-center text-primary">
                      Marcar todas como lidas
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Sair
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          <p className="text-lg">Bem-vindo, {collaborator.full_name}!</p>

          {/* Announcement Card */}
          {announcement?.content && (
            <Card className="border-l-4 border-blue-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-600">
                  <Megaphone className="h-5 w-5" /> Aviso Importante
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-base">{announcement.content}</p>
                {announcement.created_at && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Publicado em: {format(new Date(announcement.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Balance and Period Overview */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Seu Saldo de Horas</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className={`text-5xl font-bold ${balanceColor}`}>{collaborator.balance_hours.toFixed(2)}</p>
                <p className="text-lg text-muted-foreground">horas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Período Atual do Banco de Horas</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-2">
                {currentPeriod ? (
                  <>
                    <p className="text-lg">
                      De: <span className="font-semibold">{formatBrazilianDate(currentPeriod.start_date)}</span>
                    </p>
                    <p className="text-lg">
                      Até: <span className="font-semibold">{formatBrazilianDate(currentPeriod.end_date)}</span>
                    </p>
                    <div className="mt-4">
                      <h3 className="text-md font-semibold">Tempo Restante:</h3>
                      <CountdownTimer targetDate={currentPeriod.end_date} />
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground">Nenhum período ativo definido.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Quick Actions */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Link href="/collaborator/history" className="block">
              <Card className="flex flex-col items-center justify-center p-6 text-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <History className="h-10 w-10 text-primary mb-3" />
                <h3 className="text-lg font-semibold">Ver Histórico de Horas</h3>
                <p className="text-sm text-muted-foreground">Consulte todos os seus lançamentos de horas.</p>
              </Card>
            </Link>
            <Card className="flex flex-col items-center justify-center p-6 text-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <CalendarCheck className="h-10 w-10 text-primary mb-3" />
              <h3 className="text-lg font-semibold">Solicitar Folga</h3>
              <p className="text-sm text-muted-foreground">Envie um pedido de folga para aprovação.</p>
            </Card>
          </div>

          <Separator />

          {/* Leave Request Form */}
          <Card>
            <CardHeader>
              <CardTitle>Enviar Solicitação de Folga</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLeaveRequest} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="leave-start-date">Data de Início</Label>
                    <Input
                      id="leave-start-date"
                      type="date"
                      value={leaveStartDate}
                      onChange={(e) => setLeaveStartDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="leave-end-date">Data de Término</Label>
                    <Input
                      id="leave-end-date"
                      type="date"
                      value={leaveEndDate}
                      onChange={(e) => setLeaveEndDate(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="leave-reason">Motivo da Folga</Label>
                  <Textarea
                    id="leave-reason"
                    placeholder="Descreva o motivo da sua solicitação de folga..."
                    value={leaveReason}
                    onChange={(e) => setLeaveReason(e.target.value)}
                    rows={3}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmittingLeaveRequest}>
                  {isSubmittingLeaveRequest ? "Enviando..." : "Enviar Solicitação"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
}
