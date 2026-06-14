// =====================================================================
// BarberMeta · Edge Function — webhook da Hotmart (Webhook 2.0)
// Caminho: supabase/functions/hotmart-webhook/index.ts
// Deploy:  supabase functions deploy hotmart-webhook --no-verify-jwt
// =====================================================================
//
// Secrets necessarios (supabase secrets set ...):
//   HOTMART_HOTTOK      = seu Hottok (aba Webhook > Autenticacao na Hotmart)
//   FINANCEIRO_OFFERS   = codigos de oferta que liberam o financeiro, separados por virgula
//                         (Combo PLUS + adicional avulso de Financeiro)
//   FINANCEIRO_PRODUCTS = (alternativa/extra) IDs de produto que liberam financeiro
//   FEEDBACK_OFFERS     = codigos de oferta que liberam o Feedback Premiado (combo PLUS)
//   FEEDBACK_PRODUCTS   = (alternativa/extra) IDs de produto que liberam feedback
//
// SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY ja sao injetados automaticamente.
//
// Na Hotmart: cadastre a URL desta funcao em CADA produto que pode liberar
// acesso (BarberMeta R$47, Combo PLUS R$67, Adicional avulso). Versao 2.0.0,
// eventos "compra aprovada", "compra completa", "reembolso", "chargeback",
// "cancelada".

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const HOTTOK = Deno.env.get("HOTMART_HOTTOK") ?? "";

const parseCsv = (v: string | undefined) =>
  (v ?? "").split(",").map((s) => s.trim()).filter(Boolean);

const FIN_OFFERS   = parseCsv(Deno.env.get("FINANCEIRO_OFFERS"));
const FIN_PRODUCTS = parseCsv(Deno.env.get("FINANCEIRO_PRODUCTS"));
const FB_OFFERS    = parseCsv(Deno.env.get("FEEDBACK_OFFERS"));
const FB_PRODUCTS  = parseCsv(Deno.env.get("FEEDBACK_PRODUCTS"));

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

const APPROVE = new Set(["PURCHASE_APPROVED", "PURCHASE_COMPLETE"]);
const REVOKE = new Set([
  "PURCHASE_REFUNDED",
  "PURCHASE_CHARGEBACK",
  "PURCHASE_PROTEST",
  "PURCHASE_CANCELED",
  "PURCHASE_EXPIRED",
]);

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  // --- Validacao do Hottok (header padrao ou no corpo, p/ testes) ---
  const sentHottok = req.headers.get("x-hotmart-hottok") ?? body?.hottok ?? "";
  if (!HOTTOK || sentHottok !== HOTTOK) {
    return new Response("Unauthorized", { status: 401 });
  }

  const event: string = body?.event ?? "";
  const data = body?.data ?? {};
  const email: string = (data?.buyer?.email ?? "").toLowerCase().trim();
  const offerCode: string = data?.purchase?.offer?.code ?? data?.offer?.code ?? "";
  const productId: string = String(data?.product?.id ?? "");

  // Qual modulo essa compra libera? Combo libera os dois; adicional avulso
  // de financeiro libera so financeiro. Quando nenhuma lista esta configurada,
  // libera tudo (modo dev/teste).
  const allEmpty =
    FIN_OFFERS.length === 0 && FIN_PRODUCTS.length === 0 &&
    FB_OFFERS.length === 0 && FB_PRODUCTS.length === 0;

  const grantsFinanceiro = allEmpty ||
    FIN_OFFERS.includes(offerCode) || FIN_PRODUCTS.includes(productId);
  const grantsFeedback = allEmpty ||
    FB_OFFERS.includes(offerCode) || FB_PRODUCTS.includes(productId);

  // Eventos/compras que nao nos interessam: respondemos 200 e seguimos.
  const isApproveOrRevoke = APPROVE.has(event) || REVOKE.has(event);
  if (!email || !isApproveOrRevoke || (!grantsFinanceiro && !grantsFeedback)) {
    return new Response(JSON.stringify({ ok: true, ignored: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const active = APPROVE.has(event);
  const source = `hotmart:${productId}/${offerCode}`;
  const updated_at = new Date().toISOString();
  const errors: string[] = [];

  if (grantsFinanceiro) {
    const { error } = await admin.from("financeiro_grants").upsert(
      { email, active, source, updated_at },
      { onConflict: "email" },
    );
    if (error) {
      console.error("upsert financeiro_grants error:", error);
      errors.push(`financeiro: ${error.message}`);
    }
  }

  if (grantsFeedback) {
    const { error } = await admin.from("feedback_grants").upsert(
      { email, active, source, updated_at },
      { onConflict: "email" },
    );
    if (error) {
      console.error("upsert feedback_grants error:", error);
      errors.push(`feedback: ${error.message}`);
    }
  }

  if (errors.length > 0) {
    return new Response(`DB error: ${errors.join("; ")}`, { status: 500 });
  }

  return new Response(JSON.stringify({
    ok: true, email, active,
    granted: { financeiro: grantsFinanceiro, feedback: grantsFeedback },
  }), {
    headers: { "Content-Type": "application/json" },
  });
});
