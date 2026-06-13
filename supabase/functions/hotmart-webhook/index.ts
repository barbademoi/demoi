// =====================================================================
// BarberMeta · Edge Function — webhook da Hotmart (Webhook 2.0)
// Caminho: supabase/functions/hotmart-webhook/index.ts
// Deploy:  supabase functions deploy hotmart-webhook --no-verify-jwt
// =====================================================================
//
// Secrets necessarios (supabase secrets set ...):
//   HOTMART_HOTTOK      = seu Hottok (aba Webhook > Autenticacao na Hotmart)
//   FINANCEIRO_OFFERS   = codigos de oferta que liberam o financeiro, separados por virgula
//                         (ex.: a oferta do "BarberMeta Plus" e a do adicional avulso)
//   FINANCEIRO_PRODUCTS = (alternativa/extra) IDs de produto que liberam, separados por virgula
//
// SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY ja sao injetados automaticamente.
//
// Na Hotmart: cadastre a URL desta funcao, versao 2.0.0, e marque os eventos
// "compra aprovada", "compra completa", "reembolso", "chargeback", "cancelada".

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const HOTTOK = Deno.env.get("HOTMART_HOTTOK") ?? "";
const OFFERS = (Deno.env.get("FINANCEIRO_OFFERS") ?? "")
  .split(",").map((s) => s.trim()).filter(Boolean);
const PRODUCTS = (Deno.env.get("FINANCEIRO_PRODUCTS") ?? "")
  .split(",").map((s) => s.trim()).filter(Boolean);

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

  // Esta compra inclui o financeiro? (Plus ou adicional avulso)
  const grantsFinanceiro =
    (OFFERS.length === 0 && PRODUCTS.length === 0) || // se nada configurado, libera tudo
    OFFERS.includes(offerCode) ||
    PRODUCTS.includes(productId);

  // Eventos/compras que nao nos interessam: respondemos 200 e seguimos.
  if (!email || !grantsFinanceiro || (!APPROVE.has(event) && !REVOKE.has(event))) {
    return new Response(JSON.stringify({ ok: true, ignored: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const active = APPROVE.has(event);
  const { error } = await admin.from("financeiro_grants").upsert(
    {
      email,
      active,
      source: `hotmart:${productId}/${offerCode}`,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "email" },
  );

  if (error) {
    console.error("upsert error:", error);
    return new Response("DB error", { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true, email, active }), {
    headers: { "Content-Type": "application/json" },
  });
});
