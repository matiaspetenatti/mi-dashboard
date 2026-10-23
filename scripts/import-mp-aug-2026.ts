import { db } from "@/db";
import { cuentas, movimientos } from "@/modules/finanzas/schema";
import { and, eq } from "drizzle-orm";
import { fechaHoy } from "@/lib/format";

const csv = `SOURCE_ID;PAYMENT_METHOD_TYPE;TRANSACTION_TYPE;TRANSACTION_AMOUNT;TRANSACTION_DATE;FEE_AMOUNT;SETTLEMENT_DATE;REAL_AMOUNT;TAXES_AMOUNT;BUSINESS_UNIT;SUB_UNIT;MONEY_RELEASE_DATE
1749153451598;;SETTLEMENT;166.76;2026-08-31T01:47:09.000-03:00;0.00;2026-08-31T01:47:09.000-03:00;166.76;0.00;;;
1749153451598;;SETTLEMENT;25.37;2026-08-31T01:47:09.000-03:00;0.00;2026-08-31T01:47:09.000-03:00;25.37;0.00;;;
1749153451598;;SETTLEMENT;215.83;2026-08-31T01:47:09.000-03:00;0.00;2026-08-31T01:47:09.000-03:00;215.83;0.00;;;
175353712831;available_money;SETTLEMENT;-10862.00;2026-08-29T21:19:25.000-03:00;0.00;2026-08-29T21:19:25.000-03:00;-10862.00;0.00;Mercado Pago;Checkouts;2026-09-22T20:24:25.000-03:00
176266437968;available_money;SETTLEMENT;40000.00;2026-08-29T17:52:24.000-03:00;0.00;2026-08-29T17:52:25.000-03:00;40000.00;0.00;;;2026-08-29T17:52:25.000-03:00
175823092098;available_money;SETTLEMENT;-4829.66;2026-08-27T00:39:33.000-03:00;-385.89;2026-08-28T18:36:19.000-03:00;-6374.67;-1159.12;;;2026-08-28T18:36:19.000-03:00
1749106249853;;SETTLEMENT;78.72;2026-08-28T04:51:41.000-03:00;0.00;2026-08-28T04:51:41.000-03:00;78.72;0.00;;;
1749106249853;;SETTLEMENT;9.25;2026-08-28T04:51:41.000-03:00;0.00;2026-08-28T04:51:41.000-03:00;9.25;0.00;;;
1749106249853;;SETTLEMENT;47.81;2026-08-28T04:51:41.000-03:00;0.00;2026-08-28T04:51:41.000-03:00;47.81;0.00;;;
174982407705;available_money;SETTLEMENT;6100.00;2026-08-27T17:58:38.000-03:00;0.00;2026-08-27T17:58:39.000-03:00;6100.00;0.00;;;2026-08-27T17:58:39.000-03:00
175926047934;available_money;SETTLEMENT;-2838.00;2026-08-27T17:51:14.000-03:00;0.00;2026-08-27T17:51:15.000-03:00;-2838.00;0.00;Mercado Pago;Checkouts;2026-09-20T16:57:09.000-03:00
175916674028;available_money;SETTLEMENT;-3196.00;2026-08-27T16:52:15.000-03:00;0.00;2026-08-27T16:52:15.000-03:00;-3196.00;0.00;Mercado Pago;Checkouts;2026-09-20T15:56:54.000-03:00
1749025361141;;SETTLEMENT;9.55;2026-08-27T03:48:16.000-03:00;0.00;2026-08-27T03:48:16.000-03:00;9.55;0.00;;;
1749025361141;;SETTLEMENT;81.34;2026-08-27T03:48:16.000-03:00;0.00;2026-08-27T03:48:16.000-03:00;81.34;0.00;;;
1749025361141;;SETTLEMENT;49.36;2026-08-27T03:48:16.000-03:00;0.00;2026-08-27T03:48:16.000-03:00;49.36;0.00;;;
1748958045325;;SETTLEMENT;9.42;2026-08-26T04:06:30.000-03:00;0.00;2026-08-26T04:06:30.000-03:00;9.42;0.00;;;
1748958045325;;SETTLEMENT;80.17;2026-08-26T04:06:30.000-03:00;0.00;2026-08-26T04:06:30.000-03:00;80.17;0.00;;;
1748958045325;;SETTLEMENT;51.99;2026-08-26T04:06:30.000-03:00;0.00;2026-08-26T04:06:30.000-03:00;51.99;0.00;;;
174634303759;available_money;SETTLEMENT;-20000.00;2026-08-25T13:47:07.000-03:00;0.00;2026-08-25T13:47:07.000-03:00;-20000.00;0.00;;;2026-08-25T13:47:07.000-03:00
1748890449750;;SETTLEMENT;80.78;2026-08-25T04:59:41.000-03:00;0.00;2026-08-25T04:59:41.000-03:00;80.78;0.00;;;
1748890449750;;SETTLEMENT;9.49;2026-08-25T04:59:41.000-03:00;0.00;2026-08-25T04:59:41.000-03:00;9.49;0.00;;;
1748890449750;;SETTLEMENT;62.95;2026-08-25T04:59:41.000-03:00;0.00;2026-08-25T04:59:41.000-03:00;62.95;0.00;;;
1748808640800;;SETTLEMENT;165.72;2026-08-24T05:00:49.000-03:00;0.00;2026-08-24T05:00:49.000-03:00;165.72;0.00;;;
1748808640800;;SETTLEMENT;20.36;2026-08-24T05:00:49.000-03:00;0.00;2026-08-24T05:00:49.000-03:00;20.36;0.00;;;
1748808640800;;SETTLEMENT;207.51;2026-08-24T05:00:49.000-03:00;0.00;2026-08-24T05:00:49.000-03:00;207.51;0.00;;;
175178790194;available_money;SETTLEMENT;40000.00;2026-08-22T18:57:50.000-03:00;0.00;2026-08-22T18:57:50.000-03:00;40000.00;0.00;;;2026-08-22T18:57:50.000-03:00
1748705294435;;SETTLEMENT;44.50;2026-08-21T01:25:13.000-03:00;0.00;2026-08-21T01:25:13.000-03:00;44.50;0.00;;;
1748705294435;;SETTLEMENT;82.92;2026-08-21T01:25:13.000-03:00;0.00;2026-08-21T01:25:13.000-03:00;82.92;0.00;;;
1748705294435;;SETTLEMENT;8.13;2026-08-21T01:25:13.000-03:00;0.00;2026-08-21T01:25:13.000-03:00;8.13;0.00;;;
173490237623;available_money;SETTLEMENT;-42278.79;2026-08-18T10:19:57.000-03:00;0.00;2026-08-20T23:28:47.000-03:00;-42278.79;0.00;;;2026-08-20T23:28:47.000-03:00
1748644813596;;SETTLEMENT;85.98;2026-08-20T02:52:57.000-03:00;0.00;2026-08-20T02:52:57.000-03:00;85.98;0.00;;;
1748644813596;;SETTLEMENT;46.14;2026-08-20T02:52:57.000-03:00;0.00;2026-08-20T02:52:57.000-03:00;46.14;0.00;;;
1748644813596;;SETTLEMENT;8.44;2026-08-20T02:52:57.000-03:00;0.00;2026-08-20T02:52:57.000-03:00;8.44;0.00;;;
1748564892383;;SETTLEMENT;8.03;2026-08-19T02:08:29.000-03:00;0.00;2026-08-19T02:08:29.000-03:00;8.03;0.00;;;
1748564892383;;SETTLEMENT;81.85;2026-08-19T02:08:29.000-03:00;0.00;2026-08-19T02:08:29.000-03:00;81.85;0.00;;;
1748564892383;;SETTLEMENT;43.93;2026-08-19T02:08:29.000-03:00;0.00;2026-08-19T02:08:29.000-03:00;43.93;0.00;;;
1748503767333;;SETTLEMENT;282.56;2026-08-18T04:11:25.000-03:00;0.00;2026-08-18T04:11:25.000-03:00;282.56;0.00;;;
1748503767333;;SETTLEMENT;347.12;2026-08-18T04:11:25.000-03:00;0.00;2026-08-18T04:11:25.000-03:00;347.12;0.00;;;
1748503767333;;SETTLEMENT;34.05;2026-08-18T04:11:25.000-03:00;0.00;2026-08-18T04:11:25.000-03:00;34.05;0.00;;;
174192927182;available_money;SETTLEMENT;-3490.00;2026-08-16T19:13:07.000-03:00;0.00;2026-08-16T19:13:07.000-03:00;-3490.00;0.00;Mercado Pago;Checkouts;2026-08-16T19:13:07.000-03:00
173162986267;available_money;SETTLEMENT;-13200.00;2026-08-15T22:44:27.000-03:00;0.00;2026-08-15T22:44:27.000-03:00;-13200.00;0.00;Mercado Pago;QR;2026-08-15T22:44:27.000-03:00
1748366630003;;SETTLEMENT;77.99;2026-08-14T01:25:45.000-03:00;0.00;2026-08-14T01:25:45.000-03:00;77.99;0.00;;;
1748366630003;;SETTLEMENT;75.36;2026-08-14T01:25:45.000-03:00;0.00;2026-08-14T01:25:45.000-03:00;75.36;0.00;;;
1748366630003;;SETTLEMENT;6.13;2026-08-14T01:25:45.000-03:00;0.00;2026-08-14T01:25:45.000-03:00;6.13;0.00;;;
1748291413906;;SETTLEMENT;74.52;2026-08-13T01:31:07.000-03:00;0.00;2026-08-13T01:31:07.000-03:00;74.52;0.00;;;
1748291413906;;SETTLEMENT;6.06;2026-08-13T01:31:07.000-03:00;0.00;2026-08-13T01:31:07.000-03:00;6.06;0.00;;;
1748291413906;;SETTLEMENT;77.12;2026-08-13T01:31:07.000-03:00;0.00;2026-08-13T01:31:07.000-03:00;77.12;0.00;;;
172453108581;available_money;SETTLEMENT;10000.00;2026-08-12T10:42:56.000-03:00;0.00;2026-08-12T10:42:56.000-03:00;10000.00;0.00;;;2026-08-12T10:42:56.000-03:00
1748257064106;;SETTLEMENT;32.17;2026-08-12T05:28:49.000-03:00;0.00;2026-08-12T05:28:49.000-03:00;32.17;0.00;;;
1748257064106;;SETTLEMENT;35.72;2026-08-12T05:28:49.000-03:00;0.00;2026-08-12T05:28:49.000-03:00;35.72;0.00;;;
1748257064106;;SETTLEMENT;2.81;2026-08-12T05:28:49.000-03:00;0.00;2026-08-12T05:28:49.000-03:00;2.81;0.00;;;
172383621553;available_money;SETTLEMENT;-9700.00;2026-08-11T20:09:18.000-03:00;0.00;2026-08-11T20:09:18.000-03:00;-9700.00;0.00;;;2026-08-11T20:09:18.000-03:00
172382290621;bank_transfer;SETTLEMENT;200000.00;2026-08-11T20:00:35.000-03:00;0.00;2026-08-11T20:00:35.000-03:00;200000.00;0.00;;;2026-08-11T20:00:35.000-03:00
172363410925;available_money;SETTLEMENT;-12227.40;2026-08-11T18:21:15.000-03:00;0.00;2026-08-11T18:21:15.000-03:00;-12227.40;0.00;Mercado Pago;QR;2026-08-11T18:21:15.000-03:00
172360111733;available_money;SETTLEMENT;-12955.00;2026-08-11T18:05:14.000-03:00;0.00;2026-08-11T18:05:14.000-03:00;-12955.00;0.00;;;2026-08-11T18:05:14.000-03:00
1748155175413;;SETTLEMENT;5.95;2026-08-11T03:16:32.000-03:00;0.00;2026-08-11T03:16:32.000-03:00;5.95;0.00;;;
1748155175413;;SETTLEMENT;38.00;2026-08-11T03:16:32.000-03:00;0.00;2026-08-11T03:16:32.000-03:00;38.00;0.00;;;
1748155175413;;SETTLEMENT;25.86;2026-08-11T03:16:32.000-03:00;0.00;2026-08-11T03:16:32.000-03:00;25.86;0.00;;;
1748089733831;;SETTLEMENT;14.00;2026-08-10T04:50:48.000-03:00;0.00;2026-08-10T04:50:48.000-03:00;14.00;0.00;;;
1748089733831;;SETTLEMENT;244.95;2026-08-10T04:50:48.000-03:00;0.00;2026-08-10T04:50:48.000-03:00;244.95;0.00;;;
1748089733831;;SETTLEMENT;237.21;2026-08-10T04:50:48.000-03:00;0.00;2026-08-10T04:50:48.000-03:00;237.21;0.00;;;
172905968882;available_money;SETTLEMENT;40000.00;2026-08-09T14:00:08.000-03:00;0.00;2026-08-09T14:00:09.000-03:00;40000.00;0.00;;;2026-08-09T14:00:08.000-03:00
171996277747;available_money;SETTLEMENT;-39294.12;2026-08-09T13:59:04.000-03:00;0.00;2026-08-09T13:59:10.000-03:00;-39294.12;0.00;Mercado Libre;;2026-08-18T14:37:53.000-03:00
172679813852;available_money;SETTLEMENT;-9000.00;2026-08-08T00:44:20.000-03:00;0.00;2026-08-08T00:44:21.000-03:00;-9000.00;0.00;;;2026-08-08T00:44:20.000-03:00
1747999779305;;SETTLEMENT;66.48;2026-08-07T03:50:40.000-03:00;0.00;2026-08-07T03:50:40.000-03:00;66.48;0.00;;;
1747999779305;;SETTLEMENT;74.23;2026-08-07T03:50:40.000-03:00;0.00;2026-08-07T03:50:40.000-03:00;74.23;0.00;;;
1747999779305;;SETTLEMENT;3.92;2026-08-07T03:50:40.000-03:00;0.00;2026-08-07T03:50:40.000-03:00;3.92;0.00;;;
171559107167;bank_transfer;SETTLEMENT;40000.00;2026-08-06T21:24:56.000-03:00;0.00;2026-08-06T21:24:56.000-03:00;40000.00;0.00;;;2026-08-06T21:24:56.000-03:00
1747915870390;;SETTLEMENT;64.55;2026-08-06T02:11:01.000-03:00;0.00;2026-08-06T02:11:01.000-03:00;64.55;0.00;;;
1747915870390;;SETTLEMENT;3.81;2026-08-06T02:11:01.000-03:00;0.00;2026-08-06T02:11:01.000-03:00;3.81;0.00;;;
1747915870390;;SETTLEMENT;55.04;2026-08-06T02:11:01.000-03:00;0.00;2026-08-06T02:11:01.000-03:00;55.04;0.00;;;
172266429524;bank_transfer;SETTLEMENT;40000.00;2026-08-05T19:52:43.000-03:00;0.00;2026-08-05T19:52:44.000-03:00;40000.00;0.00;;;2026-08-05T19:52:44.000-03:00
171297499049;available_money;SETTLEMENT;-9000.00;2026-08-05T13:20:48.000-03:00;0.00;2026-08-05T13:20:49.000-03:00;-9000.00;0.00;;;2026-08-05T13:20:49.000-03:00
1747877149277;;SETTLEMENT;49.18;2026-08-05T06:52:56.000-03:00;0.00;2026-08-05T06:52:56.000-03:00;49.18;0.00;;;
1747877149277;;SETTLEMENT;75.88;2026-08-05T06:52:56.000-03:00;0.00;2026-08-05T06:52:56.000-03:00;75.88;0.00;;;
1747877149277;;SETTLEMENT;4.47;2026-08-05T06:52:56.000-03:00;0.00;2026-08-05T06:52:56.000-03:00;4.47;0.00;;;
171227532649;available_money;SETTLEMENT;-3433.00;2026-08-05T00:21:48.000-03:00;0.00;2026-08-05T00:21:48.000-03:00;-3433.00;0.00;Mercado Pago;Checkouts;2026-08-28T23:26:52.000-03:00
171196499283;available_money;SETTLEMENT;-4027.00;2026-08-04T20:05:08.000-03:00;0.00;2026-08-04T20:05:09.000-03:00;-4027.00;0.00;Mercado Pago;Checkouts;2026-08-28T19:14:48.000-03:00
1747783184294;;SETTLEMENT;4.44;2026-08-04T03:49:25.000-03:00;0.00;2026-08-04T03:49:25.000-03:00;4.44;0.00;;;
1747783184294;;SETTLEMENT;75.31;2026-08-04T03:49:25.000-03:00;0.00;2026-08-04T03:49:25.000-03:00;75.31;0.00;;;
1747783184294;;SETTLEMENT;52.51;2026-08-04T03:49:25.000-03:00;0.00;2026-08-04T03:49:25.000-03:00;52.51;0.00;;;
1747695331131;;SETTLEMENT;8.73;2026-08-03T03:03:19.000-03:00;0.00;2026-08-03T03:03:19.000-03:00;8.73;0.00;;;
1747695331131;;SETTLEMENT;158.86;2026-08-03T03:03:19.000-03:00;0.00;2026-08-03T03:03:19.000-03:00;158.86;0.00;;;
1747695331131;;SETTLEMENT;221.56;2026-08-03T03:03:19.000-03:00;0.00;2026-08-03T03:03:19.000-03:00;221.56;0.00;;;
171709235566;bank_transfer;SETTLEMENT;40000.00;2026-08-02T12:44:02.000-03:00;0.00;2026-08-02T12:44:02.000-03:00;40000.00;0.00;;;2026-08-02T12:44:02.000-03:00`;

