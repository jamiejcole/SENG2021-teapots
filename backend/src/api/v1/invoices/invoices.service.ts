import * as libxml from 'libxmljs2';
import { create } from 'xmlbuilder2';
import { OrderData } from '../../../types/order.types';
import { mapElementToJson, mapParty } from '../../../utils/jsonUblTransformer';
import { InvoiceSupplement, INVOICE_CUSTOMIZATION_ID, INVOICE_PROFILE_ID, INVOICE_TYPE_CODE } from '../../../types/invoice.types';

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

export function convertJsonToUblInvoice(orderData: OrderData, invoiceSupplement: InvoiceSupplement) {
    /**
     * ## TODO ##
     * Parties:
     * - handle PartyTaxScheme
     * 
     * General:
     * - handle DueDate                         DONE
     * - handle IssueDate                       DONE
     * - handle PaymentMeans                    DONE
     * - handle AllowanceCharge - LOW
     * - handle TaxTotal                        DONE?
     * - handle LegalMonetaryTotal              DONE?
     * 
     * InvoiceLines:
     * - handle OrderLineReference              DONE
     * - handle ClassifiedTaxCategory in Item - DONE
     * 
     */

    // Get the currency code to use for the Invoice. Priority is ordered as follows:
    // 1. Order Document's `DocumentCurrencyCode` value
    // 2. invoiceSupplement's provided currencyCode
    // 3. fallback to AUD.
    const effectiveCurrency = invoiceSupplement.currencyCode
        || (orderData.DocumentCurrencyCode as string)
        || 'AUD';

    const invoice = create({ version: '1.0', encoding: 'UTF-8' })
        .ele('Invoice', {
            'xmlns': 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2',
            'xmlns:cac': 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
            'xmlns:cbc': 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2'
        });

    const issueDate = invoiceSupplement.issueDate ?? new Date().toISOString().split('T')[0];

    // Defining Header Info
    invoice.ele('cbc:UBLVersionID').txt('2.1').up()
           .ele('cbc:CustomizationID').txt(INVOICE_CUSTOMIZATION_ID).up()
           .ele('cbc:ProfileID').txt(INVOICE_PROFILE_ID).up()
           .ele('cbc:ID').txt(`INV-${invoiceSupplement.invoiceNumber ?? Date.now()}`).up()
           .ele('cbc:IssueDate').txt(issueDate).up()

    if (invoiceSupplement.dueDate) {
        invoice.ele('cbc:DueDate').txt(invoiceSupplement.dueDate).up();
    }

    invoice.ele('cbc:InvoiceTypeCode').txt(INVOICE_TYPE_CODE).up()

    if (invoiceSupplement.note) {
        invoice.ele('cbc:Note').txt(invoiceSupplement.note).up()
    }

    invoice.ele('cbc:DocumentCurrencyCode').txt(effectiveCurrency).up();

    // Link to order ID
    if (orderData.ID) {
        invoice.ele('cac:OrderReference')
            .ele('cbc:ID').txt(orderData.ID as string).up()
        .up();
    }

    // Map Parties
    // SellerSupplierParty -> AccountingSupplierParty
    // BuyerCustomerParty -> AcountingCustomerParty
    mapParty(
        invoice.ele('cac:AccountingSupplierParty'),
        orderData.SellerSupplierParty?.Party,
        invoiceSupplement.supplierPartyTaxScheme
    );
    mapParty(
        invoice.ele('cac:AccountingCustomerParty'),
        orderData.BuyerCustomerParty?.Party,
        invoiceSupplement.customerPartyTaxScheme
    );

    // PaymentMeans block
    if (invoiceSupplement.paymentMeans) {
        const paymentMeansEle = invoice.ele('cac:PaymentMeans');
        paymentMeansEle.ele('cbc:PaymentMeansCode').txt(invoiceSupplement.paymentMeans.code).up();
        
        const account = invoiceSupplement.paymentMeans.payeeFinancialAccount;
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
    }

    // PaymentTerms block
    if (invoiceSupplement.paymentTerms) {
        const paymentTermsEle = invoice.ele('cac:PaymentTerms');
        paymentTermsEle.ele('cbc:Note').txt(invoiceSupplement.paymentTerms.note).up();
        paymentTermsEle.up();
    }

    // TODO: Handle AllowanceCharges

    // Tax Totals
    const orderLines = Array.isArray(orderData.OrderLine) ? orderData.OrderLine : [orderData.OrderLine];
    const totalLineAmount = orderLines.reduce((sum: number, line: any) => 
        sum + parseFloat(line.LineItem.LineExtensionAmount?.value || line.LineItem.LineExtensionAmount || 0), 0);

    const totalTaxAmount = totalLineAmount * invoiceSupplement.taxRate;

    const taxTotal = invoice.ele('cac:TaxTotal');
    taxTotal.ele('cbc:TaxAmount', { currencyID: effectiveCurrency }).txt(totalTaxAmount.toFixed(2)).up();

    taxTotal.ele('cac:TaxSubtotal')
        .ele('cbc:TaxableAmount', { currencyID: effectiveCurrency }).txt(totalLineAmount.toFixed(2)).up()
        .ele('cbc:TaxAmount', { currencyID: effectiveCurrency }).txt(totalTaxAmount.toFixed(2)).up()
        .ele('cac:TaxCategory')
            .ele('cbc:ID').txt('S').up()
            .ele('cbc:Percent').txt((invoiceSupplement.taxRate * 100).toString()).up()
            .ele('cac:TaxScheme')
                .ele('cbc:ID').txt(invoiceSupplement.taxScheme.id).up()
            .up()
        .up()
    .up();
    taxTotal.up();

    // LegalMonetaryTotals block
    const payableAmount = totalLineAmount + totalTaxAmount;

    const monetaryTotal = invoice.ele('cac:LegalMonetaryTotal');
    monetaryTotal.ele('cbc:LineExtensionAmount', { currencyID: effectiveCurrency }).txt(totalLineAmount.toFixed(2)).up();
    monetaryTotal.ele('cbc:TaxExclusiveAmount', { currencyID: effectiveCurrency }).txt(totalLineAmount.toFixed(2)).up();
    monetaryTotal.ele('cbc:TaxInclusiveAmount', { currencyID: effectiveCurrency }).txt(payableAmount.toFixed(2)).up();
    monetaryTotal.ele('cbc:PayableAmount', { currencyID: effectiveCurrency }).txt(payableAmount.toFixed(2)).up();
    monetaryTotal.up();

    // Invoice Lines
    orderLines.forEach((line: any, index: number) => {
        const item = line.LineItem;
        const lineExtensionAmount = item.LineExtensionAmount?.value || item.LineExtensionAmount || '0';
        const iLine = invoice.ele('cac:InvoiceLine');
        
        iLine.ele('cbc:ID').txt((index + 1).toString()).up();
        iLine.ele('cbc:InvoicedQuantity', { unitCode: item.Quantity?.['@unitCode'] || 'EA' })
             .txt(item.Quantity?.value || item.Quantity).up();
        iLine.ele('cbc:LineExtensionAmount', { currencyID: effectiveCurrency }).txt(lineExtensionAmount).up();

        iLine.ele('cac:OrderLineReference')
            .ele('cbc:LineID').txt((index + 1).toString()).up().up();

        const cacItem = iLine.ele('cac:Item');
        cacItem.ele('cbc:Name').txt(item.Item?.Name).up();

        cacItem.ele('cac:ClassifiedTaxCategory')
            .ele('cbc:ID').txt('S').up()
            .ele('cbc:Percent').txt((invoiceSupplement.taxRate * 100).toString()).up()
            .ele('cac:TaxScheme')
                .ele('cbc:ID').txt(invoiceSupplement.taxScheme.id).up()
            .up()
        .up();
        cacItem.up();

        iLine.ele('cac:Price')
            .ele('cbc:PriceAmount', { currencyID: effectiveCurrency })
            .txt(item.Price?.PriceAmount?.value || '0.00').up()
        .up();
        
        iLine.up();
    });

    return invoice.end({ prettyPrint: true });
}

