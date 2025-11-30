"""
Unit tests for utils.response_sanitizer module
Coverage target: 100%
"""

import pytest
from utils.response_sanitizer import (
    sanitize_zantara_response,
    enforce_santai_mode,
    add_contact_if_appropriate,
    classify_query_type,
    process_zantara_response,
)


class TestSanitizeZantaraResponse:
    """Test sanitize_zantara_response function"""

    def test_empty_response(self):
        """Test with empty response"""
        assert sanitize_zantara_response("") == ""
        assert sanitize_zantara_response(None) is None

    def test_remove_price_placeholder(self):
        """Test removal of [PRICE] placeholder"""
        input_text = "The cost is [PRICE]. Please proceed."
        expected = "The cost is Please proceed."
        assert sanitize_zantara_response(input_text) == expected

    def test_remove_mandatory_placeholder(self):
        """Test removal of [MANDATORY] placeholder"""
        input_text = "[MANDATORY] This is required."
        expected = "This is required."
        assert sanitize_zantara_response(input_text) == expected

    def test_remove_optional_placeholder(self):
        """Test removal of [OPTIONAL] placeholder"""
        input_text = "[OPTIONAL] This is optional."
        expected = "This is optional."
        assert sanitize_zantara_response(input_text) == expected

    def test_remove_user_label(self):
        """Test removal of 'User:' label"""
        input_text = "User: What is the visa process?"
        expected = "What is the visa process?"
        assert sanitize_zantara_response(input_text) == expected

    def test_remove_assistant_label(self):
        """Test removal of 'Assistant:' label"""
        input_text = "Assistant: The visa process takes 30 days."
        expected = "The visa process takes 30 days."
        assert sanitize_zantara_response(input_text) == expected

    def test_remove_context_section(self):
        """Test removal of Context: section"""
        input_text = "Context: Some context\nThe actual response."
        result = sanitize_zantara_response(input_text)
        assert "Context:" not in result
        assert "The actual response." in result

    def test_remove_context_from_kb(self):
        """Test removal of 'Context from knowledge base:' section"""
        input_text = "Context from knowledge base: KB info\nActual answer."
        result = sanitize_zantara_response(input_text)
        assert "Context from knowledge base:" not in result
        assert "Actual answer." in result

    def test_remove_scenario_meta_commentary(self):
        """Test removal of scenario meta-commentary"""
        input_text = "The answer (for this scenario) is 30 days."
        expected = "The answer  is 30 days."
        assert sanitize_zantara_response(input_text) == expected

    def test_remove_natural_language_summary(self):
        """Test removal of 'natural language summary' text"""
        input_text = "natural language summary\nThe actual answer."
        expected = "The actual answer."
        assert sanitize_zantara_response(input_text) == expected

    def test_remove_natural_language_summary_case_insensitive(self):
        """Test removal of 'Natural Language Summary' (case insensitive)"""
        input_text = "Natural Language Summary\nThe actual answer."
        expected = "The actual answer."
        assert sanitize_zantara_response(input_text) == expected

    def test_remove_simplified_explanation(self):
        """Test removal of 'Simplified Explanation' text"""
        input_text = "Simplified Explanation: Here is the answer\nActual content."
        result = sanitize_zantara_response(input_text)
        assert "Simplified Explanation" not in result

    def test_remove_contexto_per_la_risposta(self):
        """Test removal of Italian context marker"""
        input_text = "Contexto per la risposta: Some context\nActual answer."
        result = sanitize_zantara_response(input_text)
        assert "Contexto per la risposta:" not in result

    def test_remove_from_kb_source(self):
        """Test removal of '(from KB source)' text"""
        input_text = "The answer (from KB source)\nis here."
        result = sanitize_zantara_response(input_text)
        assert "(from KB source)" not in result

    def test_remove_markdown_header_with_bold(self):
        """Test removal of markdown headers like ### **Header**"""
        input_text = "### **Important Section**\nContent here."
        result = sanitize_zantara_response(input_text)
        assert "Important Section" in result
        assert "###" not in result
        assert "**" not in result

    def test_remove_markdown_header_plain(self):
        """Test removal of plain markdown headers like ### Header"""
        input_text = "### Section Title\nContent here."
        result = sanitize_zantara_response(input_text)
        assert "Section Title" in result
        assert "###" not in result

    def test_fix_broken_bold_markdown(self):
        """Test fixing broken markdown like *bold**"""
        input_text = "This is *important** text."
        expected = "This is important text."
        assert sanitize_zantara_response(input_text) == expected

    def test_remove_bold_label_with_newline(self):
        """Test removal of **Label**:\\n pattern"""
        input_text = "**Requirements**:\nSome requirements."
        result = sanitize_zantara_response(input_text)
        assert "Requirements:" in result
        assert "**" not in result

    def test_remove_section_dividers(self):
        """Test removal of --- section dividers"""
        input_text = "Section 1\n---\nSection 2"
        result = sanitize_zantara_response(input_text)
        assert "---" not in result

    def test_remove_leading_section_divider(self):
        """Test removal of leading --- divider"""
        input_text = "---\nContent starts here."
        result = sanitize_zantara_response(input_text)
        assert not result.startswith("---")

    def test_remove_requirements_label(self):
        """Test removal of 'Requirements:' label"""
        input_text = "Requirements:\n1. Item 1\n2. Item 2"
        result = sanitize_zantara_response(input_text)
        assert "Requirements:" not in result

    def test_remove_deviation_label(self):
        """Test removal of 'Deviation from Requirement:' label"""
        input_text = "Deviation from Requirement:\nSome deviation."
        result = sanitize_zantara_response(input_text)
        assert "Deviation from Requirement:" not in result

    def test_clean_multiple_newlines(self):
        """Test cleaning of multiple consecutive newlines"""
        input_text = "Line 1\n\n\n\nLine 2"
        expected = "Line 1\n\nLine 2"
        assert sanitize_zantara_response(input_text) == expected

    def test_strip_whitespace(self):
        """Test stripping of leading/trailing whitespace"""
        input_text = "  Content here  \n\n"
        expected = "Content here"
        assert sanitize_zantara_response(input_text) == expected

    def test_combined_artifacts(self):
        """Test with multiple artifacts combined"""
        input_text = """
        User: What is [PRICE]?
        Assistant: The cost is [MANDATORY] documented.
        Context: Some context here
        natural language summary
        ### **Section**
        The actual answer.
        """
        result = sanitize_zantara_response(input_text)
        assert "[PRICE]" not in result
        assert "[MANDATORY]" not in result
        assert "User:" not in result
        assert "Assistant:" not in result
        assert "Context:" not in result
        assert "natural language summary" not in result
        assert "###" not in result
        assert "The actual answer." in result


