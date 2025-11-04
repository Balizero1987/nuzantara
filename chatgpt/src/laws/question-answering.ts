import { laws } from './immigration-laws.js';

// Define the type for a law signal
interface LawSignal {
  law: string;
  signals: {
    visa_type: 'tourist' | 'business' | 'KITAS' | 'KITAP';
    duration: '30d' | '60d' | '1yr' | '2yr' | '5yr' | 'permanent';
    applies_to: 'WNI' | 'WNA';
    sponsorship_required: boolean;
    work_permit_required: boolean;
    eligible_sectors?: string[];
    quota_limits?: Record<string, number>;
    minimum_salary?: number;
    local_worker_ratio?: [number, number];
    renewal_process?: 'automatic' | 'manual' | 'requirements';
  };
}

// Function to process user queries
function answerQuestion(query: string): string {
  // Normalize the query
  const lowerQuery = query.toLowerCase();

  // Check for specific keywords and respond accordingly
  if (lowerQuery.includes('tourist visa')) {
    return 'Tourist visas are not eligible for work in Indonesia.';
  }

  if (lowerQuery.includes('work in indonesia') && lowerQuery.includes('tourist visa')) {
    return 'You cannot work in Indonesia with a tourist visa. Consider applying for a KITAS or KITAP.';
  }

  if (
    lowerQuery.includes('local worker requirement') ||
    lowerQuery.includes('local worker ratio')
  ) {
    const ratios = laws.map((law: LawSignal) => {
      if (law.signals.local_worker_ratio) {
        return `${law.law}: ${law.signals.local_worker_ratio[0]} locals per ${law.signals.local_worker_ratio[1]} foreign workers.`;
      }
      return `${law.law}: No specific ratio.`;
    });
    return `Local worker requirements:
${ratios.join('\n')}`;
  }

  if (lowerQuery.includes('minimum salary')) {
    const salaries = laws.map((law: LawSignal) => {
      return `${law.law}: IDR ${law.signals.minimum_salary || 'Not specified'}`;
    });
    return `Minimum salary requirements:
${salaries.join('\n')}`;
  }

  return 'Sorry, I could not find an answer to your question. Please provide more details.';
}

export { answerQuestion };
