import { NextResponse } from 'next/server'
import { getRaffleState } from '@/lib/raffle'

export async function GET() {
  try {
    const { taken, raised, total } = await getRaffleState()
    return NextResponse.json({ taken, raised, total })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Não foi possível carregar a rifa.'
    return NextResponse.json({ taken: [], raised: 0, error: message }, { status: 500 })
  }
}
