/**
 * Aplica o tema salvo ANTES da primeira pintura (evita piscar).
 * Padrão: segue o sistema. Escolha salva em localStorage('tarefix-tema').
 */
export function ScriptTema() {
  const js = `try{var t=localStorage.getItem('tarefix-tema');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t)}catch(e){}`
  return <script dangerouslySetInnerHTML={{ __html: js }} />
}