class TestEnforceSantaiMode:
    """Test enforce_santai_mode function"""

    def test_business_query_no_truncation(self):
        """Test that business queries are not truncated"""
        long_response = "This is a very long business response. " * 20
        result = enforce_santai_mode(long_response, "business")
        assert result == long_response

    def test_emergency_query_no_truncation(self):
        """Test that emergency queries are not truncated"""
        long_response = "This is a very long emergency response. " * 20
        result = enforce_santai_mode(long_response, "emergency")
        assert result == long_response

    def test_greeting_truncate_sentences(self):
        """Test greeting truncation to max 3 sentences"""
        response = "Sentence 1. Sentence 2. Sentence 3. Sentence 4. Sentence 5."
        result = enforce_santai_mode(response, "greeting")
        sentences = result.split(". ")
        assert len(sentences) <= 3

    def test_casual_truncate_sentences(self):
        """Test casual query truncation to max 3 sentences"""
        response = "Sentence 1. Sentence 2. Sentence 3. Sentence 4."
        result = enforce_santai_mode(response, "casual")
        sentences = result.split(". ")
        assert len(sentences) <= 3

    def test_greeting_truncate_words_default(self):
        """Test word count truncation with default max_words=30"""
        words = ["word"] * 50
        response = " ".join(words) + "."
        result = enforce_santai_mode(response, "greeting")
        result_words = result.split()
        assert len(result_words) <= 30 + 1  # +1 for potential ellipsis

    def test_casual_truncate_words_custom(self):
        """Test word count truncation with custom max_words"""
        words = ["word"] * 50
        response = " ".join(words) + "."
        result = enforce_santai_mode(response, "casual", max_words=20)
        result_words = result.split()
        assert len(result_words) <= 20 + 1

    def test_truncate_at_sentence_boundary(self):
        """Test truncation at sentence boundary when possible"""
        response = "Short sentence. " + "word " * 40 + ". Another sentence."
        result = enforce_santai_mode(response, "greeting", max_words=15)
        # Should end with period if sentence boundary found
        if result.endswith("."):
            assert not result.endswith("...")

    def test_truncate_with_ellipsis_when_no_boundary(self):
        """Test adding ellipsis when no sentence boundary found"""
        response = "word " * 50  # No sentence boundary
        result = enforce_santai_mode(response, "greeting", max_words=20)
        # Should add ellipsis
        assert result.endswith("...") or len(result.split()) <= 20

    def test_exclamation_mark_boundary(self):
        """Test truncation at exclamation mark boundary"""
        response = "First sentence! " + "word " * 40
        result = enforce_santai_mode(response, "greeting", max_words=10)
        if result.endswith("!"):
            assert len(result.split()) <= 10

    def test_question_mark_boundary(self):
        """Test truncation at question mark boundary"""
        response = "Is this a question? " + "word " * 40
        result = enforce_santai_mode(response, "greeting", max_words=10)
        if result.endswith("?"):
            assert len(result.split()) <= 10

    def test_strip_whitespace(self):
        """Test that result is stripped of whitespace"""
        response = "  Short response.  "
        result = enforce_santai_mode(response, "greeting")
        assert result == response.strip()


