"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SECRET_KEY = void 0;
exports.Auth = Auth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
exports.SECRET_KEY = 'ashish';
function Auth(req, res, next) {
    try {
        if (req.headers.token) {
            const token = req.headers.token;
            const decoded_token = jsonwebtoken_1.default.verify(token, exports.SECRET_KEY);
            if (token) {
                req.username = decoded_token;
                next();
            }
            else {
                res.status(400).send('Unauthorized');
            }
        }
    }
    catch (e) {
        res.status(400).send('Error in Auth');
    }
}
