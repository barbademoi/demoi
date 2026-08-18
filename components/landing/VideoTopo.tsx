import VideoVimeo from './VideoVimeo'

/**
 * PRIMEIRA SEÇÃO DA LANDING — o vídeo do sistema por dentro.
 *
 * O player fica EMBUTIDO no fluxo da página, nunca em modal: quem chega vê o
 * produto rodando antes de ler qualquer promessa.
 *
 * O padding é curto de propósito. Um 16:9 em tela de celular já ocupa ~200px, e
 * o headline e o CTA do hero precisam continuar logo abaixo — vídeo no topo não
 * pode empurrar o botão de compra pra fora da primeira rolagem.
 *
 * O `pt-20` é a folga do menu fixo (h-16), que antes ficava no hero: agora quem
 * encosta no topo da página é esta seção.
 */
export default function VideoTopo() {
  return (
    <section className="bg-carvao px-4 pb-6 pt-20 sm:px-6 sm:pb-8 sm:pt-24">
      <div className="mx-auto w-full max-w-3xl">
        <h2 className="mb-4 text-center text-xl font-bold tracking-[-0.02em] text-white sm:text-2xl">
          Conheça o BarberMeta por dentro
        </h2>
        <VideoVimeo />
      </div>
    </section>
  )
}