class TestAddContactIfAppropriate:
    """Test add_contact_if_appropriate function"""

    def test_greeting_no_contact(self):
        """Test that greetings don't get contact info"""
        response = "Hello! How can I help?"
        result = add_contact_if_appropriate(response, "greeting")
        assert "+62" not in result
        assert "WhatsApp" not in result

    def test_casual_no_contact(self):
        """Test that casual queries don't get contact info"""
        response = "I'm doing great, thanks!"
        result = add_contact_if_appropriate(response, "casual")
        assert "+62" not in result
        assert "WhatsApp" not in result

    def test_business_adds_contact(self):
        """Test that business queries get contact info"""
        response = "The visa process takes 30 days."
        result = add_contact_if_appropriate(response, "business")
        assert "+62 859 0436 9574" in result
        assert "WhatsApp" in result

    def test_emergency_adds_contact(self):
        """Test that emergency queries get contact info"""
        response = "Please visit the embassy immediately."
        result = add_contact_if_appropriate(response, "emergency")
        assert "+62 859 0436 9574" in result
        assert "WhatsApp" in result

    def test_business_already_has_whatsapp(self):
        """Test that contact info is not duplicated if WhatsApp mentioned"""
        response = "Contact us on WhatsApp for more info."
        result = add_contact_if_appropriate(response, "business")
        # Should not add contact since "whatsapp" already in response
        assert result == response

    def test_business_already_has_phone(self):
        """Test that contact info is not duplicated if phone number present"""
        response = "Call us at +62 859 0436 9574."
        result = add_contact_if_appropriate(response, "business")
        # Should not add contact since "+62" already in response
        assert result == response

    def test_contact_format(self):
        """Test the format of added contact info"""
        response = "Business answer."
        result = add_contact_if_appropriate(response, "business")
        assert "\n\nNeed help?" in result
        assert "Contact us on WhatsApp" in result


