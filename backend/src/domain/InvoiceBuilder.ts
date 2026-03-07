import { create } from 'xmlbuilder2';
import { XMLBuilder } from 'xmlbuilder2/lib/interfaces';
import { OrderData } from '../types/order.types';
import {
    InvoiceSupplement,
    INVOICE_CUSTOMIZATION_ID,
    INVOICE_PROFILE_ID,
    INVOICE_TYPE_CODE,
} from '../types/invoice.types';
import { mapParty } from '../utils/jsonUblTransformer';
import { InvoiceCalculator } from './InvoiceCalculator';

const UBL_INVOICE_NAMESPACES = {
    'xmlns': 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2',
    'xmlns:cac': 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
    'xmlns:cbc': 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2',
};

/**
 * Builder class for constructing UBL 2.1 Invoice XML documents
 * from parsed order data and supplementary invoice information.
 * 
 * Header includes:
 *   - UBL Version
 *   - Customization/Profile ID
 *   - Dates, type codes, notes, currencies, etc
 */
export class InvoiceBuilder {
    private readonly invoice: XMLBuilder;
    private readonly order: OrderData;
    private readonly supplement: InvoiceSupplement;
    private readonly currency: string;
    private readonly orderLines: any[];
    private readonly calculator: InvoiceCalculator;

    constructor(order: OrderData, supplement: InvoiceSupplement) {
        this.order = order;
        this.supplement = supplement;
        this.currency = this.resolveCurrency();
        this.orderLines = this.normalizeOrderLines();
        this.calculator = new InvoiceCalculator(this.orderLines, supplement.taxRate);

        this.invoice = create({ version: '1.0', encoding: 'UTF-8' })
            .ele('Invoice', UBL_INVOICE_NAMESPACES);
    }

    addHeader(): this {
        const { supplement, invoice } = this;
        const issueDate = supplement.issueDate ?? new Date().toISOString().split('T')[0];

        invoice
            .ele('cbc:UBLVersionID').txt('2.1').up()
            .ele('cbc:CustomizationID').txt(INVOICE_CUSTOMIZATION_ID).up()
            .ele('cbc:ProfileID').txt(INVOICE_PROFILE_ID).up()
            .ele('cbc:ID').txt(`INV-${supplement.invoiceNumber ?? Date.now()}`).up()
            .ele('cbc:IssueDate').txt(issueDate).up();

        if (supplement.dueDate) {
            invoice.ele('cbc:DueDate').txt(supplement.dueDate).up();
        }

        invoice.ele('cbc:InvoiceTypeCode').txt(INVOICE_TYPE_CODE).up();

        if (supplement.note) {
            invoice.ele('cbc:Note').txt(supplement.note).up();
        }

        invoice.ele('cbc:DocumentCurrencyCode').txt(this.currency).up();

        return this;
    }

    // Links this invoice back to the og order by ID
    addOrderReference(): this {
        if (this.order.ID) {
            this.invoice
                .ele('cac:OrderReference')
                .ele('cbc:ID')
                .txt(this.order.ID as string).up()
                .up();
        }
        return this;
    }

    // Map Parties
    // SellerSupplierParty -> AccountingSupplierParty
    // BuyerCustomerParty -> AcountingCustomerParty
    addParties(): this {
        mapParty(
            this.invoice.ele('cac:AccountingSupplierParty'),
            this.order.SellerSupplierParty?.Party,
            this.supplement.supplierPartyTaxScheme,
        );
        mapParty(
            this.invoice.ele('cac:AccountingCustomerParty'),
            this.order.BuyerCustomerParty?.Party,
            this.supplement.customerPartyTaxScheme,
        );
        return this;
    }

    // Handles PaymentMeans block
    addPaymentMeans(): this {
        const paymentMeans = this.supplement.paymentMeans;
        if (!paymentMeans) return this;

        const paymentMeansEle = this.invoice.ele('cac:PaymentMeans');
        paymentMeansEle.ele('cbc:PaymentMeansCode').txt(paymentMeans.code).up();

        const account = paymentMeans.payeeFinancialAccount;
        const pfa = paymentMeansEle.ele('cac:PayeeFinancialAccount');
        pfa.ele('cbc:ID').txt(account.id).up();
        pfa.ele('cbc:Name').txt(account.name).up();

        if (account.branchId) {
            pfa.ele('cac:FinancialInstitutionBranch')
                .ele('cbc:ID').txt(account.branchId).up()
            .up();
        }

        pfa.up();
        paymentMeansEle.up();

        return this;
    }

