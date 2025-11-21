/**
 * Machine Learning Module
 * Centralized ML resources, datasets, and quality reports
 */

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const mlPaths = {
  datasets: path.resolve(__dirname, 'datasets'),
  logs: path.resolve(__dirname, 'logs'),
  qualityReportExtracted: path.resolve(__dirname, 'logs', 'quality_report_extracted.json'),
  qualityReportGenerated: path.resolve(__dirname, 'logs', 'quality_report_generated.json'),
};

export function getMLPath(resource: keyof typeof mlPaths): string {
  return mlPaths[resource];
}
