/* eslint-disable @next/next/no-img-element */
import QRCode from 'qrcode'
import BotaoCopiar from './BotaoCopiar'
import { brCodePix } from '@/lib/pix'
import { reais } from '@/lib/format'
import type { Pagamento } from '@/lib/defaults'
import type { Plano } from '@/lib/planos'

/**
 * Como pagar o plano: link da InfinitePay (cartão) ou Pix com valor.
 * O QR do Pix é gerado com o valor do plano quando chave + nome + cidade
 * estão preenchidos; senão, usa a imagem de QR cadastrada no admin.
 */
export default async function InfoPagamento({ plano, cfg }: { plano: Plano; cfg: Pagamento }) {
  if (plano.forma === 'cartao') {
    return (
      <div className="space-y-4">
        <p className="text-lg">
          Pague <strong>{reais(plano.valor)}</strong> em até 6x sem juros no cartão, pelo link seguro da InfinitePay.
        </p>
        {cfg.infinitepay_url ? (
          <a href={cfg.infinitepay_url} target="_blank" rel="noopener noreferrer" className="btn-primario w-full sm:w-full">
            Pagar no cartão
          </a>
        ) : (
          <p className="rounded-xl border border-linha p-4 text-suave">Link de pagamento ainda não configurado. Chama a gente no WhatsApp.</p>
        )}
        <p className="text-sm text-suave">Depois de pagar, volte aqui e toque em “Já paguei” com o print do comprovante.</p>
      </div>
    )
  }

  const copiaECola =
    cfg.pix_chave && cfg.pix_nome && cfg.pix_cidade
      ? brCodePix({ chave: cfg.pix_chave, nome: cfg.pix_nome, cidade: cfg.pix_cidade, valor: plano.valor })
      : ''
  const qr = copiaECola ? await QRCode.toDataURL(copiaECola, { margin: 1, width: 480 }) : cfg.pix_qr_url

  return (
    <div className="space-y-4">
      <p className="text-lg">
        Valor no Pix: <strong className="text-2xl">{reais(plano.valor)}</strong>
      </p>
      {qr && (
        <div className="mx-auto w-full max-w-[260px] rounded-2xl bg-white p-3">
          <img src={qr} alt="QR Code do Pix" className="w-full" />
        </div>
      )}
      {copiaECola && <BotaoCopiar texto={copiaECola} rotulo="Copiar Pix copia e cola" />}
      {cfg.pix_chave ? (
        <div className="card-2 rounded-xl border border-linha bg-card-2 p-4">
          <p className="text-sm text-suave">Chave Pix{cfg.pix_nome ? ` · ${cfg.pix_nome}` : ''}</p>
          <p className="mt-1 break-all text-lg font-bold">{cfg.pix_chave}</p>
          <div className="mt-3">
            <BotaoCopiar texto={cfg.pix_chave} rotulo="Copiar chave" />
          </div>
        </div>
      ) : (
        <p className="rounded-xl border border-linha p-4 text-suave">Chave Pix ainda não configurada. Chama a gente no WhatsApp.</p>
      )}
      {cfg.pix_instrucoes && <p className="text-sm text-suave">{cfg.pix_instrucoes}</p>}
    </div>
  )
}