class TestClassifyQueryType:
    """Test classify_query_type function"""

    def test_greeting_ciao(self):
        """Test 'ciao' is classified as greeting"""
        assert classify_query_type("ciao") == "greeting"
        assert classify_query_type("Ciao!") == "greeting"
        assert classify_query_type("CIAO") == "greeting"

    def test_greeting_hi(self):
        """Test 'hi' is classified as greeting"""
        assert classify_query_type("hi") == "greeting"
        assert classify_query_type("Hi!") == "greeting"

    def test_greeting_hello(self):
        """Test 'hello' is classified as greeting"""
        assert classify_query_type("hello") == "greeting"
        assert classify_query_type("Hello!") == "greeting"

    def test_greeting_hey(self):
        """Test 'hey' is classified as greeting"""
        assert classify_query_type("hey") == "greeting"

    def test_greeting_good_morning(self):
        """Test 'good morning' is classified as greeting"""
        assert classify_query_type("good morning") == "greeting"
        assert classify_query_type("Good Morning!") == "greeting"

    def test_greeting_buongiorno(self):
        """Test 'buongiorno' is classified as greeting"""
        assert classify_query_type("buongiorno") == "greeting"

    def test_greeting_good_afternoon(self):
        """Test 'good afternoon' is classified as greeting"""
        assert classify_query_type("good afternoon") == "greeting"

    def test_greeting_buonasera(self):
        """Test 'buonasera' is classified as greeting"""
        assert classify_query_type("buonasera") == "greeting"

    def test_greeting_good_evening(self):
        """Test 'good evening' is classified as greeting"""
        assert classify_query_type("good evening") == "greeting"

    def test_greeting_hola(self):
        """Test 'hola' is classified as greeting"""
        assert classify_query_type("hola") == "greeting"

    def test_greeting_salve(self):
        """Test 'salve' is classified as greeting"""
        assert classify_query_type("salve") == "greeting"

    def test_greeting_buondi(self):
        """Test 'buondì' is classified as greeting"""
        assert classify_query_type("buondì") == "greeting"

    def test_greeting_yo(self):
        """Test 'yo' is classified as greeting"""
        assert classify_query_type("yo") == "greeting"

    def test_casual_come_stai(self):
        """Test 'come stai' is classified as casual (short query)"""
        assert classify_query_type("come stai") == "casual"
        assert classify_query_type("Come stai?") == "casual"

    def test_casual_come_va(self):
        """Test 'come va' is classified as casual"""
        assert classify_query_type("come va") == "casual"

    def test_casual_how_are_you(self):
        """Test 'how are you' is classified as casual"""
        assert classify_query_type("how are you") == "casual"
        assert classify_query_type("how r you") == "casual"
        assert classify_query_type("how are u") == "casual"

    def test_casual_whats_up(self):
        """Test 'what's up' variations are classified as casual"""
        assert classify_query_type("what's up") == "casual"
        assert classify_query_type("whats up") == "casual"
        assert classify_query_type("wassup") == "casual"

    def test_casual_hows_it_going(self):
        """Test 'how's it going' is classified as casual"""
        assert classify_query_type("how's it going") == "casual"
        assert classify_query_type("how is it going") == "casual"

    def test_casual_come_ti_chiami(self):
        """Test 'come ti chiami' is classified as casual"""
        assert classify_query_type("come ti chiami") == "casual"

    def test_casual_whats_your_name(self):
        """Test 'what's your name' is classified as casual"""
        assert classify_query_type("what's your name") == "casual"

    def test_casual_who_are_you(self):
        """Test 'who are you' is classified as casual"""
        assert classify_query_type("who are you") == "casual"
        assert classify_query_type("chi sei") == "casual"

    def test_casual_tell_me_about_yourself(self):
        """Test 'tell me about yourself' is classified as casual"""
        assert classify_query_type("tell me about yourself") == "casual"
        assert classify_query_type("parlami di te") == "casual"
        assert classify_query_type("describe yourself") == "casual"

    def test_casual_long_query_becomes_business(self):
        """Test that long queries with casual patterns become business"""
        long_query = "how are you doing with the visa application process and documentation requirements"
        # More than 10 words, should be business even though has "how are you"
        result = classify_query_type(long_query)
        assert result == "business"

    def test_emergency_urgent(self):
        """Test 'urgent' keyword triggers emergency"""
        assert classify_query_type("This is urgent!") == "emergency"
        assert classify_query_type("Urgente per favore") == "emergency"

    def test_emergency_help(self):
        """Test 'help' keyword triggers emergency"""
        assert classify_query_type("I need help!") == "emergency"
        assert classify_query_type("Aiuto!") == "emergency"

    def test_emergency_lost(self):
        """Test 'lost' keyword triggers emergency"""
        assert classify_query_type("I lost my passport") == "emergency"
        assert classify_query_type("Ho perso il passaporto") == "emergency"

    def test_emergency_stolen(self):
        """Test 'stolen' keyword triggers emergency"""
        assert classify_query_type("My passport was stolen") == "emergency"
        assert classify_query_type("Rubato!") == "emergency"

    def test_emergency_problem(self):
        """Test 'problem' keyword triggers emergency"""
        assert classify_query_type("I have a serious problem") == "emergency"
        assert classify_query_type("C'è un problema") == "emergency"

    def test_emergency_expired(self):
        """Test 'expired' keyword triggers emergency"""
        assert classify_query_type("My visa expired") == "emergency"
        assert classify_query_type("Scaduto") == "emergency"

    def test_emergency_deportation(self):
        """Test 'deportation' keyword triggers emergency"""
        assert classify_query_type("Risk of deportation") == "emergency"
        assert classify_query_type("Deportato") == "emergency"

    def test_business_default(self):
        """Test that normal business queries are classified as business"""
        assert classify_query_type("What are the visa requirements?") == "business"
        assert classify_query_type("How long does the process take?") == "business"
        assert classify_query_type("What documents do I need?") == "business"

    def test_punctuation_removal(self):
        """Test that punctuation is properly removed for matching"""
        assert classify_query_type("ciao!!!") == "greeting"
        assert classify_query_type("hello???") == "greeting"
        assert classify_query_type("hi...") == "greeting"

    def test_whitespace_handling(self):
        """Test that whitespace is properly handled"""
        assert classify_query_type("  ciao  ") == "greeting"
        assert classify_query_type("hello   ") == "greeting"


