import * as libxml from 'libxmljs2';
import { OrderData } from '../../../types/order.types';
import { mapElementToJson } from '../../../utils/jsonUblTransformer';
import { InvoiceSupplement } from '../../../types/invoice.types';
import { InvoiceBuilder } from '../../../domain/InvoiceBuilder';
import mongoose from 'mongoose';
import { InvoiceModel } from '../../../models/invoice.model';
import { OrderModel } from '../../../models/order.model';
import { DespatchModel } from '../../../models/despatch.model';
import { InvoicePdfModel } from '../../../models/invoicePdf.model';
import { sha256 } from '../../../models/hash';
import { buildInvoiceSetFields } from '../../../db/persistInvoiceRequest';
import { HttpError } from '../../../errors/HttpError';
import { validateUBL } from './invoices.validation';

/**
 * Returns a JSON obj based on a UBL XML String.
 */
export async function createFullUblObject(orderXml: string) {
    const xmlDoc = libxml.parseXml(orderXml.trim());
    const root = xmlDoc.root() as libxml.Element;

    if (!root) throw new Error("Invalid XML: No root element found.");

    return {
        rootName: root.name(),
        data: mapElementToJson(root)
    };
}

/**
 * Converts parsed order data and invoice supplement into a UBL 2.1 Invoice XML string.
 */
export function convertJsonToUblInvoice(orderData: OrderData, invoiceSupplement: InvoiceSupplement): string {
    return new InvoiceBuilder(orderData, invoiceSupplement)
        .addHeader()
        .addOrderReference()
        .addParties()
        .addPaymentMeans()
        .addPaymentTerms()
        .addTaxTotal()
        .addLegalMonetaryTotal()
        .addInvoiceLines()
        .build();
}

export async function buildInvoiceXmlFromOrderXml(orderXml: string, invoiceSupplement: InvoiceSupplement) {
    validateUBL(orderXml, 'Order');

    const orderObj = (await createFullUblObject(orderXml)).data as OrderData;
    const invoiceXml = convertJsonToUblInvoice(orderObj, invoiceSupplement);

    validateUBL(invoiceXml, 'Invoice');

    return { orderObj, invoiceXml };
}

/**
 * Finds the requested Invoice in the database and deletes invoice and returns deleted invoice document or null if not found or invalid ID.
 */
export async function deleteInvoiceById(invoiceId: string) {
    if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
        return null;
    }

    const deletedInvoiceObj = await InvoiceModel.findByIdAndDelete(invoiceId);

    return deletedInvoiceObj;
}

function normalizeXml(xml: string): string {
    return xml.trim().replace(/\r\n/g, "\n");
}

export async function storeInvoicePdf(invoiceXml: string, pdfData: Buffer): Promise<string> {
    const invoiceHash = sha256(normalizeXml(invoiceXml));

    await InvoicePdfModel.findOneAndUpdate(
        { invoiceHash },
        {
            $set: {
                invoiceHash,
                contentType: "application/pdf",
                pdfData,
            },
        },
        { upsert: true, new: true }
    ).exec();

    return invoiceHash;
}

export async function findInvoicePdfByHash(invoiceHash: string) {
    const normalizedHash = invoiceHash.trim().toLowerCase();
    const isValidHash = /^[a-f0-9]{64}$/.test(normalizedHash);

    if (!isValidHash) {
        return null;
    }

    return InvoicePdfModel.findOne({ invoiceHash: normalizedHash }).exec();
}

function userObjectId(userId: string) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return null;
    }
    return new mongoose.Types.ObjectId(userId);
}

export async function listInvoicesForUser(userId: string, limit = 200) {
    const uid = userObjectId(userId);
    if (!uid) return [];
    return InvoiceModel.find({ createdBy: uid })
        .sort({ createdAt: -1 })
        .limit(limit)
        .select("-invoiceXml")
        .lean()
        .exec();
}

export async function getInvoiceForUser(invoiceMongoId: string, userId: string) {
    const iid = userObjectId(invoiceMongoId);
    const uid = userObjectId(userId);
    if (!iid || !uid) return null;
    return InvoiceModel.findOne({ _id: iid, createdBy: uid }).lean().exec();
}

