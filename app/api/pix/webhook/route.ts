import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

async function markPayment(paymentId: string) {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN
  if (!token || token.startsWith('seu_')) return

  const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const payment = await paymentResponse.json()
  if (!paymentResponse.ok) return

  const admin = getSupabaseAdmin()
  const now = new Date().toISOString()
  const status = payment.status as string

  if (status === 'approved') {
    await admin
      .from('tickets')
      .update({ status: 'paid', paid_at: now, updated_at: now })
      .eq('payment_id', String(paymentId))
      .neq('status', 'paid')
    return
  }

  if (['cancelled', 'rejected', 'expired', 'refunded'].includes(status)) {
    await admin
      .from('tickets')
      .update({
        status: 'available',
        buyer_name: null,
        buyer_email: null,
        buyer_phone: null,
        payment_id: null,
        reserved_at: null,
        paid_at: null,
        updated_at: now,
      })
      .eq('payment_id', String(paymentId))
      .eq('status', 'pending')
  }
}

export async function POST(request: Request) {
  const url = new URL(request.url)
  const queryId = url.searchParams.get('data.id') ?? url.searchParams.get('id')
  const body = await request.json().catch(() => ({} as { data?: { id?: string } }))
  const paymentId = body.data?.id ?? queryId
  if (paymentId) await markPayment(String(paymentId))
  return NextResponse.json({ ok: true })
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const paymentId = url.searchParams.get('data.id') ?? url.searchParams.get('id')
  if (paymentId) await markPayment(paymentId)
  return NextResponse.json({ ok: true })
}
