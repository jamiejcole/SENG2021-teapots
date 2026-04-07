import { create } from "xmlbuilder2";
import type { CreateOrderPayload, OrderPartyDto } from "../types/order.dto";
import type { OrderData } from "../types/order.types";
import { mapParty } from "../utils/jsonUblTransformer";
import { InvoiceCalculator } from "./InvoiceCalculator";

const UBL_ORDER_NS = {
    xmlns: "urn:oasis:names:specification:ubl:schema:xsd:Order-2",
    "xmlns:cac": "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2",
    "xmlns:cbc": "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2",
};

const ORDER_CUSTOMIZATION_ID = "urn:oasis:names:specification:ubl:xpath:Order-2.0:sbs-1.0-draft";
const ORDER_PROFILE_ID = "bpid:urn:oasis:names:draft:bpss:ubl-2-sbs-order-with-simple-response-draft";

function partyDtoToUbl(p: OrderPartyDto) {
    const street = p.address.street.trim();
    const parts = street.split(/\s+/);
    const buildingNumber = parts.length > 1 ? parts[parts.length - 1] : "";
    const streetName = parts.length > 1 ? parts.slice(0, -1).join(" ") : street;
    return {
        PartyName: { Name: p.name },
        ...(p.id ? { EndpointID: { value: p.id } } : {}),
        PostalAddress: {
            StreetName: streetName,
            ...(buildingNumber ? { BuildingNumber: buildingNumber } : {}),
            CityName: p.address.city,
            PostalZone: p.address.postalCode,
            Country: { IdentificationCode: p.address.country },
        },
        ...(p.email ? { Contact: { ElectronicMail: p.email } } : {}),
    };
}

function buildRawLinesForCalc(payload: CreateOrderPayload) {
    return payload.lines.map((l, idx) => ({
        LineItem: {
            ID: { value: String(l.lineId?.trim() || String(idx + 1)) },
            Quantity: {
                value: String(l.quantity),
                "@unitCode": l.unitCode?.trim() || "C62",
            },
            Price: {
                PriceAmount: {
                    value: String(l.unitPrice),
                    "@currencyID": payload.currency,
                },
            },
            Item: {
                Name: { value: l.description },
                Description: { value: l.description },
            },
        },
    }));
}

/**
 * Produces UBL Order XML and parallel {@link OrderData} for persistence / invoice pipeline.
 */
export function buildOrderFromPayload(payload: CreateOrderPayload): { orderXml: string; orderData: OrderData } {
    const taxRate = typeof payload.taxRate === "number" && Number.isFinite(payload.taxRate) ? payload.taxRate : 0;
    const rawLines = buildRawLinesForCalc(payload);
    const calc = new InvoiceCalculator(rawLines as any[], taxRate);

    const orderLines = rawLines.map((line, idx) => {
        const lt = calc.lineTotals[idx];
        return {
            LineItem: {
                ...line.LineItem,
                LineExtensionAmount: {
                    value: lt.lineExtensionAmount,
                    "@currencyID": payload.currency,
                },
                TotalTaxAmount: {
                    value: lt.lineTaxAmount,
                    "@currencyID": payload.currency,
                },
            },
        };
    });

    const orderData: OrderData = {
        ID: { value: payload.orderId.trim() },
        IssueDate: { value: payload.issueDate.trim() },
        DocumentCurrencyCode: { value: payload.currency.trim().toUpperCase() },
        BuyerCustomerParty: { Party: partyDtoToUbl(payload.buyer) },
        SellerSupplierParty: { Party: partyDtoToUbl(payload.seller) },
        OrderLine: orderLines.length === 1 ? orderLines[0] : orderLines,
        ...(payload.note?.trim() ? { Note: { value: payload.note.trim() } } : {}),
    };

    const orderXml = serializeOrderXml(payload, orderLines, calc);
    return { orderXml, orderData };
}

