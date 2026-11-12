/**
 * Aplica o tema salvo do Tarefix ANTES da primeira pintura (evita piscar).
 * Padrão: segue o sistema. Escolha salva em localStorage('tarefix-tema').
 * Usa um atributo próprio (data-tf-tema) para não mexer no BarberMeta.
 */
export function ScriptTema() {
  const js = `try{var t=localStorage.getItem('tarefix-tema');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-tf-tema',t)}catch(e){}`
  return <script dangerouslySetInnerHTML={{ __html: js }} />
}
