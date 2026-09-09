'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowUpRight, Check, Copy, Heart, Sparkles, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const goal = 2500
const raised = 840
const totalNumbers = 80
const photos = [
  '/molly-1.jpeg',
  '/molly-2.jpeg',
  '/molly-3.jpeg',
  '/molly-4.jpeg',
]
const treatment = [
  ['01', 'Cirurgia', 'Anestesia geral inalatória com monitoração cardíaca.'],
  ['02', 'Mastectomia + OSH', 'Mastectomia regional das mamas abdominais e ovariossalpingo-histerectomia (castração).'],
  ['03', 'Cistos e fibromas', 'Retirada dos principais cistos sebáceos e fibromas.'],
  ['04', 'Remédios', 'Antibiótico, anti-inflamatório, analgésico e antiemético para a recuperação.'],
]

export default function Page() {
  const [selected, setSelected] = useState<number[]>([])
  const [takenNumbers, setTakenNumbers] = useState<Set<number>>(new Set())
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [pixLoading, setPixLoading] = useState(false)
  const [pixError, setPixError] = useState('')
  const [qrCode, setQrCode] = useState('')
  const [qrCodeBase64, setQrCodeBase64] = useState('')
  const [copied, setCopied] = useState(false)
  const progress = Math.round((raised / goal) * 100)
  const pixReady = Boolean(qrCodeBase64 || qrCode)

  useEffect(() => {
    let cancelled = false

    async function loadTickets() {
      if (!supabase) return
      const { data, error } = await supabase.from('tickets').select('number, status')
      if (cancelled || error || !data) return
      setTakenNumbers(new Set(data.filter((ticket) => ticket.status !== 'available').map((ticket) => ticket.number)))
    }

    loadTickets()
    return () => { cancelled = true }
  }, [])

  const toggleNumber = (number: number) => {
    if (takenNumbers.has(number)) return
    setSelected((current) => current.includes(number) ? current.filter((item) => item !== number) : [...current, number])
  }

  const closePayment = () => {
    setPaymentOpen(false)
    setPixLoading(false)
    setPixError('')
    setQrCode('')
    setQrCodeBase64('')
    setCopied(false)
  }

  const createPix = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPixLoading(true)
    setPixError('')
    try {
      const response = await fetch('/api/pix/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numbers: selected, name, email, phone }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Não foi possível gerar o Pix.')
      setQrCode(payload.qrCode ?? '')
      setQrCodeBase64(payload.qrCodeBase64 ?? '')
    } catch (error) {
      setPixError(error instanceof Error ? error.message : 'Não foi possível gerar o Pix.')
    } finally {
      setPixLoading(false)
    }
  }

  const copyPixCode = async () => {
    await navigator.clipboard.writeText(qrCode)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  const formattedSelection = useMemo(() => selected.sort((a, b) => a - b).map((number) => String(number).padStart(3, '0')), [selected])

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 md:px-10">
        <a href="#top" className="font-serif text-xl italic text-forest">molly<span className="text-coral">.</span></a>
        <nav className="hidden items-center gap-7 text-[11px] font-bold uppercase tracking-[0.16em] text-forest/70 md:flex">
          <a href="#historia" className="transition-colors hover:text-forest">História</a><a href="#tratamento" className="transition-colors hover:text-forest">Tratamento</a><a href="#ajudar" className="transition-colors hover:text-forest">Ajudar</a><a href="#transparencia" className="transition-colors hover:text-forest">Transparência</a>
        </nav>
        <a href="#rifa" className="rounded-full bg-forest px-4 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-cream transition-transform hover:-translate-y-0.5">Quero ajudar</a>
      </header>

      <section id="top" className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-10 md:grid-cols-[1fr_0.9fr] md:px-10 md:pb-28 md:pt-20">
        <div className="relative z-10">
          <p className="mb-6 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.22em] text-coral"><span className="h-px w-8 bg-coral" />Uma campanha pela Molly</p>
          <h1 className="max-w-xl font-sans text-[clamp(3.7rem,9vw,7.6rem)] font-black leading-[0.86] tracking-[-0.07em] text-forest">A Molly<br />precisa <em className="font-serif font-normal tracking-[-0.05em] text-coral">da gente.</em></h1>
          <p className="mt-8 max-w-md text-base leading-7 text-forest/70 md:text-lg">A Molly foi diagnosticada com câncer de mama e agora precisa passar por uma cirurgia para retirar os nódulos e realizar a retirada do útero.</p>
          <div className="mt-9 flex flex-wrap items-center gap-4"><a href="#rifa" className="rounded-full bg-coral px-6 py-4 text-xs font-bold uppercase tracking-[0.14em] text-cream transition hover:bg-forest">Quero ajudar <ArrowUpRight className="ml-2 inline h-4 w-4" /></a><a href="#historia" className="text-xs font-bold uppercase tracking-[0.14em] text-forest underline decoration-coral decoration-2 underline-offset-8">Conhecer a história</a></div>
          <p className="mt-12 font-serif text-xl italic text-forest/60">“cada contribuição deixa a gente um pouco mais perto.”</p>
        </div>
        <div className="relative mx-auto h-[470px] w-full max-w-[480px] md:h-[580px]">
          <div className="absolute right-2 top-5 h-[390px] w-[78%] rotate-3 overflow-hidden bg-cream p-3 shadow-xl md:h-[500px]"><img src={photos[0]} alt="Cachorro olhando para a câmera em um momento ensolarado" className="h-full w-full object-cover grayscale-[15%]" /></div>
          <div className="absolute bottom-4 left-0 w-44 -rotate-6 bg-cream p-2 pb-7 shadow-lg md:w-56"><img src={photos[1]} alt="Cachorro descansando" className="h-44 w-full object-cover md:h-56" /></div>
          <div className="absolute bottom-6 right-1 rotate-6 bg-mint px-4 py-3 font-serif text-lg italic text-forest shadow-md md:bottom-20">vai dar certo.</div>
          <div className="absolute right-12 top-0 h-10 w-28 rotate-6 bg-coral/70" />
        </div>
      </section>

      <section className="bg-mint px-5 py-12 md:px-10"><div className="mx-auto grid max-w-7xl items-center gap-8 md:grid-cols-[0.8fr_1fr_1fr]"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-forest/60">Meta aproximada</p><p className="mt-2 font-sans text-5xl font-black tracking-[-0.06em] text-forest">R$ 2.500</p><p className="mt-2 text-sm text-forest/65">cirurgia + exames + tratamento</p></div><div><div className="mb-3 flex justify-between text-sm font-bold text-forest"><span>R$ 840 arrecadados</span><span>{progress}%</span></div><div className="h-3 overflow-hidden rounded-full bg-cream/70"><div className="h-full rounded-full bg-coral transition-all duration-700" style={{ width: `${progress}%` }} /></div></div><p className="font-serif text-xl italic text-forest md:text-right">A gente está chegando lá.</p></div></section>

      <section id="historia" className="mx-auto max-w-7xl px-5 py-24 md:px-10 md:py-36"><div className="grid gap-14 md:grid-cols-[0.8fr_1.2fr] md:gap-24"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-coral">A história</p><h2 className="mt-5 max-w-sm font-sans text-5xl font-black leading-[0.92] tracking-[-0.06em] text-forest md:text-7xl">Antes de ser um diagnóstico, ela é <em className="font-serif font-normal text-coral">a Molly.</em></h2></div><div className="max-w-xl text-[17px] leading-8 text-forest/75"><p>A Molly é daquelas cachorras que chegam ocupando espaço. No sofá, no colo, na rotina. Ela tem um jeito muito próprio de pedir carinho e uma energia que faz a casa parecer mais viva.</p><p className="mt-6">Recentemente, descobrimos alguns nódulos nas mamas. O diagnóstico confirmou o câncer e trouxe uma lista de coisas que precisam acontecer: exames, a retirada dos nódulos, a retirada do útero e acompanhamento depois da cirurgia.</p><p className="mt-6">Os custos foram orçados em R$ 2.500: R$ 2.000 para procedimentos e cirurgia, e R$ 500 para os exames. A gente está tentando juntar esse valor do jeito que consegue — contando a história dela e convidando quem puder a fazer parte.</p><p className="mt-8 font-serif text-2xl italic text-forest">Ela ainda tem muito passeio pela frente.</p></div></div><div className="relative mt-16 grid gap-5 md:grid-cols-[1.3fr_0.7fr]"><img src={photos[2]} alt="Cachorro correndo ao ar livre" className="h-[360px] w-full object-cover md:h-[510px]" /><div className="flex flex-col justify-end bg-cream p-7 md:p-10"><p className="font-serif text-3xl italic leading-tight text-forest">“um dia de cada vez, com o rabo abanando.”</p><p className="mt-8 text-[10px] font-bold uppercase tracking-[0.18em] text-coral">— quem conhece a Molly</p></div></div></section>

      <section id="tratamento" className="bg-forest px-5 py-24 text-cream md:px-10 md:py-32"><div className="mx-auto max-w-7xl"><div className="flex flex-col justify-between gap-6 md:flex-row md:items-end"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-mint">O plano</p><h2 className="mt-5 max-w-2xl font-sans text-5xl font-black leading-[0.9] tracking-[-0.06em] md:text-7xl">O que precisa<br />ser <em className="font-serif font-normal text-mint">feito.</em></h2></div><p className="max-w-xs text-sm leading-6 text-cream/60">R$ 2.000 serão destinados aos procedimentos e cirurgia da Molly.</p></div><div className="mt-16 grid gap-px overflow-hidden border border-cream/20 md:grid-cols-4">{treatment.map(([number, title, copy]) => <article key={number} className="group min-h-64 border-b border-cream/20 bg-forest p-6 transition-colors hover:bg-forest-light md:border-b-0 md:border-r last:border-r-0"><span className="font-mono text-xs text-coral">{number}</span><h3 className="mt-20 text-xl font-bold uppercase tracking-[-0.03em]">{title}</h3><p className="mt-4 text-sm leading-6 text-cream/60">{copy}</p></article>)}</div><div className="mt-16 border-t border-cream/20 pt-10"><div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-mint">Exames — R$ 500</p><p className="mt-4 max-w-lg text-sm leading-7 text-cream/65">RX lateral do tórax, ecodopplercardiograma, hemograma, uréia, creatinina e ALT.</p></div><p className="max-w-xs font-serif text-xl italic leading-snug text-cream">Tudo o que a Molly precisa para seguir com segurança.</p></div></div></div></section>

      <section id="rifa" className="bg-butter px-5 py-24 md:px-10 md:py-32"><div className="mx-auto max-w-7xl"><div className="grid gap-14 md:grid-cols-[0.8fr_1.2fr]"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-coral">Uma forma de ajudar</p><h2 className="mt-5 font-sans text-5xl font-black leading-[0.9] tracking-[-0.06em] text-forest md:text-7xl">Ajude a Molly<br />e concorra a<br /><em className="font-serif font-normal text-coral">R$ 500.</em></h2><p className="mt-8 max-w-sm text-base leading-7 text-forest/70">Cada número custa R$ 10 e todo o valor arrecadado será destinado aos custos do tratamento. Escolha quantos quiser.</p><div className="mt-10 grid max-w-sm grid-cols-2 gap-2 text-sm text-forest/70"><span>R$ 10 → 1 número</span><span>R$ 20 → 2 números</span><span>R$ 50 → 5 números</span><span>R$ 100 → 10 números</span></div></div><div><div className="mb-5 flex items-end justify-between"><div><p className="text-sm font-bold text-forest">Escolha seus números</p><p className="mt-1 text-xs text-forest/55">Os riscados já foram reservados.</p></div><span className="font-mono text-xs text-forest/55">{selected.length}/{totalNumbers}</span></div><div className="grid grid-cols-5 gap-2 sm:grid-cols-8">{Array.from({ length: totalNumbers }, (_, index) => index + 1).map((number) => { const reserved = takenNumbers.has(number); const active = selected.includes(number); return <button key={number} type="button" disabled={reserved} onClick={() => toggleNumber(number)} aria-label={`Número ${String(number).padStart(3, '0')}${reserved ? ', reservado' : ''}`} className={`relative aspect-square rounded-sm border font-mono text-xs transition-all ${reserved ? 'cursor-not-allowed border-forest/10 bg-forest/5 text-forest/25 line-through' : active ? 'border-coral bg-coral text-cream shadow-lg' : 'border-forest/20 bg-cream text-forest hover:-translate-y-1 hover:border-coral'}`}>{String(number).padStart(3, '0')}</button> })}</div>{selected.length > 0 && <div className="mt-7 border-t border-forest/20 pt-5"><div className="flex flex-wrap items-end justify-between gap-5"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-forest/55">Seus números</p><p className="mt-2 max-w-sm font-mono text-sm text-forest">{formattedSelection.join('  ·  ')}</p><p className="mt-2 text-sm text-forest/65">{selected.length} {selected.length === 1 ? 'número' : 'números'} · R$ {selected.length * 10}</p></div><button type="button" onClick={() => setPaymentOpen(true)} className="rounded-full bg-forest px-6 py-4 text-xs font-bold uppercase tracking-[0.14em] text-cream transition hover:bg-coral">Continuar <ArrowUpRight className="ml-2 inline h-4 w-4" /></button></div></div>}</div></div></div></section>

      <section id="transparencia" className="mx-auto max-w-7xl px-5 py-24 md:px-10 md:py-32"><div className="grid gap-14 md:grid-cols-2"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-coral">Prestação de contas</p><h2 className="mt-5 font-sans text-5xl font-black leading-[0.9] tracking-[-0.06em] text-forest md:text-7xl">Pra onde vai<br />o <em className="font-serif font-normal text-coral">dinheiro?</em></h2><p className="mt-8 max-w-sm text-base leading-7 text-forest/65">A ideia é manter tudo aberto: orçamentos, comprovantes e atualizações do tratamento entram aqui conforme forem acontecendo.</p></div><div className="divide-y divide-forest/15 border-y border-forest/15">{[['Procedimentos e cirurgia', 'R$ 2.000'], ['Exames', 'R$ 500'], ['Total', 'R$ 2.500']].map(([label, value], index) => <div key={label} className={`flex items-center justify-between py-5 ${index === 2 ? 'font-bold text-coral' : 'text-forest'}`}><span className="text-sm uppercase tracking-[0.12em]">{label}</span><span className="font-mono text-sm">{value}</span></div>)}</div></div></section>

      <section className="bg-cream px-5 py-24 md:px-10"><div className="mx-auto grid max-w-7xl gap-14 md:grid-cols-[0.7fr_1.3fr]"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-coral">Diário da Molly</p><h2 className="mt-5 font-sans text-5xl font-black leading-[0.9] tracking-[-0.06em] text-forest md:text-6xl">A gente vai<br />contando por aqui.</h2></div><div className="border-l border-forest/20 pl-7 md:pl-12"><div className="relative pb-12"><span className="absolute -left-[31px] top-1 h-3 w-3 rounded-full bg-coral ring-4 ring-cream" /><p className="font-mono text-xs font-bold text-coral">02 SET</p><h3 className="mt-3 text-xl font-bold text-forest">Descobrimos os nódulos.</h3><p className="mt-2 text-sm leading-6 text-forest/60">Foi quando começamos a investigar e entender os próximos passos.</p></div><div className="relative pb-12"><span className="absolute -left-[31px] top-1 h-3 w-3 rounded-full bg-forest ring-4 ring-cream" /><p className="font-mono text-xs font-bold text-coral">05 SET</p><h3 className="mt-3 text-xl font-bold text-forest">Começamos os exames.</h3><p className="mt-2 text-sm leading-6 text-forest/60">Atualizações sobre os resultados entram aqui.</p></div><div className="relative"><span className="absolute -left-[31px] top-1 h-3 w-3 rounded-full border-2 border-coral bg-cream ring-4 ring-cream" /><p className="font-mono text-xs font-bold text-coral">XX SET</p><h3 className="mt-3 text-xl font-bold text-forest">Cirurgia marcada.</h3></div></div></div></section>

      <section className="px-5 py-24 md:px-10"><div className="mx-auto max-w-7xl"><div className="grid gap-5 md:grid-cols-[0.65fr_1.35fr]"><div className="flex min-h-[360px] flex-col justify-between bg-mint p-7 md:p-10"><Sparkles className="h-7 w-7 text-coral" /><div><p className="font-serif text-3xl italic leading-tight text-forest">Pequenos gestos fazem uma história continuar.</p><p className="mt-5 text-sm text-forest/60">A Molly agradece com o olhar mais bonito que ela tem.</p></div></div><img src={photos[3]} alt="Cachorro em um momento de carinho" className="h-[360px] w-full object-cover md:h-[500px]" /></div></div></section>

      <section id="ajudar" className="bg-coral px-5 py-24 text-cream md:px-10 md:py-32"><div className="mx-auto max-w-4xl text-center"><Heart className="mx-auto h-8 w-8 fill-current" /><h2 className="mt-7 font-sans text-5xl font-black leading-[0.9] tracking-[-0.06em] md:text-8xl">Se você chegou<br />até aqui, <em className="font-serif font-normal">obrigada.</em></h2><p className="mx-auto mt-8 max-w-md text-lg leading-7 text-cream/80">Para você pode ser R$ 10. Para a Molly, é mais um passo em direção à cirurgia.</p><a href="#rifa" className="mt-9 inline-block rounded-full bg-forest px-7 py-5 text-xs font-bold uppercase tracking-[0.16em] text-cream transition hover:bg-cream hover:text-forest">Quero ajudar a Molly <ArrowUpRight className="ml-2 inline h-4 w-4" /></a></div></section>

      <footer className="bg-forest px-5 py-10 text-cream md:px-10"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-7 md:flex-row md:items-center"><p className="font-serif text-2xl italic">feito para a Molly <span className="text-coral">♡</span></p><div className="flex flex-wrap gap-5 text-[10px] font-bold uppercase tracking-[0.16em] text-cream/60"><a href="#historia">História</a><a href="#tratamento">Tratamento</a><a href="#ajudar">Ajudar</a><a href="#transparencia">Transparência</a><span aria-label="Instagram" className="font-mono text-xs">@molly</span></div></div></footer>

      <div className="fixed bottom-4 left-4 right-4 z-20 md:hidden"><a href="#rifa" className="block rounded-full bg-coral py-4 text-center text-xs font-bold uppercase tracking-[0.16em] text-cream shadow-xl">Quero ajudar a Molly <ArrowUpRight className="ml-2 inline h-4 w-4" /></a></div>

      {paymentOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-forest/60 p-0 backdrop-blur-sm md:items-center md:p-5" role="dialog" aria-modal="true" aria-labelledby="payment-title">
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-cream p-7 text-forest md:rounded-3xl md:p-10">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-coral">Próximo passo</p>
                <h2 id="payment-title" className="mt-3 font-sans text-4xl font-black tracking-[-0.06em]">{pixReady ? 'Pague via Pix' : 'Seus dados'}</h2>
              </div>
              <button type="button" onClick={closePayment} aria-label="Fechar janela" className="rounded-full p-2 hover:bg-forest/10"><X className="h-5 w-5" /></button>
            </div>

            <div className="mt-8 border-y border-forest/15 py-5">
              <div className="flex justify-between text-sm"><span>Números</span><span className="font-mono">{formattedSelection.join(', ')}</span></div>
              <div className="mt-3 flex justify-between text-sm font-bold"><span>Total</span><span>R$ {selected.length * 10}</span></div>
            </div>

            {!pixReady ? (
              <form className="mt-7 space-y-4" onSubmit={createPix}>
                <label className="block">
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-forest/55">Nome completo</span>
                  <input required value={name} onChange={(event) => setName(event.target.value)} className="mt-2 w-full rounded-2xl border border-forest/20 bg-background px-4 py-3 text-sm outline-none transition focus:border-coral" placeholder="Como a gente te chama" />
                </label>
                <label className="block">
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-forest/55">E-mail</span>
                  <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-2xl border border-forest/20 bg-background px-4 py-3 text-sm outline-none transition focus:border-coral" placeholder="para o Mercado Pago" />
                </label>
                <label className="block">
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-forest/55">WhatsApp</span>
                  <input required type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-2 w-full rounded-2xl border border-forest/20 bg-background px-4 py-3 text-sm outline-none transition focus:border-coral" placeholder="para avisar se você ganhar" />
                </label>
                {pixError && <p className="text-sm text-coral">{pixError}</p>}
                <button type="submit" disabled={pixLoading} className="mt-2 w-full rounded-full bg-forest py-4 text-xs font-bold uppercase tracking-[0.15em] text-cream transition hover:bg-coral disabled:cursor-wait disabled:opacity-70">
                  {pixLoading ? 'Gerando Pix...' : 'Gerar Pix'}
                </button>
              </form>
            ) : (
              <div className="mt-7">
                {qrCodeBase64 && (
                  <div className="flex flex-col items-center rounded-3xl border border-forest/15 bg-background p-6">
                    <img src={`data:image/png;base64,${qrCodeBase64}`} alt="QR Code Pix" className="h-52 w-52 rounded-xl bg-cream p-2" />
                    <p className="mt-4 text-center font-serif text-lg italic text-forest">Aponte a câmera e ajude a Molly.</p>
                  </div>
                )}
                {qrCode && (
                  <button type="button" onClick={copyPixCode} className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-coral py-4 text-xs font-bold uppercase tracking-[0.15em] text-cream transition hover:bg-forest">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? 'Código copiado' : 'Copiar código Pix'}
                  </button>
                )}
                <p className="mt-5 text-center text-xs leading-5 text-forest/55">A reserva só é confirmada depois da compensação do Pix.</p>
              </div>
            )}

            <button type="button" onClick={closePayment} className="mt-6 w-full rounded-full border border-forest/20 py-4 text-xs font-bold uppercase tracking-[0.15em] text-forest hover:bg-forest hover:text-cream">Fechar</button>
          </div>
        </div>
      )}
    </main>
  )
}
