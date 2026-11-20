import * as React from 'react'

/**
 * Memoriza uma função durante UMA requisição do servidor (React `cache`), para
 * o menu e a página não repetirem as mesmas consultas. Fora do Next (testes)
 * o `cache` não existe: aí a função roda normalmente, sem memorizar.
 */
type Fn = (...args: never[]) => unknown
const cacheReact = (React as unknown as { cache?: <T extends Fn>(f: T) => T }).cache

export function porRequisicao<T extends Fn>(f: T): T {
  return cacheReact ? cacheReact(f) : f
}