export async function deleteInvoiceByIdForUser(invoiceMongoId: string, userId: string) {
    const iid = userObjectId(invoiceMongoId);
    const uid = userObjectId(userId);
    if (!iid || !uid) return null;
    return InvoiceModel.findOneAndDelete({ _id: iid, createdBy: uid }).exec();
}

export async function pushInvoiceActivity(
    invoiceMongoId: string,
    userId: string,
    entry: { type: string; message: string; meta?: unknown }
) {
    const iid = userObjectId(invoiceMongoId);
    const uid = userObjectId(userId);
    if (!iid || !uid) return { modified: false };
    const res = await InvoiceModel.updateOne(
        { _id: iid, createdBy: uid },
        { $push: { activity: { at: new Date(), type: entry.type, message: entry.message, meta: entry.meta } } }
    ).exec();
    return { modified: res.modifiedCount > 0 };
}

export async function recordStoredInvoiceValidated(invoiceMongoId: string, userId: string) {
    const iid = userObjectId(invoiceMongoId);
    const uid = userObjectId(userId);
    if (!iid || !uid) return null;
    const doc = await InvoiceModel.findOne({ _id: iid, createdBy: uid }).lean().exec();
    if (!doc?.invoiceXml) return null;
    validateUBL(doc.invoiceXml, "Invoice");
    const updated = await InvoiceModel.findOneAndUpdate(
        { _id: iid, createdBy: uid },
        {
            $set: { lifecycleStatus: "VALIDATED" },
            $push: {
                activity: {
                    at: new Date(),
                    type: "VALIDATED",
                    message: "UBL invoice validated successfully",
                },
            },
        },
        { new: true }
    )
        .select("-invoiceXml")
        .lean()
        .exec();
    return updated;
}

export async function patchInvoiceMetadata(
    invoiceMongoId: string,
    userId: string,
    body: { lifecycleStatus?: string; paymentTermsNote?: string }
) {
    const allowed = new Set(["PAID", "OVERDUE", "DRAFT", "SAVED"]);
    if (body.lifecycleStatus && !allowed.has(body.lifecycleStatus)) {
        throw new HttpError(400, "Unsupported lifecycle status for manual update");
    }
    const iid = userObjectId(invoiceMongoId);
    const uid = userObjectId(userId);
    if (!iid || !uid) return null;

    const $set: Record<string, unknown> = {};
    if (body.lifecycleStatus) $set.lifecycleStatus = body.lifecycleStatus;
    if (body.paymentTermsNote !== undefined) $set.paymentTerms = body.paymentTermsNote;

    if (Object.keys($set).length === 0) {
        return InvoiceModel.findOne({ _id: iid, createdBy: uid }).select("-invoiceXml").lean().exec();
    }

    const msg =
        body.paymentTermsNote !== undefined
            ? `Payment terms updated`
            : `Status set to ${body.lifecycleStatus}`;

    return InvoiceModel.findOneAndUpdate(
        { _id: iid, createdBy: uid },
        {
            $set,
            $push: {
                activity: {
                    at: new Date(),
                    type: "UPDATED",
                    message: msg,
                },
            },
        },
        { new: true }
    )
        .select("-invoiceXml")
        .lean()
        .exec();
}

