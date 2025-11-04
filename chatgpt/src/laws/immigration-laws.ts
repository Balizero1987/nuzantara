import { z } from 'zod';

// Define the schema for critical signals
const LawSignalSchema = z.object({
  visa_type: z.enum(['tourist', 'business', 'KITAS', 'KITAP']),
  duration: z.enum(['30d', '60d', '1yr', '2yr', '5yr', 'permanent']),
  applies_to: z.enum(['WNI', 'WNA']),
  sponsorship_required: z.boolean(),
  work_permit_required: z.boolean(),
  eligible_sectors: z.array(z.string()).optional(),
  quota_limits: z.record(z.string(), z.number()).optional(),
  minimum_salary: z.number().optional(),
  local_worker_ratio: z.tuple([z.number(), z.number()]).optional(),
  renewal_process: z.enum(['automatic', 'manual', 'requirements']).optional(),
  enacted_date: z.string().optional(),
  status: z.enum(['in_force', 'amended', 'repealed']).optional(),
  sectors: z.array(z.string()).optional(),
  annexes: z.array(z.string()).optional(),
});

// Define the laws and their critical signals
const laws = [
  {
    law: 'UU 6/2011',
    signals: {
      visa_type: 'KITAS',
      duration: '1yr',
      applies_to: 'WNA',
      sponsorship_required: true,
      work_permit_required: true,
      eligible_sectors: ['KBLI 6201', 'KBLI 6202'],
      quota_limits: { 'KBLI 6201': 10, 'KBLI 6202': 5 },
      minimum_salary: 50000000,
      local_worker_ratio: [3, 1],
      renewal_process: 'manual',
      enacted_date: '2011-05-05',
      status: 'in_force',
      sectors: ['Technology', 'Education'],
      annexes: ['Lampiran I', 'Lampiran II'],
    },
  },
  {
    law: 'PP 31/2013',
    signals: {
      visa_type: 'KITAP',
      duration: 'permanent',
      applies_to: 'WNA',
      sponsorship_required: true,
      work_permit_required: false,
      eligible_sectors: ['KBLI 6201'],
      quota_limits: { 'KBLI 6201': 2 },
      minimum_salary: 0,
      local_worker_ratio: [1, 1],
      renewal_process: 'automatic',
      enacted_date: '2013-07-15',
      status: 'in_force',
      sectors: ['Technology'],
      annexes: ['Lampiran III'],
    },
  },
  // Add other laws here
];

export { LawSignalSchema, laws };
