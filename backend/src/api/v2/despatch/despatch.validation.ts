import { HttpError } from "../../../errors/HttpError";
import type { CreateDespatchPayload } from "../../../types/despatch.dto";

function assertParty(p: unknown, label: string) {
    if (!p || typeof p !== "object") {
        throw new HttpError(400, `${label} is required`);
    }
    const o = p as Record<string, unknown>;
    if (typeof o.name !== "string" || !o.name.trim()) {
        throw new HttpError(400, `${label}.name required`);
    }
    if (!o.address || typeof o.address !== "object") {
        throw new HttpError(400, `${label}.address required`);
    }
    const a = o.address as Record<string, unknown>;
    for (const k of ["street", "city", "postalCode", "country"]) {
        if (typeof a[k] !== "string" || !(a[k] as string).trim()) {
            throw new HttpError(400, `${label}.address.${k} required`);
        }
    }
}

export function assertCreateDespatchPayload(body: unknown): asserts body is CreateDespatchPayload {
    if (!body || typeof body !== "object") {
        throw new HttpError(400, "Body must be a JSON object");
    }
    const b = body as Record<string, unknown>;
    if (typeof b.orderId !== "string" || !b.orderId.trim()) {
        throw new HttpError(400, "orderId required");
    }
    if (typeof b.despatchDate !== "string" || !b.despatchDate.trim()) {
        throw new HttpError(400, "despatchDate required");
    }
    assertParty(b.supplierParty, "supplierParty");
    assertParty(b.deliveryParty, "deliveryParty");
    if (!Array.isArray(b.lines) || b.lines.length === 0) {
        throw new HttpError(400, "lines must be non-empty");
    }
    b.lines.forEach((line: any, i: number) => {
        if (typeof line.lineId !== "string" || !line.lineId.trim()) {
            throw new HttpError(400, `lines[${i}].lineId required`);
        }
        if (typeof line.description !== "string" || !line.description.trim()) {
            throw new HttpError(400, `lines[${i}].description required`);
        }
        if (typeof line.quantity !== "number" || line.quantity <= 0) {
            throw new HttpError(400, `lines[${i}].quantity invalid`);
        }
    });
}
