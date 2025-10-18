import { ok } from "../../utils/response.js";
import { BadRequestError } from "../../utils/errors.js";
import { forwardToBridgeIfSupported } from "../../services/bridgeProxy.js";
import { getSlides } from "../../services/google-auth-service.js";
export async function slidesCreate(params) {
    const { title = 'Untitled Presentation' } = params || {};
    const slides = await getSlides();
    if (slides) {
        const res = await slides.presentations.create({
            requestBody: { title }
        });
        const presentationId = res.data.presentationId;
        const presentation = res.data;
        return ok({
            presentationId,
            title,
            url: `https://docs.google.com/presentation/d/${presentationId}`,
            slides: presentation.slides?.length || 0,
            created: new Date().toISOString()
        });
    }
    const bridged = await forwardToBridgeIfSupported('slides.create', params);
    if (bridged)
        return bridged;
    throw new BadRequestError('Slides not configured');
}
export async function slidesRead(params) {
    const { presentationId } = params || {};
    if (!presentationId)
        throw new BadRequestError('presentationId is required');
    const slides = await getSlides();
    if (slides) {
        try {
            const res = await slides.presentations.get({ presentationId });
            const presentation = res.data;
            // Extract text content from slides
            const slidesContent = [];
            if (presentation.slides) {
                for (const slide of presentation.slides) {
                    const slideContent = {
                        objectId: slide.objectId,
                        text: ''
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
                    url: `https://docs.google.com/presentation/d/${presentation.presentationId}`
                },
                slides: slidesContent,
                slideCount: slidesContent.length
            });
        }
        catch (error) {
            if (error.code === 404) {
                throw new BadRequestError('Presentation not found');
            }
            throw error;
        }
    }
    const bridged = await forwardToBridgeIfSupported('slides.read', params);
    if (bridged)
        return bridged;
    throw new BadRequestError('Slides not configured');
}
export async function slidesUpdate(params) {
    const { presentationId, requests } = params || {};
    if (!presentationId)
        throw new BadRequestError('presentationId is required');
    if (!requests || !Array.isArray(requests))
        throw new BadRequestError('requests array is required');
    const slides = await getSlides();
    if (slides) {
        try {
            const res = await slides.presentations.batchUpdate({
                presentationId,
                requestBody: { requests }
            });
            return ok({
                presentationId,
                replies: res.data.replies || [],
                writeControl: res.data.writeControl
            });
        }
        catch (error) {
            if (error.code === 404) {
                throw new BadRequestError('Presentation not found');
            }
            throw error;
        }
    }
    const bridged = await forwardToBridgeIfSupported('slides.update', params);
    if (bridged)
        return bridged;
    throw new BadRequestError('Slides not configured');
}
