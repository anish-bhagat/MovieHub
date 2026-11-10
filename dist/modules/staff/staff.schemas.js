"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanTicketSchema = void 0;
const zod_1 = require("zod");
exports.scanTicketSchema = zod_1.z.object({
    ticketCode: zod_1.z.string().min(1, 'Ticket code is required'),
});
//# sourceMappingURL=staff.schemas.js.map