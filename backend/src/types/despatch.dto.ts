import type { OrderAddressDto, OrderPartyDto } from "./order.dto";

export type DespatchLineDto = {
    lineId: string;
    description: string;
    quantity: number;
    unitCode?: string;
};

export type CreateDespatchPayload = {
    orderId: string;
    despatchId?: string;
    despatchDate: string;
    despatchStatus?: "not_despatched" | "despatched" | "partially_despatched";
    carrierName?: string;
    trackingId?: string;
    notes?: string;
    supplierParty: OrderPartyDto;
    deliveryParty: OrderPartyDto;
    lines: DespatchLineDto[];
};