export async function regenerateInvoiceForUser(
    invoiceMongoId: string,
    userId: string,
    invoiceSupplement: InvoiceSupplement
) {
    const iid = userObjectId(invoiceMongoId);
    const uid = userObjectId(userId);
    if (!iid || !uid) return null;

    const inv = await InvoiceModel.findOne({ _id: iid, createdBy: uid }).exec();
    if (!inv) return null;

    const orderId = inv.orderReference?.orderId;
    if (!orderId) {
        throw new HttpError(400, "Invoice has no linked order reference");
    }

    const order = await OrderModel.findOne({ orderId }).exec();
    if (!order) {
        throw new HttpError(404, "Source order not found for this invoice");
    }

    const orderObj = (await createFullUblObject(order.orderXml)).data as OrderData;
    const invoiceXml = convertJsonToUblInvoice(orderObj, invoiceSupplement);
    validateUBL(invoiceXml, "Invoice");
    const normalizedInvoiceXml = invoiceXml.trim().replace(/\r\n/g, "\n");
    const coreFields = buildInvoiceSetFields(orderObj, invoiceSupplement, normalizedInvoiceXml);

    const updated = await InvoiceModel.findOneAndUpdate(
        { _id: iid, createdBy: uid },
        {
            $set: {
                ...coreFields,
                status: "UPDATED",
                lifecycleStatus: "SAVED",
            },
            $push: {
                activity: {
                    at: new Date(),
                    type: "REGENERATED",
                    message: "Invoice UBL regenerated from stored order and supplement",
                },
            },
        },
        { new: true }
    )
        .lean()
        .exec();

    return updated;
}

export async function applyEmailOutcomeToInvoice(
    invoiceMongoId: string,
    userId: string,
    outcome: "SENT" | "SEND_FAILED",
    detail: { to?: string; error?: string }
) {
    const iid = userObjectId(invoiceMongoId);
    const uid = userObjectId(userId);
    if (!iid || !uid) return;

    if (outcome === "SENT") {
        await InvoiceModel.updateOne(
            { _id: iid, createdBy: uid },
            {
                $set: {
                    lifecycleStatus: "SENT",
                    sentTo: detail.to,
                    sentAt: new Date(),
                    lastError: null,
                },
                $push: {
                    activity: {
                        at: new Date(),
                        type: "SENT",
                        message: `Invoice emailed to ${detail.to ?? "recipient"}`,
                    },
                },
            }
        ).exec();
        return;
    }

    await InvoiceModel.updateOne(
        { _id: iid, createdBy: uid },
        {
            $set: {
                lifecycleStatus: "SEND_FAILED",
                lastError: detail.error ?? "Email send failed",
            },
            $push: {
                activity: {
                    at: new Date(),
                    type: "SEND_FAILED",
                    message: detail.error ?? "Email send failed",
                },
            },
        }
    ).exec();
}

export type DashboardStatsResult = {
    totalInvoices: number;
    revenueTotal: number;
    sentCount: number;
    validatedCount: number;
    failedSendCount: number;
    pendingCount: number;
    totalOrders: number;
    ordersCancelled: number;
    ordersOpen: number;
    totalDespatches: number;
    despatchesFulfilmentCancelled: number;
    throughputByDay: { date: string; count: number; revenue: number }[];
    recentActivity: {
        id: string;
        invoiceMongoId: string;
        invoiceId: string;
        type: string;
        message: string;
        at: string;
    }[];
};

