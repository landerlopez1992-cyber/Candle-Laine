/** Número de pedido de referencia en cliente (hasta que exista orden en Supabase). */
export function generateClientOrderNumber(): string {
  const n = Math.floor(100000 + Math.random() * 900000);
  return `CL-${n}`;
}
