"""
ZANTARA Document Intelligence Router
AI-powered document analysis and extraction service
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Query, Form
from typing import Dict, List, Optional, Any
from datetime import datetime
import logging
import os
import json
import tempfile
from pathlib import Path
import PyPDF2
from PIL import Image
import pytesseract
import google.generativeai as genai
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ai/document-intelligence", tags=["document-intelligence"])

# Initialize Gemini for document analysis
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
vision_model = genai.GenerativeModel('gemini-1.5-flash')


# ================================================
# PYDANTIC MODELS
# ================================================

class DocumentAnalysisRequest(BaseModel):
    document_url: Optional[str] = None
    document_type: str = "auto"  # auto, passport, kitas, invoice, contract, legal
    extract_fields: Optional[List[str]] = None
    language: str = "en"  # en, id, mixed


class DocumentAnalysisResponse(BaseModel):
    document_id: str
    document_type: str
    confidence_score: float
    extracted_data: Dict[str, Any]
    entities: List[Dict[str, str]]
    summary: str
    warnings: List[str]
    processing_time_ms: float


class VisionAnalysisRequest(BaseModel):
    image_url: str
    analysis_type: str = "general"  # general, ocr, form, id-document
    extract_text: bool = True
    detect_entities: bool = True


# ================================================
# HELPER FUNCTIONS
# ================================================

def extract_text_from_pdf(file_path: str) -> str:
    """Extract text from PDF file"""
    text = ""
    try:
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            for page_num in range(len(pdf_reader.pages)):
                page = pdf_reader.pages[page_num]
                text += page.extract_text() + "\n"
    except Exception as e:
        logger.error(f"Error extracting PDF text: {e}")
        raise
    return text


def extract_text_from_image(file_path: str) -> str:
    """Extract text from image using OCR"""
    try:
        image = Image.open(file_path)
        text = pytesseract.image_to_string(image)
        return text
    except Exception as e:
        logger.error(f"Error extracting image text: {e}")
        raise


def analyze_with_gemini(text: str, document_type: str, extract_fields: List[str] = None) -> Dict:
    """Analyze document with Gemini AI"""
    
    prompt = f"""
    Analyze the following document text and extract structured information.
    Document Type: {document_type}
    
    Tasks:
    1. Identify and extract key information based on document type
    2. Extract all named entities (people, organizations, dates, locations, amounts)
    3. Provide a concise summary
    4. Identify any potential issues or warnings
    
    {f"Specifically extract these fields: {', '.join(extract_fields)}" if extract_fields else ""}
    
    Document Text:
    {text[:5000]}  # Limit to first 5000 chars for API
    
    Return as JSON with structure:
    {{
        "document_type": "detected type",
        "confidence": 0.95,
        "extracted_fields": {{}},
        "entities": [],
        "summary": "",
        "warnings": []
    }}
    """
    
    try:
        response = vision_model.generate_content(prompt)
        
        # Parse JSON from response
        result_text = response.text
        # Clean up response to extract JSON
        if "```json" in result_text:
            result_text = result_text.split("```json")[1].split("```")[0]
        elif "```" in result_text:
            result_text = result_text.split("```")[1].split("```")[0]
            
        return json.loads(result_text)
    except Exception as e:
        logger.error(f"Gemini analysis error: {e}")
        return {
            "document_type": document_type,
            "confidence": 0.0,
            "extracted_fields": {},
            "entities": [],
            "summary": "Analysis failed",
            "warnings": [str(e)]
        }


def detect_document_type(text: str) -> str:
    """Auto-detect document type from content"""
    
    # Keywords for different document types
    type_keywords = {
        "passport": ["passport", "nationality", "date of birth", "place of birth"],
        "kitas": ["kitas", "temporary stay", "work permit", "immigration"],
        "invoice": ["invoice", "amount due", "payment", "billing"],
        "contract": ["agreement", "terms", "conditions", "party", "parties"],
        "legal": ["whereas", "hereby", "court", "jurisdiction"],
        "visa": ["visa", "entry", "duration of stay", "visa type"],
        "kbli": ["kbli", "business classification", "industry code"],
        "tax": ["npwp", "tax", "pajak", "spt"]
    }
    
    text_lower = text.lower()
    scores = {}
    
    for doc_type, keywords in type_keywords.items():
        score = sum(1 for keyword in keywords if keyword in text_lower)
        if score > 0:
            scores[doc_type] = score
    
    if scores:
        return max(scores, key=scores.get)
    return "general"


# ================================================
# ENDPOINTS
# ================================================

@router.post("/analyze", response_model=DocumentAnalysisResponse)
async def analyze_document(
    file: UploadFile = File(...),
    document_type: str = Form("auto"),
    extract_fields: Optional[str] = Form(None),
    language: str = Form("en")
):
    """
    Analyze uploaded document with AI
    
    Supports:
    - PDF documents
    - Images (JPG, PNG, TIFF)
    - Automatic document type detection
    - Custom field extraction
    - Multi-language support (EN, ID)
    """
    
    start_time = datetime.now()
    
    # Validate file type
    allowed_types = [".pdf", ".jpg", ".jpeg", ".png", ".tiff"]
    file_extension = Path(file.filename).suffix.lower()
    
    if file_extension not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Allowed: {', '.join(allowed_types)}"
        )
    
    # Save uploaded file temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as tmp_file:
        content = await file.read()
        tmp_file.write(content)
        tmp_path = tmp_file.name
    
    try:
        # Extract text based on file type
        if file_extension == ".pdf":
            extracted_text = extract_text_from_pdf(tmp_path)
        else:
            extracted_text = extract_text_from_image(tmp_path)
        
        # Auto-detect document type if needed
        if document_type == "auto":
            document_type = detect_document_type(extracted_text)
            logger.info(f"Auto-detected document type: {document_type}")
        
        # Parse extract fields
        fields_to_extract = extract_fields.split(",") if extract_fields else None
        
        # Analyze with Gemini
        analysis_result = analyze_with_gemini(extracted_text, document_type, fields_to_extract)
        
        # Calculate processing time
        processing_time = (datetime.now() - start_time).total_seconds() * 1000
        
        # Generate document ID
        import uuid
        document_id = str(uuid.uuid4())
        
        response = DocumentAnalysisResponse(
            document_id=document_id,
            document_type=analysis_result.get("document_type", document_type),
            confidence_score=analysis_result.get("confidence", 0.0),
            extracted_data=analysis_result.get("extracted_fields", {}),
            entities=analysis_result.get("entities", []),
            summary=analysis_result.get("summary", ""),
            warnings=analysis_result.get("warnings", []),
            processing_time_ms=processing_time
        )
        
        # Clean up temp file
        os.unlink(tmp_path)
        
        logger.info(f"✅ Document analyzed: {document_id} ({document_type})")
        
        return response
        
    except Exception as e:
        # Clean up temp file on error
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)
        
        logger.error(f"❌ Document analysis failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Document analysis failed: {str(e)}"
        )


@router.post("/vision/analyze")
async def analyze_with_vision(request: VisionAnalysisRequest):
    """
    Analyze image using Gemini Vision API
    
    Supports:
    - General image analysis
    - OCR text extraction
    - Form detection and extraction
    - ID document analysis
    """
    
    try:
        start_time = datetime.now()
        
        # Prepare prompt based on analysis type
        prompts = {
            "general": "Describe this image in detail. What do you see?",
            "ocr": "Extract all text from this image. Format it clearly.",
            "form": "This is a form. Extract all fields and their values as structured data.",
            "id-document": "This is an identity document. Extract all personal information, document numbers, and dates."
        }
        
        prompt = prompts.get(request.analysis_type, prompts["general"])
        
        # Add specific instructions
        if request.extract_text:
            prompt += "\nExtract and list all visible text."
        if request.detect_entities:
            prompt += "\nIdentify all entities (names, dates, numbers, organizations)."
            
        # Use Gemini Vision for analysis
        import requests
        from io import BytesIO
        
        # Download image
        image_response = requests.get(request.image_url)
        if image_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to download image")
            
        # Save temporarily for Gemini
        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp_file:
            tmp_file.write(image_response.content)
            tmp_path = tmp_file.name
            
        # Analyze with Gemini Vision
        image = Image.open(tmp_path)
        response = vision_model.generate_content([prompt, image])
        
        # Clean up
        os.unlink(tmp_path)
        
        processing_time = (datetime.now() - start_time).total_seconds() * 1000
        
        return {
            "analysis_type": request.analysis_type,
            "result": response.text,
            "processing_time_ms": processing_time,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"❌ Vision analysis failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Vision analysis failed: {str(e)}"
        )


@router.post("/extract/passport")
async def extract_passport_data(file: UploadFile = File(...)):
    """
    Specialized passport data extraction
    
    Extracts:
    - Full name
    - Passport number
    - Nationality
    - Date of birth
    - Place of birth
    - Issue date
    - Expiry date
    - MRZ code
    """
    
    # Reuse analyze_document with specific parameters
    return await analyze_document(
        file=file,
        document_type="passport",
        extract_fields="full_name,passport_number,nationality,date_of_birth,place_of_birth,issue_date,expiry_date,mrz_code",
        language="en"
    )


@router.post("/extract/kitas")
async def extract_kitas_data(file: UploadFile = File(...)):
    """
    Specialized KITAS data extraction
    
    Extracts:
    - Full name
    - KITAS number
    - Passport number
    - Sponsor
    - Valid from/to dates
    - Purpose of stay
    - Address in Indonesia
    """
    
    return await analyze_document(
        file=file,
        document_type="kitas",
        extract_fields="full_name,kitas_number,passport_number,sponsor,valid_from,valid_to,purpose,address",
        language="mixed"
    )


@router.post("/extract/invoice")
async def extract_invoice_data(file: UploadFile = File(...)):
    """
    Extract invoice information
    
    Extracts:
    - Invoice number
    - Date
    - Vendor/seller info
    - Buyer info
    - Line items
    - Total amount
    - Tax information
    - Payment terms
    """
    
    return await analyze_document(
        file=file,
        document_type="invoice",
        extract_fields="invoice_number,date,vendor,buyer,items,subtotal,tax,total,payment_terms",
        language="mixed"
    )


@router.get("/templates")
async def get_extraction_templates():
    """
    Get available document extraction templates
    
    Returns predefined templates for common document types
    """
    
    templates = {
        "passport": {
            "name": "Passport",
            "fields": [
                {"key": "full_name", "label": "Full Name", "type": "text"},
                {"key": "passport_number", "label": "Passport Number", "type": "text"},
                {"key": "nationality", "label": "Nationality", "type": "text"},
                {"key": "date_of_birth", "label": "Date of Birth", "type": "date"},
                {"key": "place_of_birth", "label": "Place of Birth", "type": "text"},
                {"key": "issue_date", "label": "Issue Date", "type": "date"},
                {"key": "expiry_date", "label": "Expiry Date", "type": "date"}
            ]
        },
        "kitas": {
            "name": "KITAS/KITAP",
            "fields": [
                {"key": "full_name", "label": "Full Name", "type": "text"},
                {"key": "kitas_number", "label": "KITAS Number", "type": "text"},
                {"key": "passport_number", "label": "Passport Number", "type": "text"},
                {"key": "sponsor", "label": "Sponsor", "type": "text"},
                {"key": "valid_from", "label": "Valid From", "type": "date"},
                {"key": "valid_to", "label": "Valid To", "type": "date"},
                {"key": "purpose", "label": "Purpose of Stay", "type": "text"}
            ]
        },
        "invoice": {
            "name": "Invoice",
            "fields": [
                {"key": "invoice_number", "label": "Invoice Number", "type": "text"},
                {"key": "date", "label": "Date", "type": "date"},
                {"key": "vendor", "label": "Vendor", "type": "object"},
                {"key": "buyer", "label": "Buyer", "type": "object"},
                {"key": "items", "label": "Line Items", "type": "array"},
                {"key": "total", "label": "Total Amount", "type": "number"},
                {"key": "tax", "label": "Tax", "type": "number"}
            ]
        },
        "contract": {
            "name": "Contract/Agreement",
            "fields": [
                {"key": "title", "label": "Contract Title", "type": "text"},
                {"key": "parties", "label": "Parties", "type": "array"},
                {"key": "effective_date", "label": "Effective Date", "type": "date"},
                {"key": "expiry_date", "label": "Expiry Date", "type": "date"},
                {"key": "terms", "label": "Key Terms", "type": "array"},
                {"key": "signatures", "label": "Signatures", "type": "array"}
            ]
        },
        "npwp": {
            "name": "NPWP (Tax ID)",
            "fields": [
                {"key": "npwp_number", "label": "NPWP Number", "type": "text"},
                {"key": "name", "label": "Name", "type": "text"},
                {"key": "address", "label": "Address", "type": "text"},
                {"key": "registration_date", "label": "Registration Date", "type": "date"},
                {"key": "tax_office", "label": "Tax Office", "type": "text"}
            ]
        }
    }
    
    return {
        "templates": templates,
        "supported_formats": ["pdf", "jpg", "jpeg", "png", "tiff"],
        "languages": ["en", "id", "mixed"],
        "max_file_size_mb": 10
    }


@router.get("/health")
async def document_intelligence_health():
    """Health check for document intelligence service"""
    
    try:
        # Check Gemini API
        test_response = vision_model.generate_content("Test")
        
        return {
            "status": "healthy",
            "service": "document-intelligence",
            "gemini_api": "connected",
            "ocr_available": True,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Document Intelligence service unhealthy: {str(e)}"
        )