import { getSupabaseAdmin } from '@/lib/supabase-admin'

export const TICKET_PRICE = 10
export const TOTAL_NUMBERS = 80
export const PENDING_MINUTES = 30

type TicketRow = {
  number: number
  status: 'available' | 'pending' | 'paid'
  reserved_at: string | null
}

export async function expireStaleReservations() {
  const admin = getSupabaseAdmin()
  const cutoff = new Date(Date.now() - PENDING_MINUTES * 60 * 1000).toISOString()
  await admin
    .from('tickets')
    .update({
      status: 'available',
      buyer_name: null,
      buyer_email: null,
      buyer_phone: null,
      payment_id: null,
      reserved_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('status', 'pending')
    .lt('reserved_at', cutoff)
}

export async function getRaffleState() {
  await expireStaleReservations()
  const admin = getSupabaseAdmin()
  const { data, error } = await admin.from('tickets').select('number, status, reserved_at')
  if (error) throw new Error(error.message)

  const tickets = (data ?? []) as TicketRow[]
  const taken = tickets.filter((ticket) => ticket.status !== 'available').map((ticket) => ticket.number)
  const raised = tickets.filter((ticket) => ticket.status === 'paid').length * TICKET_PRICE
  return { taken, raised, tickets }
}