export async function getDashboardForUser(userId: string): Promise<DashboardStatsResult> {
    const uid = userObjectId(userId);
    const empty: DashboardStatsResult = {
        totalInvoices: 0,
        revenueTotal: 0,
        sentCount: 0,
        validatedCount: 0,
        failedSendCount: 0,
        pendingCount: 0,
        totalOrders: 0,
        ordersCancelled: 0,
        ordersOpen: 0,
        totalDespatches: 0,
        despatchesFulfilmentCancelled: 0,
        throughputByDay: [],
        recentActivity: [],
    };

    if (!uid) return empty;

    const match = { createdBy: uid };

    const [agg] = await InvoiceModel.aggregate([
        { $match: match },
        {
            $group: {
                _id: null,
                totalInvoices: { $sum: 1 },
                revenueTotal: { $sum: "$totals.payableAmount" },
                sentCount: {
                    $sum: {
                        $cond: [
                            { $in: ["$lifecycleStatus", ["SENT", "PAID", "OVERDUE"]] },
                            1,
                            0,
                        ],
                    },
                },
                validatedCount: {
                    $sum: {
                        $cond: [
                            {
                                $in: [
                                    "$lifecycleStatus",
                                    ["VALIDATED", "SENT", "PAID", "OVERDUE"],
                                ],
                            },
                            1,
                            0,
                        ],
                    },
                },
                failedSendCount: {
                    $sum: { $cond: [{ $eq: ["$lifecycleStatus", "SEND_FAILED"] }, 1, 0] },
                },
                pendingCount: {
                    $sum: { $cond: [{ $in: ["$lifecycleStatus", ["SAVED", "DRAFT"]] }, 1, 0] },
                },
            },
        },
    ]).exec();

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setUTCDate(fourteenDaysAgo.getUTCDate() - 13);
    fourteenDaysAgo.setUTCHours(0, 0, 0, 0);

    const daily = await InvoiceModel.aggregate([
        { $match: { ...match, createdAt: { $gte: fourteenDaysAgo } } },
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                count: { $sum: 1 },
                revenue: { $sum: "$totals.payableAmount" },
            },
        },
        { $sort: { _id: 1 } },
    ]).exec();

    const dayMap = new Map(
        daily.map((d) => [
            d._id as string,
            { count: d.count as number, revenue: (d.revenue as number) ?? 0 },
        ])
    );
    const throughputByDay: { date: string; count: number; revenue: number }[] = [];
    for (let i = 0; i < 14; i++) {
        const d = new Date(fourteenDaysAgo);
        d.setUTCDate(fourteenDaysAgo.getUTCDate() + i);
        const key = d.toISOString().slice(0, 10);
        const row = dayMap.get(key);
        throughputByDay.push({ date: key, count: row?.count ?? 0, revenue: row?.revenue ?? 0 });
    }

    const rawActivity = await InvoiceModel.aggregate([
        { $match: match },
        { $unwind: "$activity" },
        { $sort: { "activity.at": -1 } },
        { $limit: 5 },
        {
            $project: {
                _id: 0,
                invoiceMongoId: { $toString: "$_id" },
                invoiceNumId: "$invoiceId",
                type: "$activity.type",
                message: "$activity.message",
                at: "$activity.at",
            },
        },
    ]).exec();

    const recentActivity = rawActivity.map((row, idx) => ({
        id: `${String(row.at)}-${idx}`,
        invoiceMongoId: row.invoiceMongoId as string,
        invoiceId: row.invoiceNumId as string,
        type: row.type as string,
        message: row.message as string,
        at: (row.at as Date).toISOString(),
    }));

    const [totalOrders, ordersCancelled, totalDespatches, despatchesFulfilmentCancelled] = await Promise.all([
        OrderModel.countDocuments({ createdBy: uid }).exec(),
        OrderModel.countDocuments({ createdBy: uid, orderStatus: "cancelled" }).exec(),
        DespatchModel.countDocuments({ createdBy: uid }).exec(),
        DespatchModel.countDocuments({ createdBy: uid, despatchStatus: "fulfilment_cancelled" }).exec(),
    ]);

    const ordersOpen = await OrderModel.countDocuments({
        createdBy: uid,
        orderStatus: { $nin: ["cancelled", "fulfilled"] },
    }).exec();

    return {
        totalInvoices: agg?.totalInvoices ?? 0,
        revenueTotal: agg?.revenueTotal ?? 0,
        sentCount: agg?.sentCount ?? 0,
        validatedCount: agg?.validatedCount ?? 0,
        failedSendCount: agg?.failedSendCount ?? 0,
        pendingCount: agg?.pendingCount ?? 0,
        totalOrders,
        ordersCancelled,
        ordersOpen,
        totalDespatches,
        despatchesFulfilmentCancelled,
        throughputByDay,
        recentActivity,
    };
}

export async function linkPdfHashToInvoiceIfOwned(
    userId: string,
    invoiceXml: string,
    pdfHash: string
) {
    const uid = userObjectId(userId);
    if (!uid) return;
    const xmlHash = sha256(invoiceXml.trim().replace(/\r\n/g, "\n"));
    await InvoiceModel.updateOne(
        { createdBy: uid, xmlSha256: xmlHash },
        { $set: { pdfInvoiceHash: pdfHash } }
    ).exec();
}
