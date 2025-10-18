"use strict";
/**
 * ZANTARA Llama 3.1 Integration
 * Fine-tuned model for Indonesian business operations
 * Uses YOUR custom trained merged model: zeroai87/zantara-llama-3.1-8b-merged
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.zantaraChat = zantaraChat;
exports.isZantaraAvailable = isZantaraAvailable;
var response_js_1 = require("../../utils/response.js");
var errors_js_1 = require("../../utils/errors.js");
// Configuration - YOUR ZANTARA MERGED MODEL!
var HF_API_KEY = process.env.HF_API_KEY || '';
var ZANTARA_MODEL = 'zeroai87/zantara-llama-3.1-8b-merged';
var RUNPOD_ENDPOINT = process.env.RUNPOD_LLAMA_ENDPOINT || '';
var RUNPOD_API_KEY = process.env.RUNPOD_API_KEY || '';
/**
 * Call ZANTARA Llama 3.1 model
 * Tries RunPod first, falls back to HuggingFace Inference API
 */
function zantaraChat(params) {
    return __awaiter(this, void 0, void 0, function () {
        var message, maxTokens, temperature, systemPrompt, fullPrompt, response, data, answer, error_1, response, error, data, answer, error_2;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!params.message) {
                        throw new errors_js_1.BadRequestError('message is required');
                    }
                    message = String(params.message).trim();
                    maxTokens = params.max_tokens || 500;
                    temperature = params.temperature || 0.7;
                    systemPrompt = "You are ZANTARA, an intelligent AI assistant specialized in business operations, team management, and customer service for Indonesian markets. Respond in a professional, helpful manner.";
                    fullPrompt = "".concat(systemPrompt, "\n\nUser: ").concat(message, "\n\nAssistant:");
                    if (!(RUNPOD_ENDPOINT && RUNPOD_API_KEY)) return [3 /*break*/, 6];
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 5, , 6]);
                    return [4 /*yield*/, fetch(RUNPOD_ENDPOINT, {
                            method: 'POST',
                            headers: {
                                'Authorization': "Bearer ".concat(RUNPOD_API_KEY),
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                input: {
                                    prompt: fullPrompt,
                                    max_new_tokens: maxTokens,
                                    temperature: temperature
                                }
                            })
                        })];
                case 2:
                    response = _c.sent();
                    if (!response.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, response.json()];
                case 3:
                    data = _c.sent();
                    answer = data.output || ((_a = data.result) === null || _a === void 0 ? void 0 : _a.output) || '';
                    return [2 /*return*/, (0, response_js_1.ok)({
                            answer: answer.trim(),
                            model: 'zantara-llama-3.1-8b',
                            provider: 'runpod',
                            tokens: maxTokens
                        })];
                case 4: return [3 /*break*/, 6];
                case 5:
                    error_1 = _c.sent();
                    console.warn('⚠️  RunPod unavailable, falling back to HuggingFace:', error_1);
                    return [3 /*break*/, 6];
                case 6:
                    _c.trys.push([6, 11, , 12]);
                    if (!HF_API_KEY) {
                        throw new Error('HF_API_KEY not configured - cannot use ZANTARA model');
                    }
                    console.log('🚀 Using YOUR trained ZANTARA model:', ZANTARA_MODEL);
                    return [4 /*yield*/, fetch("https://api-inference.huggingface.co/models/".concat(ZANTARA_MODEL), {
                            method: 'POST',
                            headers: {
                                'Authorization': "Bearer ".concat(HF_API_KEY),
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                inputs: fullPrompt,
                                parameters: {
                                    max_new_tokens: maxTokens,
                                    temperature: temperature,
                                    return_full_text: false,
                                    do_sample: true
                                }
                            })
                        })];
                case 7:
                    response = _c.sent();
                    if (!!response.ok) return [3 /*break*/, 9];
                    return [4 /*yield*/, response.text()];
                case 8:
                    error = _c.sent();
                    throw new Error("HuggingFace API error: ".concat(response.status, " - ").concat(error));
                case 9: return [4 /*yield*/, response.json()];
                case 10:
                    data = _c.sent();
                    answer = ((_b = data[0]) === null || _b === void 0 ? void 0 : _b.generated_text) || data.generated_text || '';
                    return [2 /*return*/, (0, response_js_1.ok)({
                            answer: answer.trim(),
                            model: 'zantara-llama-3.1-8b-merged',
                            provider: 'huggingface',
                            tokens: maxTokens,
                            trained_on: '22,009 Indonesian business conversations',
                            accuracy: '98.74%'
                        })];
                case 11:
                    error_2 = _c.sent();
                    console.error('❌ ZANTARA error:', error_2);
                    throw new errors_js_1.BadRequestError("ZANTARA chat failed: ".concat(error_2.message));
                case 12: return [2 /*return*/];
            }
        });
    });
}
/**
 * Check if ZANTARA is available
 */
function isZantaraAvailable() {
    // Available if HuggingFace API key is configured
    return !!HF_API_KEY || !!(RUNPOD_ENDPOINT && RUNPOD_API_KEY);
}