    addPaymentTerms(): this {
        if (!this.supplement.paymentTerms) return this;

        const el = this.invoice
            .ele('cac:PaymentTerms')
            .ele('cbc:Note')
            .txt(this.supplement.paymentTerms.note)
            .up();
        el.up();

        return this;
    }

    // Handle TaxTotal Block
    addTaxTotal(): this {
        const { currency, supplement, calculator } = this;
        const { taxTotal: taxAmt, lineExtensionTotal } = calculator.summary;
        const taxPercent = (supplement.taxRate * 100).toString();

        const taxTotal = this.invoice.ele('cac:TaxTotal');
        taxTotal.ele('cbc:TaxAmount', { currencyID: currency })
            .txt(taxAmt).up();

        taxTotal.ele('cac:TaxSubtotal')
            .ele('cbc:TaxableAmount', { currencyID: currency })
                .txt(lineExtensionTotal).up()
            .ele('cbc:TaxAmount', { currencyID: currency })
                .txt(taxAmt).up()
            .ele('cac:TaxCategory')
                .ele('cbc:ID').txt('S').up()
                .ele('cbc:Percent').txt(taxPercent).up()
                .ele('cac:TaxScheme')
                    .ele('cbc:ID').txt(supplement.taxScheme.id).up()
                .up()
            .up()
        .up();

        taxTotal.up();

        return this;
    }

    // Handles LegalMonetaryTotal block
    addLegalMonetaryTotal(): this {
        const { currency, calculator } = this;
        const summary = calculator.summary;

        const total = this.invoice.ele('cac:LegalMonetaryTotal');
        total.ele('cbc:LineExtensionAmount', { currencyID: currency }).txt(summary.lineExtensionTotal).up();
        total.ele('cbc:TaxExclusiveAmount', { currencyID: currency }).txt(summary.taxExclusiveAmount).up();
        total.ele('cbc:TaxInclusiveAmount', { currencyID: currency }).txt(summary.taxInclusiveAmount).up();
        total.ele('cbc:PayableAmount', { currencyID: currency }).txt(summary.payableAmount).up();
        total.up();

        return this;
    }

    // Handles computation of individual Invoice Lines
    addInvoiceLines(): this {
        const { currency, supplement, calculator } = this;
        const taxPercent = (supplement.taxRate * 100).toString();

        this.orderLines.forEach((line: any, index: number) => {
            const item = line.LineItem;
            const lt = calculator.lineTotals[index];

            const iLine = this.invoice.ele('cac:InvoiceLine');

            iLine.ele('cbc:ID').txt(lt.lineId.toString()).up();
            iLine.ele('cbc:InvoicedQuantity', { unitCode: item.Quantity?.['@unitCode'] || 'EA' })
                .txt(lt.quantity).up();
            iLine.ele('cbc:LineExtensionAmount', { currencyID: currency })
                .txt(lt.lineExtensionAmount).up();

            iLine.ele('cac:OrderLineReference')
                .ele('cbc:LineID').txt(lt.lineId.toString()).up()
            .up();

            const cacItem = iLine.ele('cac:Item');
            cacItem.ele('cbc:Name').txt(item.Item?.Name).up();
            cacItem.ele('cac:ClassifiedTaxCategory')
                .ele('cbc:ID').txt('S').up()
                .ele('cbc:Percent').txt(taxPercent).up()
                .ele('cac:TaxScheme')
                    .ele('cbc:ID').txt(supplement.taxScheme.id).up()
                .up()
            .up();
            cacItem.up();

            iLine.ele('cac:Price')
                .ele('cbc:PriceAmount', { currencyID: currency })
                .txt(lt.unitPrice).up()
            .up();

            iLine.up();
        });

        return this;
    }

    /**
     * Validates financial integrity and serialises the invoice
     */
    build(): string {
        this.calculator.validate();
        return this.invoice.end({ prettyPrint: true });
    }

    /**
     * Get the currency code to use for the Invoice. Priority is ordered as follows:
     * 1. Order Document's `DocumentCurrencyCode` value
     * 2. invoiceSupplement's provided currencyCode
     * 3. fallback to AUD.
     */
    private resolveCurrency(): string {
        return this.supplement.currencyCode
            || (this.order.DocumentCurrencyCode as string)
            || 'AUD';
    }

    private normalizeOrderLines(): any[] {
        const lines = this.order.OrderLine;
        return Array.isArray(lines) ? lines : [lines];
    }
}
