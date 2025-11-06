"use client"

import { useEffect, useMemo, useState } from "react"
import { Plus, Trash2, Wand2, Sparkles, RefreshCw } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export interface OrderItem {
  id: number
  name: string
  notes?: string
}

interface OrdersPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orders: OrderItem[]
  onAddOrder: (order: { name: string; notes?: string }) => void
  onDeleteOrder: (id: number) => void
  onUpdateOrder: (order: { id: number; name?: string; notes?: string }) => void
  highlightedOrderId?: number | null
}

export default function OrdersPanel({
  open,
  onOpenChange,
  orders,
  onAddOrder,
  onDeleteOrder,
  onUpdateOrder,
  highlightedOrderId,
}: OrdersPanelProps) {
  const [draftName, setDraftName] = useState("")
  const [draftNotes, setDraftNotes] = useState("")
  const [selectedOrderId, setSelectedOrderId] = useState<string>("")
  const [updateName, setUpdateName] = useState("")
  const [updateNotes, setUpdateNotes] = useState("")

  const summary = useMemo(() => {
    if (!orders.length) return "No pending orders"
    if (orders.length === 1) return "1 order waiting"
    return `${orders.length} orders waiting`
  }, [orders.length])

  const selectedOrder = useMemo(
    () => orders.find((order) => selectedOrderId && order.id === Number.parseInt(selectedOrderId, 10)),
    [orders, selectedOrderId],
  )

  useEffect(() => {
    if (selectedOrder) {
      setUpdateName(selectedOrder.name)
      setUpdateNotes(selectedOrder.notes ?? "")
    }
  }, [selectedOrder])

  const handleSubmit = () => {
    const trimmed = draftName.trim()
    if (!trimmed) return
    onAddOrder({ name: trimmed, notes: draftNotes.trim() || undefined })
    setDraftName("")
    setDraftNotes("")
  }

  const handleUpdateSubmit = () => {
    if (!selectedOrder) return
    onUpdateOrder({
      id: selectedOrder.id,
      name: updateName.trim() || selectedOrder.name,
      notes: updateNotes.trim() || undefined,
    })
  }

  return (
    <Card
      className={`relative overflow-hidden transition-all duration-500 ${
        open ? "border-primary/70 shadow-lg shadow-primary/20" : "border-border"
      }`}
    >
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_65%)]" />
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-primary" />
              Interactive Orders
            </CardTitle>
            <CardDescription className="space-y-1 text-sm leading-relaxed">
              <span className="block">Speak "abre el menú de órdenes" or click open to manage live requests.</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                <Sparkles className="h-3 w-3" /> Demo playground lista para voz
              </span>
            </CardDescription>
          </div>
          <Button variant={open ? "default" : "outline"} size="sm" onClick={() => onOpenChange(!open)}>
            {open ? "Hide" : "Open"}
          </Button>
        </div>
      </CardHeader>
      {open && (
        <CardContent className="space-y-6">
          <div className="rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4 shadow-inner shadow-primary/10">
            <Label htmlFor="order-name" className="text-sm font-semibold">
              1. Describe the new order
            </Label>
            <p className="mt-1 text-xs text-muted-foreground">
              Consejo rápido: habla natural y deja que Nura complete el formulario automáticamente.
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="order-name" className="text-xs uppercase tracking-wide text-muted-foreground">
                  Main item
                </Label>
                <Input
                  id="order-name"
                  placeholder="Latte con vainilla"
                  value={draftName}
                  onChange={(event) => setDraftName(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="order-notes" className="text-xs uppercase tracking-wide text-muted-foreground">
                  Notes for the chef
                </Label>
                <Input
                  id="order-notes"
                  placeholder="Sin azúcar, agregar canela"
                  value={draftNotes}
                  onChange={(event) => setDraftNotes(event.target.value)}
                />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button className="w-full sm:w-auto" onClick={handleSubmit} disabled={!draftName.trim()}>
                <Plus className="mr-2 h-4 w-4" /> Add order to the list
              </Button>
              <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
                Voz sugerida: "agrega la orden {draftName || "matcha latte"}"
              </Badge>
            </div>
          </div>

          <div className="rounded-xl border border-amber-300/40 bg-amber-50/60 p-4 shadow-inner shadow-amber-500/10">
            <Label className="text-sm font-semibold">2. Ajusta o corrige pedidos existentes</Label>
            <p className="mt-1 text-xs text-muted-foreground">
              Selecciona una orden para simular la acción "modifica la orden". También puedes dejar que Nura la actualice.
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Order</Label>
                <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
                  <SelectTrigger aria-label="Order to update">
                    <SelectValue placeholder="Choose order" />
                  </SelectTrigger>
                  <SelectContent>
                    {orders.map((order) => (
                      <SelectItem key={order.id} value={order.id.toString()}>
                        #{order.id} · {order.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">New name</Label>
                <Input
                  placeholder="Matcha frío"
                  value={updateName}
                  onChange={(event) => setUpdateName(event.target.value)}
                  disabled={!selectedOrder}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Notes</Label>
                <Input
                  placeholder="Agrega canela extra"
                  value={updateNotes}
                  onChange={(event) => setUpdateNotes(event.target.value)}
                  disabled={!selectedOrder}
                />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                onClick={handleUpdateSubmit}
                disabled={!selectedOrder}
                className="w-full sm:w-auto"
              >
                <RefreshCw className="mr-2 h-4 w-4" /> Update order
              </Button>
              <Badge variant="outline" className="border-amber-400/50 bg-amber-100 text-amber-700">
                Voz sugerida: "modifica la orden {selectedOrder?.id ?? "dos"} con nota agrega canela"
              </Badge>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label className="text-sm font-semibold">3. Manage the active orders</Label>
              <Badge variant="outline" className="bg-muted/40 text-xs">
                {summary}
              </Badge>
            </div>
            <div className="space-y-3">
              {orders.length === 0 && (
                <p className="rounded-lg border border-dashed bg-muted/40 p-3 text-sm text-muted-foreground">
                  No orders yet. Add one with your voice or with the form above.
                </p>
              )}
              {orders.map((order) => {
                const highlighted = highlightedOrderId === order.id
                return (
                  <div
                    key={order.id}
                    className={`flex flex-col gap-3 rounded-lg border bg-background/90 p-4 shadow-sm shadow-primary/5 transition-all duration-500 sm:flex-row sm:items-center sm:justify-between ${
                      highlighted ? "border-primary/80 bg-gradient-to-r from-primary/10 via-white to-primary/5 shadow-lg shadow-primary/20" : ""
                    }`}
                  >
                    <div>
                      <p className="font-medium">{order.name}</p>
                      {order.notes ? (
                        <p className="text-sm text-muted-foreground">{order.notes}</p>
                      ) : (
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">No extra notes</p>
                      )}
                      {highlighted && (
                        <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          <Sparkles className="h-3 w-3" /> Actualizada por voz
                        </span>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => onDeleteOrder(order.id)}>
                      <Trash2 className="mr-2 h-4 w-4" /> Remove
                    </Button>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
