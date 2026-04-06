import { HttpError } from "../../../errors/HttpError";
import type { CreateOrderPayload, OrderLineDto, OrderPartyDto } from "../../../types/order.dto";

function assertParty(p: unknown, label: string): asserts p is OrderPartyDto {
    if (!p || typeof p !== "object") {
        throw new HttpError(400, `${label} must be an object`);
    }
    const o = p as Record<string, unknown>;
    if (typeof o.name !== "string" || !o.name.trim()) {
        throw new HttpError(400, `${label}.name is required`);
    }
    if (!o.address || typeof o.address !== "object") {
        throw new HttpError(400, `${label}.address is required`);
    }
    const a = o.address as Record<string, unknown>;
    for (const k of ["street", "city", "postalCode", "country"]) {
        if (typeof a[k] !== "string" || !(a[k] as string).trim()) {
            throw new HttpError(400, `${label}.address.${k} is required`);
        }
    }
}

function assertLines(lines: unknown): asserts lines is OrderLineDto[] {
    if (!Array.isArray(lines) || lines.length === 0) {
        throw new HttpError(400, "lines must be a non-empty array");
    }
    lines.forEach((line, i) => {
        if (!line || typeof line !== "object") {
            throw new HttpError(400, `lines[${i}] invalid`);
        }
        const l = line as OrderLineDto;
        if (typeof l.description !== "string" || !l.description.trim()) {
            throw new HttpError(400, `lines[${i}].description required`);
        }
        if (typeof l.quantity !== "number" || l.quantity <= 0) {
            throw new HttpError(400, `lines[${i}].quantity must be a positive number`);
        }
        if (typeof l.unitPrice !== "number" || l.unitPrice < 0) {
            throw new HttpError(400, `lines[${i}].unitPrice must be a non-negative number`);
        }
    });
}

export function assertCreateOrderPayload(body: unknown): asserts body is CreateOrderPayload {
    if (!body || typeof body !== "object") {
        throw new HttpError(400, "Request body must be a JSON object");
    }
    const b = body as Record<string, unknown>;
    if (typeof b.orderId !== "string" || !b.orderId.trim()) {
        throw new HttpError(400, "orderId is required");
    }
    if (typeof b.issueDate !== "string" || !b.issueDate.trim()) {
        throw new HttpError(400, "issueDate is required");
    }
    if (typeof b.currency !== "string" || !b.currency.trim()) {
        throw new HttpError(400, "currency is required");
    }
    assertParty(b.buyer, "buyer");
    assertParty(b.seller, "seller");
    assertLines(b.lines);
    if (b.taxRate !== undefined && typeof b.taxRate !== "number") {
        throw new HttpError(400, "taxRate must be a number");
    }
    if (
        b.orderStatus !== undefined &&
        b.orderStatus !== "draft" &&
        b.orderStatus !== "created"
    ) {
        throw new HttpError(400, "orderStatus must be draft or created");
    }
}
