import { ok } from '../../utils/response.js';
import { BadRequestError } from '../../utils/errors.js';
import { getSlides } from '../../services/google-auth-service.js';

// Param interfaces
export interface SlidesCreateParams {
  title?: string;
}
export interface SlidesReadParams {
  presentationId: string;
}
export interface SlidesUpdateParams {
  presentationId: string;
  requests: any[];
}

// Result interfaces
export interface SlidesCreateResult {
  presentationId: string;
  title: string;
  url: string;
  slides: number;
  created: string;
}
export interface SlidesReadResult {
  presentation: { presentationId?: string; title?: string; revisionId?: string; url: string };
  slides: Array<{ objectId?: string; text: string }>;
  slideCount: number;
}
export interface SlidesUpdateResult {
  presentationId: string;
  replies: any[];
  writeControl?: any;
}

export async function slidesCreate(params: SlidesCreateParams) {
  const { title = 'Untitled Presentation' } = params || {};

  const slides = await getSlides();
  if (slides) {
    const res = await slides.presentations.create({
      requestBody: { title },
    });

    const presentationId = res.data.presentationId!;
    const presentation = res.data;

    return ok({
      presentationId,
      title,
      url: `https://docs.google.com/presentation/d/${presentationId}`,
      slides: presentation.slides?.length || 0,
      created: new Date().toISOString(),
    });
  }
  throw new BadRequestError('Slides not configured');
}

export async function slidesRead(params: SlidesReadParams) {
  const { presentationId } = params || ({} as SlidesReadParams);
  if (!presentationId) throw new BadRequestError('presentationId is required');

  const slides = await getSlides();
  if (slides) {
    try {
      const res = await slides.presentations.get({ presentationId });
      const presentation = res.data;

      // Extract text content from slides
      const slidesContent = [];
      if (presentation.slides) {
        for (const slide of presentation.slides) {
          const slideContent: any = {
            objectId: slide.objectId,
            text: '',
          };

          if (slide.pageElements) {
            for (const element of slide.pageElements) {
              if (element.shape?.text?.textElements) {
                for (const textElement of element.shape.text.textElements) {
                  if (textElement.textRun?.content) {
                    slideContent.text += textElement.textRun.content;
                  }
                }
              }
            }
          }
          slidesContent.push(slideContent);
        }
      }

      return ok({
        presentation: {
          presentationId: presentation.presentationId,
          title: presentation.title,
          revisionId: presentation.revisionId,
          url: `https://docs.google.com/presentation/d/${presentation.presentationId}`,
        },
        slides: slidesContent,
        slideCount: slidesContent.length,
      });
    } catch (error: any) {
      if (error.code === 404) {
        throw new BadRequestError('Presentation not found');
      }
      throw error;
    }
  }
  throw new BadRequestError('Slides not configured');
}

export async function slidesUpdate(params: SlidesUpdateParams) {
  const { presentationId, requests } = params || ({} as SlidesUpdateParams);
  if (!presentationId) throw new BadRequestError('presentationId is required');
  if (!requests || !Array.isArray(requests))
    throw new BadRequestError('requests array is required');

  const slides = await getSlides();
  if (slides) {
    try {
      const res = await slides.presentations.batchUpdate({
        presentationId,
        requestBody: { requests },
      });

      return ok({
        presentationId,
        replies: res.data.replies || [],
        writeControl: res.data.writeControl,
      });
    } catch (error: any) {
      if (error.code === 404) {
        throw new BadRequestError('Presentation not found');
      }
      throw error;
    }
  }
  throw new BadRequestError('Slides not configured');
}
