/**
 * Monthly labour/profit helpers — run: npx --yes tsx lib/dashboard-profit.test.ts
 */
import {
  monthlyProfitFromInvoices,
  profitNetFromInvoice,
} from "./dashboard-profit";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

const now = new Date(2026, 9, 9); // Oct 9, 2026

{
  const bill = {
    documentType: "BILL",
    createdAt: "2026-10-05T10:00:00.000Z",
    service: {
      lineItems: [
        {
          rate: 100,
          quantity: 1,
          discountPercent: 0,
          itemKind: "GENERAL",
        },
        {
          rate: 400,
          quantity: 1,
          discountPercent: 10,
          itemKind: "PROFIT",
        },
      ],
    },
  };
  // 400 - 10% = 360
  assert(profitNetFromInvoice(bill) === 360, "profit nets only PROFIT lines");
}

{
  const estimate = {
    documentType: "ESTIMATE",
    createdAt: "2026-10-05T10:00:00.000Z",
    service: {
      lineItems: [
        { rate: 500, quantity: 1, discountPercent: 0, itemKind: "PROFIT" },
      ],
    },
  };
  assert(profitNetFromInvoice(estimate) === 0, "estimates excluded");
}

{
  const legacy = {
    documentType: "BILL",
    createdAt: "2026-10-05T10:00:00.000Z",
    service: {
      lineItems: [
        { rate: 200, quantity: 1, discountPercent: 0 }, // no itemKind
      ],
    },
  };
  assert(profitNetFromInvoice(legacy) === 0, "legacy lines without kind = 0");
}

{
  const invoices = [
    {
      documentType: "BILL",
      createdAt: "2026-10-01T00:00:00.000Z",
      service: {
        lineItems: [
          { rate: 100, quantity: 1, discountPercent: 0, itemKind: "PROFIT" },
        ],
      },
    },
    {
      documentType: "BILL",
      createdAt: "2026-09-20T00:00:00.000Z",
      service: {
        lineItems: [
          { rate: 999, quantity: 1, discountPercent: 0, itemKind: "PROFIT" },
        ],
      },
    },
    {
      documentType: "ESTIMATE",
      createdAt: "2026-10-02T00:00:00.000Z",
      service: {
        lineItems: [
          { rate: 50, quantity: 1, discountPercent: 0, itemKind: "PROFIT" },
        ],
      },
    },
  ];
  assert(
    monthlyProfitFromInvoices(invoices, now) === 100,
    "monthly sum only Oct BILL profit lines"
  );
}

assert(monthlyProfitFromInvoices([], now) === 0, "empty invoices");
assert(monthlyProfitFromInvoices(null as any, now) === 0, "null invoices");

console.log("dashboard-profit.test.ts: all passed");
