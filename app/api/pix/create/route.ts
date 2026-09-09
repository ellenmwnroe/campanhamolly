import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { TICKET_PRICE, TOTAL_NUMBERS, expireStaleReservations } from '@/lib/raffle'

type Body = {
  numbers?: number[]
  name?: string
  email?: string
  phone?: string
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body
    const numbers = [...new Set((body.numbers ?? []).map(Number))].sort((a, b) => a - b)
    const name = body.name?.trim() ?? ''
    const email = body.email?.trim() ?? ''
    const phone = body.phone?.trim() ?? ''

    if (!name || !email || !phone) {
      return NextResponse.json({ error: 'Preencha nome, e-mail e WhatsApp.' }, { status: 400 })
    }
    if (numbers.length === 0 || numbers.some((number) => number < 1 || number > TOTAL_NUMBERS)) {
      return NextResponse.json({ error: 'Escolha números válidos da rifa.' }, { status: 400 })
    }

    const token = process.env.MERCADOPAGO_ACCESS_TOKEN
    if (!token || token.startsWith('seu_')) {
      return NextResponse.json({ error: 'O Pix ainda não está configurado.' }, { status: 503 })
    }

    await expireStaleReservations()
    const admin = getSupabaseAdmin()
    const { data: current, error: currentError } = await admin
      .from('tickets')
      .select('number, status')
      .in('number', numbers)

    if (currentError) throw currentError

    const unavailable = (current ?? [])
      .filter((ticket) => ticket.status !== 'available')
      .map((ticket) => ticket.number)

    if (unavailable.length > 0 || (current ?? []).length !== numbers.length) {
      return NextResponse.json(
        { error: 'Alguns números já estão reservados ou pagos. Escolha outros.', taken: unavailable },
        { status: 409 },
      )
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
    const [firstName, ...rest] = name.split(/\s+/)
    const paymentResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': crypto.randomUUID(),
      },
      body: JSON.stringify({
        transaction_amount: numbers.length * TICKET_PRICE,
        description: `Rifa Molly — números ${numbers.join(', ')}`,
        payment_method_id: 'pix',
        notification_url: `${siteUrl}/api/pix/webhook`,
        payer: {
          email,
          first_name: firstName,
          last_name: rest.join(' ') || firstName,
        },
        metadata: {
          numbers: numbers.join(','),
          name,
          phone,
        },
      }),
    })

    const payment = await paymentResponse.json()
    if (!paymentResponse.ok) {
      return NextResponse.json({ error: payment.message || 'Não foi possível gerar o Pix.' }, { status: 502 })
    }

    const qrCode = payment.point_of_interaction?.transaction_data?.qr_code ?? ''
    const qrCodeBase64 = payment.point_of_interaction?.transaction_data?.qr_code_base64 ?? ''
    const now = new Date().toISOString()

    const { data: reserved, error: reserveError } = await admin
      .from('tickets')
      .update({
        status: 'pending',
        buyer_name: name,
        buyer_email: email,
        buyer_phone: phone,
        payment_id: String(payment.id),
        reserved_at: now,
        updated_at: now,
      })
      .in('number', numbers)
      .eq('status', 'available')
      .select('number')

    if (reserveError) throw reserveError
    if ((reserved ?? []).length !== numbers.length) {
      return NextResponse.json(
        { error: 'Alguns números já estão reservados ou pagos. Escolha outros.', taken: numbers },
        { status: 409 },
      )
    }

    return NextResponse.json({ qrCode, qrCodeBase64, paymentId: payment.id })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Não foi possível gerar o Pix.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
