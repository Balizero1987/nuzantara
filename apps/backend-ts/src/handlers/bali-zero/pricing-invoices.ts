/**
 * Handler #25: Invoice Management
 * Generates, tracks, and manages payment invoices
 *
 * Features:
 * - Generate invoices for services
 * - Track payment status
 * - Manage invoice history
 * - Calculate totals and taxes
 */

import { z } from 'zod';
import { ok } from '../../utils/response.js';
import { logger } from '../../logging/unified-logger.js';

const InvoiceGeneratorSchema = z.object({
  service: z.string(),
  date_range: z
    .object({
      start: z.string().optional(), // ISO date
      end: z.string().optional(), // ISO date
    })
    .optional(),
  include_tax: z.boolean().default(true),
  currency: z.enum(['IDR', 'USD']).default('IDR'),
});

const InvoiceQuerySchema = z.object({
  invoice_id: z.string().optional(),
  status: z.enum(['pending', 'paid', 'overdue', 'all']).default('all'),
  limit: z.number().default(10),
});

// Mock invoice data structure
interface InvoiceRecord {
  invoice_id: string;
  service: string;
  date: string;
  amount: number;
  currency: string;
  tax: number;
  total: number;
  status: 'pending' | 'paid' | 'overdue';
  due_date: string;
  payment_date?: string;
}

