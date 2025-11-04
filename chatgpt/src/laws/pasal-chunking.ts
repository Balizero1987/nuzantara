import { laws } from './immigration-laws.js';

interface PasalChunk {
  chunk_id: string;
  chunk_type: 'pasal';
  pasal_number: string;
  ayat_number?: string;
  title: string;
  text_id: string;
  text_en?: string;
  context: {
    bab?: string;
    bagian?: string;
    preceding_pasal?: string;
    following_pasal?: string;
  };
  legal_signals: {
    obligation: boolean;
    prohibition: boolean;
    right: boolean;
    penalty: boolean;
    exception: boolean;
    procedure: boolean;
  };
  entities: {
    subjects: string[];
    objects: string[];
    institutions: string[];
    documents: string[];
  };
  keywords_id: string[];
  keywords_en?: string[];
  cross_references: string[];
  effective_date?: string;
  citations: {
    source: string;
    page: number;
    line_range: [number, number];
  }[];
}

function chunkPasal(lawId: string, pasalNumber: string, text: string): PasalChunk {
  return {
    chunk_id: `${lawId}-Pasal-${pasalNumber}`,
    chunk_type: 'pasal',
    pasal_number: pasalNumber,
    title: `Pasal ${pasalNumber}`,
    text_id: text,
    context: {},
    legal_signals: {
      obligation: false,
      prohibition: false,
      right: false,
      penalty: false,
      exception: false,
      procedure: false,
    },
    entities: {
      subjects: [],
      objects: [],
      institutions: [],
      documents: [],
    },
    keywords_id: [],
    cross_references: [],
    citations: [],
  };
}

// Example usage
const pasalChunks = laws.map((law) => {
  // Replace with actual Pasal extraction logic
  return chunkPasal(law.law, '1', 'Example text for Pasal 1');
});

console.log(pasalChunks);
export { chunkPasal, pasalChunks };
