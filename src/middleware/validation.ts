// Validation Middleware for Anti-Hallucination
import { Request, Response, NextFunction } from "express";
import { AntiHallucinationSystem } from "../services/anti-hallucination.js";

const validator = AntiHallucinationSystem.getInstance();

/**
 * Middleware to validate and ground handler responses
 */
export function validateResponse() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to validate responses
    res.json = function(body: any) {
      // Only validate API responses, not health checks or static responses
      const shouldValidate = req.path.includes('/call') ||
                           req.path.includes('/ai') ||
                           req.path.includes('/zara');

      if (shouldValidate && body) {
        // Run validation asynchronously without blocking response
        validator.validateHandlerResponse(
          req.body?.key || req.path.split('/').pop() || 'unknown',
          req.body?.params || req.body,
          body
        ).then(validated => {
          // Add validation metadata to response
          if (body.ok !== false) {
            body.grounded = validated.grounded;
            body.confidence = validated.confidence;

            // Add warnings if any
            if (validated.warnings && validated.warnings.length > 0) {
              body.validation_warnings = validated.warnings;
            }
          }

          // Log low-confidence responses
          if (validated.confidence < 0.7) {
            console.warn(`⚠️ Low confidence response (${validated.confidence})`);
          }
        }).catch(error => {
          console.error('Validation error:', error);
        });
      }

      return originalJson(body);
    };

    next();
  };
}

/**
 * Endpoint to get validation report
 */
export async function getValidationReport(_req: Request, res: Response) {
  const report = validator.getVerificationReport();

  res.json({
    ok: true,
    data: {
      ...report,
      message: "Anti-hallucination system report",
      timestamp: new Date().toISOString()
    }
  });
}

/**
 * Endpoint to clear unverified facts
 */
export async function clearUnverifiedFacts(_req: Request, res: Response) {
  validator.clearUnverifiedFacts();

  res.json({
    ok: true,
    data: {
      message: "Unverified facts cleared",
      timestamp: new Date().toISOString()
    }
  });
}