// Generate mock invoices based on service type
function generateInvoiceData(service: string, currency: string): InvoiceRecord {
  const services: Record<string, { base_amount: number; tax_rate: number }> = {
    visa_c1_tourism: { base_amount: 2300000, tax_rate: 0.1 },
    visa_c2_business: { base_amount: 3600000, tax_rate: 0.1 },
    kitas_freelance: { base_amount: 26000000, tax_rate: 0.15 },
    kitas_working: { base_amount: 34500000, tax_rate: 0.15 },
    pt_setup: { base_amount: 20000000, tax_rate: 0.1 },
    tax_report_monthly: { base_amount: 1500000, tax_rate: 0.05 },
    tax_report_annual: { base_amount: 4000000, tax_rate: 0.1 },
    subscription_professional: { base_amount: 12999000, tax_rate: 0.1 },
    subscription_enterprise: { base_amount: 49999000, tax_rate: 0.1 },
  };

  const service_data = services[service] || { base_amount: 5000000, tax_rate: 0.1 };

  // Convert to USD if needed
  const exchange_rate = 15600; // Approximate IDR to USD
  const base_amount =
    currency === 'USD' ? service_data.base_amount / exchange_rate : service_data.base_amount;

  const tax = Math.round(base_amount * service_data.tax_rate);
  const total = base_amount + tax;

  const invoice_date = new Date();
  const due_date = new Date(invoice_date);
  due_date.setDate(due_date.getDate() + 30);

  return {
    invoice_id: `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    service,
    date: invoice_date.toISOString().split('T')[0],
    amount: base_amount,
    currency,
    tax,
    total,
    status: Math.random() > 0.3 ? 'paid' : 'pending',
    due_date: due_date.toISOString().split('T')[0],
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function generateInvoice(params: any) {
  try {
    const p = InvoiceGeneratorSchema.parse(params);
    logger.info('Generating invoice', { service: p.service });

    const invoice = generateInvoiceData(p.service, p.currency);

    const response = {
      ok: true,
      invoice: {
        invoice_id: invoice.invoice_id,
        invoice_date: invoice.date,
        due_date: invoice.due_date,
        service: {
          name: p.service,
          description: `Bali Zero service: ${p.service.replace(/_/g, ' ')}`,
        },
        items: [
          {
            description: p.service.replace(/_/g, ' '),
            quantity: 1,
            unit_price: invoice.amount,
            line_total: invoice.amount,
          },
        ],
        subtotal: invoice.amount,
        tax: invoice.tax,
        tax_rate: (invoice.tax / invoice.amount) * 100,
        total: invoice.total,
        currency: p.currency,
        payment_status: invoice.status,
        payment_terms: '30 days',
      },
      payment_info: {
        bank_transfer: {
          bank: 'BCA',
          account_name: 'PT Bali Zero Indonesia',
          account_number: '1234567890',
        },
        wire_transfer: {
          swift: 'BCABIDJA',
          account: 'USD Account',
        },
        payment_methods: ['Bank Transfer', 'Wire Transfer', 'Credit Card'],
      },
      contact_info: {
        billing_email: 'billing@balizero.com',
        support_email: 'support@balizero.com',
        phone: '+62 813 3805 1876',
      },
    };

    return ok(response);
  } catch (error: any) {
    logger.error({ error: error.message }, 'Generate invoice error');
    return ok({
      error: 'Failed to generate invoice',
      message: error.message,
    });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getInvoiceDetails(params: any) {
  try {
    const { invoice_id } = params || {};

    if (!invoice_id) {
      return ok({
        error: 'invoice_id is required',
        example: 'INV-1234567890-abc123def45',
      });
    }

    logger.info('Fetching invoice details', { invoice_id });

    // Mock invoice retrieval
    const invoice: InvoiceRecord = {
      invoice_id,
      service: 'kitas_working',
      date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      amount: 34500000,
      currency: 'IDR',
      tax: 5175000,
      total: 39675000,
      status: 'paid',
      due_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      payment_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    };

    const response = {
      ok: true,
      invoice: {
        invoice_id: invoice.invoice_id,
        invoice_date: invoice.date,
        due_date: invoice.due_date,
        service: invoice.service,
        amount: invoice.amount,
        tax: invoice.tax,
        total: invoice.total,
        currency: invoice.currency,
        status: invoice.status,
        payment_date: invoice.payment_date,
        days_to_due:
          invoice.status === 'paid'
            ? 0
            : Math.floor(
                (new Date(invoice.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
              ),
      },
      payment_status_info: {
        current_status: invoice.status,
        last_payment: invoice.payment_date,
        amount_paid: invoice.status === 'paid' ? invoice.total : 0,
        amount_due: invoice.status === 'paid' ? 0 : invoice.total,
      },
      actions: {
        can_download_pdf: true,
        can_request_receipt: true,
        can_dispute: invoice.status === 'paid' && Math.random() > 0.8,
      },
    };

    return ok(response);
  } catch (error: any) {
    logger.error({ error: error.message }, 'Get invoice details error');
    return ok({
      error: 'Failed to fetch invoice details',
    });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getInvoiceHistory(params: any) {
  try {
    const p = InvoiceQuerySchema.parse(params || {});
    logger.info('Fetching invoice history', { status: p.status, limit: p.limit });

    // Generate mock invoice history
    const invoices: InvoiceRecord[] = [];
    const services = [
      'visa_c1_tourism',
      'kitas_working',
      'pt_setup',
      'tax_report_monthly',
      'subscription_professional',
    ];

    for (let i = 0; i < p.limit; i++) {
      const service = services[i % services.length];
      const invoice = generateInvoiceData(service, 'IDR');
      invoices.push(invoice);
    }

    // Filter by status
    const filtered =
      p.status === 'all' ? invoices : invoices.filter((inv) => inv.status === p.status);

    const response = {
      ok: true,
      invoices: filtered.map((inv) => ({
        invoice_id: inv.invoice_id,
        service: inv.service,
        date: inv.date,
        amount: inv.amount,
        total: inv.total,
        currency: inv.currency,
        status: inv.status,
        due_date: inv.due_date,
        payment_date: inv.payment_date,
      })),
      summary: {
        total_count: filtered.length,
        by_status: {
          paid: filtered.filter((inv) => inv.status === 'paid').length,
          pending: filtered.filter((inv) => inv.status === 'pending').length,
          overdue: filtered.filter((inv) => inv.status === 'overdue').length,
        },
        total_amount: filtered.reduce((sum, inv) => sum + inv.total, 0),
        currency: 'IDR',
      },
    };

    return ok(response);
  } catch (error: any) {
    logger.error({ error: error.message }, 'Get invoice history error');
    return ok({
      error: 'Failed to fetch invoice history',
      message: error.message,
    });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function downloadInvoice(params: any) {
  try {
    const { invoice_id, format = 'pdf' } = params || {};

    if (!invoice_id) {
      return ok({
        error: 'invoice_id is required',
      });
    }

    logger.info('Downloading invoice', { invoice_id, format });

    const response = {
      ok: true,
      download_info: {
        invoice_id,
        format,
        filename: `${invoice_id}.${format}`,
        download_url: `https://api.balizero.com/invoices/${invoice_id}/download?format=${format}`,
        expires_in: 3600, // 1 hour
        created_at: new Date().toISOString(),
      },
      note: 'Download link is valid for 1 hour',
    };

    return ok(response);
  } catch (error: any) {
    logger.error({ error: error.message }, 'Download invoice error');
    return ok({
      error: 'Failed to download invoice',
    });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function calculateInvoiceTotals(params: any) {
  try {
    const { services, tax_rate = 0.1 } = params || {};

    if (!services || !Array.isArray(services)) {
      return ok({
        error: 'services array is required',
        example: {
          services: [
            { name: 'visa_c1', amount: 2300000 },
            { name: 'tax_report', amount: 1500000 },
          ],
          tax_rate: 0.1,
        },
      });
    }

    logger.info({ service_count: services.length }, 'Calculating invoice totals');

    let subtotal = 0;
    const line_items: any[] = [];

    for (const service of services) {
      const amount = service.amount || 0;
      subtotal += amount;
      line_items.push({
        service: service.name,
        amount,
        tax: Math.round(amount * tax_rate),
      });
    }

    const total_tax = Math.round(subtotal * tax_rate);
    const total = subtotal + total_tax;

    const response = {
      ok: true,
      calculation: {
        items: line_items,
        subtotal,
        tax_rate: (tax_rate * 100).toFixed(1) + '%',
        total_tax,
        total,
        currency: 'IDR',
      },
      summary: {
        item_count: services.length,
        subtotal,
        tax_amount: total_tax,
        grand_total: total,
      },
    };

    return ok(response);
  } catch (error: any) {
    logger.error({ error: error.message }, 'Calculate invoice totals error');
    return ok({
      error: 'Failed to calculate totals',
      message: error.message,
    });
  }
}