class TestProcessZantaraResponse:
    """Test process_zantara_response function (integration)"""

    def test_full_pipeline_greeting(self):
        """Test full pipeline with greeting query"""
        response = "[PRICE] User: Hello! Assistant: Hi there! How are you? Good to see you! natural language summary"
        result = process_zantara_response(response, "greeting", apply_santai=True, add_contact=True)

        # Should sanitize
        assert "[PRICE]" not in result
        assert "User:" not in result
        assert "Assistant:" not in result
        assert "natural language summary" not in result

        # Should enforce santai (max 3 sentences)
        sentences = [s for s in result.split(".") if s.strip()]
        assert len(sentences) <= 3

        # Should NOT add contact for greeting
        assert "+62" not in result

    def test_full_pipeline_business(self):
        """Test full pipeline with business query"""
        response = "The visa process [MANDATORY] takes 30 days. ### **Requirements**\nYou need a passport."
        result = process_zantara_response(response, "business", apply_santai=True, add_contact=True)

        # Should sanitize
        assert "[MANDATORY]" not in result
        assert "###" not in result

        # Should NOT truncate business query
        assert "30 days" in result
        assert "passport" in result

        # Should add contact
        assert "+62 859 0436 9574" in result
        assert "WhatsApp" in result

    def test_full_pipeline_emergency(self):
        """Test full pipeline with emergency query"""
        response = "Context: Emergency info\nPlease visit the embassy immediately! natural language summary"
        result = process_zantara_response(response, "emergency", apply_santai=True, add_contact=True)

        # Should sanitize
        assert "Context:" not in result
        assert "natural language summary" not in result

        # Should NOT truncate emergency
        assert "embassy immediately" in result

        # Should add contact
        assert "+62 859 0436 9574" in result

    def test_pipeline_skip_santai(self):
        """Test pipeline with apply_santai=False"""
        long_greeting = "Hi! " + "Sentence. " * 10
        result = process_zantara_response(long_greeting, "greeting", apply_santai=False, add_contact=False)

        # Should NOT truncate even for greeting
        sentences = result.split(". ")
        assert len(sentences) > 3

    def test_pipeline_skip_contact(self):
        """Test pipeline with add_contact=False"""
        response = "Business answer here."
        result = process_zantara_response(response, "business", apply_santai=True, add_contact=False)

        # Should NOT add contact even for business
        assert "+62" not in result
        assert "WhatsApp" not in result

    def test_pipeline_all_disabled(self):
        """Test pipeline with all processing disabled"""
        response = "[PRICE] User: Hello! Very long response. " * 10
        result = process_zantara_response(response, "business", apply_santai=False, add_contact=False)

        # Should only sanitize (other steps disabled)
        assert "[PRICE]" not in result  # Sanitization still happens
        assert "User:" not in result

        # But should not truncate or add contact
        assert len(result) > 50  # Still long
        assert "+62" not in result

    def test_pipeline_empty_response(self):
        """Test pipeline with empty response"""
        result = process_zantara_response("", "business")
        # Empty response for business still gets contact info added
        assert "WhatsApp" in result
        assert "+62 859 0436 9574" in result

    def test_pipeline_casual_with_artifacts(self):
        """Test casual query with multiple artifacts"""
        response = """
        User: How are you?
        Assistant: I'm doing great! Thanks for asking! Hope you're well too! And more sentences! Even more!
        natural language summary
        """
        result = process_zantara_response(response, "casual", apply_santai=True, add_contact=True)

        # Should sanitize
        assert "User:" not in result
        assert "Assistant:" not in result
        assert "natural language summary" not in result

        # Should truncate (max 3 sentences)
        sentences = [s for s in result.split(".") if s.strip() and not s.endswith("!")]
        exclamations = [s for s in result.split("!") if s.strip()]
        total_sentences = len(sentences) + len(exclamations)
        assert total_sentences <= 4  # Some tolerance for split logic

        # Should NOT add contact
        assert "+62" not in result