function serializeOrderXml(payload: CreateOrderPayload, orderLines: any[], calc: InvoiceCalculator): string {
    const ob = create({ version: "1.0", encoding: "UTF-8" }).ele("Order", UBL_ORDER_NS);

    ob.ele("cbc:UBLVersionID").txt("2.1").up();
    ob.ele("cbc:CustomizationID").txt(ORDER_CUSTOMIZATION_ID).up();
    ob.ele("cbc:ProfileID").txt(ORDER_PROFILE_ID).up();
    ob.ele("cbc:ID").txt(payload.orderId.trim()).up();
    ob.ele("cbc:IssueDate").txt(payload.issueDate.trim()).up();
    if (payload.note?.trim()) {
        ob.ele("cbc:Note").txt(payload.note.trim()).up();
    }
    ob.ele("cbc:DocumentCurrencyCode").txt(payload.currency.trim().toUpperCase()).up();

    const buyer = ob.ele("cac:BuyerCustomerParty");
    mapParty(buyer, partyDtoToUbl(payload.buyer) as any);
    buyer.up();

    const seller = ob.ele("cac:SellerSupplierParty");
    mapParty(seller, partyDtoToUbl(payload.seller) as any);
    seller.up();

    if (payload.delivery?.address) {
        const d = ob.ele("cac:Delivery");
        const da = d.ele("cac:DeliveryAddress");
        da.ele("cbc:StreetName").txt(payload.delivery.address.street).up();
        da.ele("cbc:CityName").txt(payload.delivery.address.city).up();
        da.ele("cbc:PostalZone").txt(payload.delivery.address.postalCode).up();
        da.ele("cac:Country").ele("cbc:IdentificationCode").txt(payload.delivery.address.country).up().up();
        da.up();
        if (payload.delivery.requestedDeliveryStart || payload.delivery.requestedDeliveryEnd) {
            const p = d.ele("cac:RequestedDeliveryPeriod");
            if (payload.delivery.requestedDeliveryStart) {
                p.ele("cbc:StartDate").txt(payload.delivery.requestedDeliveryStart).up();
            }
            if (payload.delivery.requestedDeliveryEnd) {
                p.ele("cbc:EndDate").txt(payload.delivery.requestedDeliveryEnd).up();
            }
            p.up();
        }
        d.up();
    }

    if (payload.deliveryTerms?.trim()) {
        ob.ele("cac:DeliveryTerms").ele("cbc:SpecialTerms").txt(payload.deliveryTerms.trim()).up().up();
    }

    const amt = ob.ele("cac:AnticipatedMonetaryTotal");
    amt.ele("cbc:LineExtensionAmount", { currencyID: payload.currency })
        .txt(calc.summary.lineExtensionTotal)
        .up();
    amt.ele("cbc:PayableAmount", { currencyID: payload.currency }).txt(calc.summary.payableAmount).up();
    amt.up();

    for (const ol of orderLines) {
            const lineEl = ob.ele("cac:OrderLine");
        const li = lineEl.ele("cac:LineItem");
        const item = ol.LineItem;
        li.ele("cbc:ID").txt(String(item.ID?.value ?? item.ID)).up();
        li.ele("cbc:Quantity", { unitCode: item.Quantity["@unitCode"] || "C62" })
            .txt(String(item.Quantity.value))
            .up();
        li.ele("cbc:LineExtensionAmount", { currencyID: payload.currency })
            .txt(item.LineExtensionAmount.value)
            .up();
        li.ele("cbc:TotalTaxAmount", { currencyID: payload.currency })
            .txt(item.TotalTaxAmount.value)
            .up();
        const price = li.ele("cac:Price");
        price.ele("cbc:PriceAmount", { currencyID: payload.currency }).txt(item.Price.PriceAmount.value).up();
        price.up();
        const it = li.ele("cac:Item");
        it.ele("cbc:Description").txt(item.Item.Description?.value ?? item.Item.Name?.value ?? "").up();
        it.ele("cbc:Name").txt(item.Item.Name?.value ?? "").up();
        it.up();
        li.up();
        lineEl.up();
    }

    return ob.end({ prettyPrint: true });
}
