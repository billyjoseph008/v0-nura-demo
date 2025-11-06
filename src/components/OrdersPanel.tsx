"use client"

import { useMemo, useState } from "react"
import { Plus, Trash2, Wand2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

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
}

export default function OrdersPanel({
  open,
  onOpenChange,
  orders,
  onAddOrder,
  onDeleteOrder,
}: OrdersPanelProps) {
  const [draftName, setDraftName] = useState("")
  const [draftNotes, setDraftNotes] = useState("")

  const summary = useMemo(() => {
    if (!orders.length) return "No pending orders"
    if (orders.length === 1) return "1 order waiting"
    return `${orders.length} orders waiting`
  }, [orders.length])

  const handleSubmit = () => {
    const trimmed = draftName.trim()
    if (!trimmed) return
    onAddOrder({ name: trimmed, notes: draftNotes.trim() || undefined })
    setDraftName("")
    setDraftNotes("")
  }

  return (
    <Card className={open ? "border-primary shadow-lg shadow-primary/20" : ""}>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-primary" />
              Interactive Orders
            </CardTitle>
            <CardDescription>
              Speak "abre el menú de órdenes" or click open to manage live requests.
            </CardDescription>
          </div>
          <Button variant={open ? "default" : "outline"} size="sm" onClick={() => onOpenChange(!open)}>
            {open ? "Hide" : "Open"}
          </Button>
        </div>
      </CardHeader>
      {open && (
        <CardContent className="space-y-5">
          <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4">
            <Label htmlFor="order-name" className="text-sm font-semibold">
              1. Describe the new order
            </Label>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
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
            <Button className="mt-4 w-full sm:w-auto" onClick={handleSubmit} disabled={!draftName.trim()}>
              <Plus className="mr-2 h-4 w-4" /> Add order to the list
            </Button>
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label className="text-sm font-semibold">2. Manage the active orders</Label>
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
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="flex flex-col gap-3 rounded-lg border bg-background/80 p-4 shadow-sm shadow-primary/5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium">{order.name}</p>
                    {order.notes ? (
                      <p className="text-sm text-muted-foreground">{order.notes}</p>
                    ) : (
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">No extra notes</p>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => onDeleteOrder(order.id)}>
                    <Trash2 className="mr-2 h-4 w-4" /> Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}