function parseCsv(text: string) {
  const lines = text.trim().split(/\r?\n/);
  const header = lines[0].split(";");
  return lines.slice(1).map((line) => {
    const parts = line.split(";");
    const obj: Record<string, string> = {};
    header.forEach((h, i) => {
      obj[h] = parts[i] ?? "";
    });
    return obj;
  });
}

function toDateYMD(iso: string) {
  if (!iso) return fechaHoy();
  const m = iso.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : fechaHoy();
}

function toCents(amount: string) {
  const num = parseFloat(amount || "0");
  if (isNaN(num)) return 0;
  return Math.round(Math.abs(num) * 100);
}

async function main() {
  const rows = parseCsv(csv);
  const [cuenta] = await db.select().from(cuentas).where(eq(cuentas.nombre, "Mercado Pago"));
  if (!cuenta) {
    console.error("No se encontró la cuenta Mercado Pago");
    process.exit(1);
  }

  // Agrupar servicios: grupos de 3 con mismo SOURCE_ID y sin PAYMENT_METHOD_TYPE
  const groups = new Map<string, typeof rows>();
  for (const r of rows) {
    const key = `${r.SOURCE_ID}|${r.TRANSACTION_DATE}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(r);
  }

  const inserted: any[] = [];
  const processed = new Set<string>();

  // Procesar grupos de 3 (servicios)
  for (const [key, group] of groups.entries()) {
    if (group.length === 3 && group.every((g) => !g.PAYMENT_METHOD_TYPE)) {
      const sum = group.reduce((acc, g) => acc + parseFloat(g.TRANSACTION_AMOUNT || "0"), 0);
      const fecha = toDateYMD(group[0].TRANSACTION_DATE);
      // evitar duplicados
      const exists = await db
        .select({ id: movimientos.id })
        .from(movimientos)
        .where(
          and(
            eq(movimientos.cuentaId, cuenta.id),
            eq(movimientos.fecha, fecha),
            eq(movimientos.categoria, "Servicios"),
            eq(movimientos.tipo, "gasto"),
            eq(movimientos.monto, toCents(sum.toString()))
          )
        )
        .limit(1);
      if (exists.length === 0) {
        const [m] = await db
          .insert(movimientos)
          .values({
            cuentaId: cuenta.id,
            tipo: "gasto",
            monto: toCents(sum.toString()),
            categoria: "Servicios",
            descripcion: `Servicios (Ecogas/EPEC/Municipalidad/EMOS) - ${fecha}`,
            fecha,
          })
          .returning();
        inserted.push(m);
      }
      for (const g of group) {
        processed.add(`${g.SOURCE_ID}|${g.TRANSACTION_DATE}|${g.TRANSACTION_AMOUNT}`);
      }
      continue;
    }
  }

  // Procesar resto
  for (const r of rows) {
    const pid = `${r.SOURCE_ID}|${r.TRANSACTION_DATE}|${r.TRANSACTION_AMOUNT}`;
    if (processed.has(pid)) continue;
    if (r.TRANSACTION_TYPE !== "SETTLEMENT") continue;

    const amt = parseFloat(r.TRANSACTION_AMOUNT || "0");
    const fecha = toDateYMD(r.TRANSACTION_DATE);

    if (r.PAYMENT_METHOD_TYPE === "bank_transfer") {
      if (amt > 0) {
        const exists = await db
          .select({ id: movimientos.id })
          .from(movimientos)
          .where(
            and(eq(movimientos.cuentaId, cuenta.id), eq(movimientos.fecha, fecha), eq(movimientos.tipo, "ingreso"), eq(movimientos.monto, toCents(amt.toString())))
          )
          .limit(1);
        if (exists.length === 0) {
          const [m] = await db
            .insert(movimientos)
            .values({ cuentaId: cuenta.id, tipo: "ingreso", monto: toCents(amt.toString()), categoria: "Transferencia", descripcion: `Transferencia bancaria - ${fecha}`, fecha })
            .returning();
          inserted.push(m);
        }
        continue;
      } else {
        const exists = await db
          .select({ id: movimientos.id })
          .from(movimientos)
          .where(
            and(eq(movimientos.cuentaId, cuenta.id), eq(movimientos.fecha, fecha), eq(movimientos.tipo, "gasto"), eq(movimientos.monto, toCents(amt.toString())))
          )
          .limit(1);
        if (exists.length === 0) {
          const [m] = await db
            .insert(movimientos)
            .values({ cuentaId: cuenta.id, tipo: "gasto", monto: toCents(amt.toString()), categoria: "Transferencia", descripcion: `Transferencia bancaria - ${fecha}`, fecha })
            .returning();
          inserted.push(m);
        }
        continue;
      }
    }

    if (r.PAYMENT_METHOD_TYPE === "available_money") {
      if (amt > 0) {
        const exists = await db
          .select({ id: movimientos.id })
          .from(movimientos)
          .where(
            and(eq(movimientos.cuentaId, cuenta.id), eq(movimientos.fecha, fecha), eq(movimientos.tipo, "ingreso"), eq(movimientos.monto, toCents(amt.toString())))
          )
          .limit(1);
        if (exists.length === 0) {
          const [m] = await db
            .insert(movimientos)
            .values({ cuentaId: cuenta.id, tipo: "ingreso", monto: toCents(amt.toString()), categoria: "Transferencia", descripcion: `Ingreso Mercado Pago - ${fecha}`, fecha })
            .returning();
          inserted.push(m);
        }
        continue;
      } else {
        const exists = await db
          .select({ id: movimientos.id })
          .from(movimientos)
          .where(
            and(eq(movimientos.cuentaId, cuenta.id), eq(movimientos.fecha, fecha), eq(movimientos.tipo, "gasto"), eq(movimientos.monto, toCents(amt.toString())))
          )
          .limit(1);
        if (exists.length === 0) {
          const desc = r.BUSINESS_UNIT === "Mercado Libre" ? `Compra Mercado Libre - ${fecha}` : r.BUSINESS_UNIT === "Mercado Pago" && r.SUB_UNIT === "QR" ? `Pago QR - ${fecha}` : r.BUSINESS_UNIT === "Mercado Pago" && r.SUB_UNIT === "Checkouts" ? `Pago con Mercado Pago - ${fecha}` : `Gasto Mercado Pago - ${fecha}`;
          const [m] = await db
            .insert(movimientos)
            .values({ cuentaId: cuenta.id, tipo: "gasto", monto: toCents(amt.toString()), categoria: "Transferencia", descripcion: desc, fecha })
            .returning();
          inserted.push(m);
        }
        continue;
      }
    }
  }

  console.log(`Insertados: ${inserted.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
