"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.BridgeError = exports.InternalServerError = exports.UnauthorizedError = exports.BadRequestError = exports.ForbiddenError = void 0;
var ForbiddenError = /** @class */ (function (_super) {
    __extends(ForbiddenError, _super);
    function ForbiddenError() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return ForbiddenError;
}(Error));
exports.ForbiddenError = ForbiddenError;
var BadRequestError = /** @class */ (function (_super) {
    __extends(BadRequestError, _super);
    function BadRequestError() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return BadRequestError;
}(Error));
exports.BadRequestError = BadRequestError;
var UnauthorizedError = /** @class */ (function (_super) {
    __extends(UnauthorizedError, _super);
    function UnauthorizedError() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return UnauthorizedError;
}(Error));
exports.UnauthorizedError = UnauthorizedError;
var InternalServerError = /** @class */ (function (_super) {
    __extends(InternalServerError, _super);
    function InternalServerError() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return InternalServerError;
}(Error));
exports.InternalServerError = InternalServerError;
var BridgeError = /** @class */ (function (_super) {
    __extends(BridgeError, _super);
    function BridgeError() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return BridgeError;
}(Error));
exports.BridgeError = BridgeError;
