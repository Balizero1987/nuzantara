# Zantara WebApp - 50 Test Questions

This document contains 50 questions to test the Zantara system's capabilities directly from a web application. The questions are designed to touch all connection points between the frontend and backend, ensuring that Zantara can effectively navigate and utilize its own systems.

---

## Category 1: Configuration & Environment Awareness (5 Questions)

1. "Zantara, in which environment are you currently running?"
2. "What is the configured port for the server in this environment?"
3. "Can you list the allowed CORS origins for the production environment?"
4. "Is hot-reloading for the configuration enabled right now?"
5. "What is the configured host for the database in the current environment?"

---

## Category 2: Routing & API Analytics (10 Questions)

1. "How many API routes are currently registered in the system?"
2. "List all the available `GET` routes."
3. "Are there any routes with potential conflicts or overlaps?"
4. "What are the top 3 most frequently accessed API endpoints?"
5. "Which API route has the highest average response time?"
6. "What is the error rate for the `/api/users` endpoint?"
7. "Can you provide a summary of the analytics for the routing system?"
8. "Is analytics tracking currently enabled?"
9. "Show me the distribution of HTTP status codes for all responses in the last hour."
10. "Which route was the last one to be registered?"

---

## Category 3: Memory System - General (5 Questions)

1. "What types of memory do you have available?"
2. "Which storage backend are you currently using for the memory system?"
3. "Summarize the current status of the Unified Memory System."
4. "How many items are currently stored in your episodic memory?"
5. "What is the current performance of the memory system in terms of read/write latency?"

---

## Category 4: Episodic Memory (Conversations & Events) (5 Questions)

1. "What was the first question I asked you in this session?"
2. "Summarize our conversation so far."
3. "Do you remember when we talked about 'CORS configuration'?"
4. "How many questions have I asked you about the memory system?"
5. "Retrieve the event where we fixed the failing tests."

---

## Category 5: Semantic Memory (Structured Knowledge) (5 Questions)

1. "What is the definition of 'CentralizedConfigurationSystem' according to the project documentation?"
2. "List the key requirements for the 'ProductionCORSConfiguration' task."
3. "Who is the 'Senior Cloud Architect' for the Zantara project?"
4. "What are the main deliverables for the environment variable chaos task?"
5. "Explain the 'handler-pattern-standardization' based on the documents you have."

---

## Category 6: Vector Memory (Semantic Search) (5 Questions)

1. "Find documents related to improving application security."
2. "Search for information about 'performance benchmarks'."
3. "What parts of the codebase are related to 'database integration'?"
4. "Find the most relevant information about 'hot-reloading'."
5. "Show me code examples related to 'Express.js middleware'."

---

## Category 7: CORS & Security (5 Questions)

1. "What is the current CORS policy for this application?"
2. "Which security headers are currently being applied to responses?"
3. "If I make a request from `http://unauthorized-domain.com`, will it be allowed?"
4. "How are CORS violations logged?"
5. "What is the HSTS (HTTP Strict Transport Security) policy?"

---

## Category 8: Error Handling (5 Questions)

1. "What happens if I try to access a non-existent API endpoint?"
2. "How would you classify a 'database connection timeout' error?"
3. "What is the severity level of a 'validation error'?"
4. "If a critical error occurs, how is it logged?"
5. "Can you show me an example of a `NotFoundError` response?"

---

## Category 9: Combined & Complex Scenarios (5 Questions)

1. "Based on our conversation, generate a summary of the project's security features and find the relevant code sections for each."
2. "Analyze the latest test run, identify the fixes you implemented, and explain why they were necessary."
3. "What was the last major feature you deployed, and what were the key architectural changes involved?"
4. "Considering the current configuration, what would be the steps to add a new allowed origin for the staging environment?"
5. "Generate a complete deployment checklist for a new feature, including steps for configuration, testing, and security verification, based on the existing documentation."
