<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
    xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">

    <xsl:output method="html" indent="yes" doctype-system="about:legacy-compat"/>

    <xsl:template match="/">

<html lang="en">
<head>
    <meta charset="UTF-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>
        <xsl:text>Invoice </xsl:text>
        <xsl:value-of select="//cbc:ID"/>
    </title>
    <link href="tailwind.min.css" rel="stylesheet"/>
</head>

<body>
    <div class="w-full main" style="font-family: 'Geist Mono', 'Geist Mono Fallback', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', monospace">
        <div class="px-4 sm:px-10 pt-10 pb-5">
            <div class="flex items-start justify-between gap-4">
                <div>
                    <span class="inline-block px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded bg-gray-100 text-gray-700">
                        Invoice
                    </span>
                    <div class="mt-2 text-xl font-bold">
                        <xsl:value-of select="//cbc:ID"/>
                    </div>
                </div>
                <div class="text-right space-y-1">
                    <div>
                        <span class="text-gray-400">Date: </span>
                        <xsl:value-of select="//cbc:IssueDate"/>
                    </div>
                    <div>
                        <span class="text-gray-400">Due: </span>
                        <xsl:value-of select="//cbc:DueDate"/>
                    </div>
                    <div>
                        <span class="text-gray-400">Currency: </span>
                        <xsl:value-of select="//cbc:DocumentCurrencyCode"/>
                    </div>
                </div>
            </div>
        </div>

        <div class="px-4 sm:px-10 py-5 grid grid-cols-1 sm:grid-cols-2 gap-8 border-t border-gray-100">
            <!-- Supplier -->
            <div class="space-y-1">
                <div class="text-xs uppercase tracking-widest text-gray-400">From</div>
                <div class="font-semibold text-base">
                    <xsl:value-of select="//cac:AccountingSupplierParty//cbc:Name"/>
                </div>
                <div>
                    <xsl:value-of select="//cac:AccountingSupplierParty//cac:PostalAddress/cbc:StreetName"/><br/>
                    <xsl:value-of select="//cac:AccountingSupplierParty//cac:PostalAddress/cbc:PostalZone"/>
                    <xsl:text> </xsl:text>
                    <xsl:value-of select="//cac:AccountingSupplierParty//cac:PostalAddress/cbc:CityName"/><br/>
                    <xsl:value-of select="//cac:AccountingSupplierParty//cac:PostalAddress/cbc:CountrySubentity"/>
                </div>
                <div class="text-gray-500">
                    VAT: <xsl:value-of select="//cac:AccountingSupplierParty//cac:PartyTaxScheme/cbc:CompanyID"/>
                </div>
                <div class="text-gray-500">
                    Peppol: <xsl:value-of select="//cac:AccountingSupplierParty//cbc:EndpointID"/>
                </div>
            </div>

            <!-- Customer -->
            <div class="space-y-1">
                <div class="text-xs uppercase tracking-widest text-gray-400">To</div>
                <div class="font-semibold text-base">
                    <xsl:value-of select="//cac:AccountingCustomerParty//cbc:Name"/>
                </div>
                <div>
                    <xsl:value-of select="//cac:AccountingCustomerParty//cac:PostalAddress/cbc:StreetName"/><br/>
                    <xsl:value-of select="//cac:AccountingCustomerParty//cac:PostalAddress/cbc:PostalZone"/>
                    <xsl:text> </xsl:text>
                    <xsl:value-of select="//cac:AccountingCustomerParty//cac:PostalAddress/cbc:CityName"/><br/>
                    <xsl:value-of select="//cac:AccountingCustomerParty//cac:PostalAddress/cbc:CountrySubentity"/>
                </div>
                <div class="text-gray-500">
                    VAT: <xsl:value-of select="//cac:AccountingCustomerParty//cac:PartyTaxScheme/cbc:CompanyID"/>
                </div>
                <div class="text-gray-500">
                    Peppol: <xsl:value-of select="//cac:AccountingCustomerParty//cbc:EndpointID"/>
                </div>
                <div class="text-gray-500">
                    <xsl:value-of select="//cac:AccountingCustomerParty//cac:Contact/cbc:ElectronicMail"/>
                </div>
                <div class="text-gray-500">
                    <xsl:value-of select="//cac:AccountingCustomerParty//cac:Contact/cbc:Telephone"/>
                </div>
            </div>
        </div>

        <div class="px-4 sm:px-10 py-3 border-t border-gray-100 flex flex-wrap gap-x-6 gap-y-1 text-gray-500">
            <div>
                <span class="text-gray-400">Order: </span>
                <xsl:value-of select="//cac:OrderReference/cbc:ID"/>
            </div>
        </div>

        <div class="hidden sm:block px-4 sm:px-10 py-5 overflow-x-auto">
            <table class="w-full border-collapse">
                <thead>
                    <tr class="border-b-2 border-gray-900">
                        <th scope="col" class="text-left py-2 pr-3 w-10">#</th>
                        <th scope="col" class="text-left py-2 pr-3">Description</th>
                        <th scope="col" class="text-right py-2 pr-3 w-20">Qty</th>
                        <th scope="col" class="text-right py-2 pr-3 w-28">Unit Price</th>
                        <th scope="col" class="text-right py-2 pr-3 w-16">VAT%</th>
                        <th scope="col" class="text-right py-2 w-28">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    <xsl:for-each select="//cac:InvoiceLine">
                        <tr class="border-b border-gray-100">
                            <td class="py-2 pr-3 text-gray-400">
                                <xsl:value-of select="cbc:ID"/>
                            </td>
                            <td class="py-2 pr-3">
                                <xsl:value-of select="cac:Item/cbc:Name"/>
                            </td>
                            <td class="py-2 pr-3 text-right tabular-nums">
                                <xsl:value-of select="cbc:InvoicedQuantity"/>
                                <span class="text-gray-400 ml-1 text-xs">
                                    <xsl:value-of select="cbc:InvoicedQuantity/@unitCode"/>
                                </span>
                            </td>
                            <td class="py-2 pr-3 text-right tabular-nums">
                                <xsl:value-of select="format-number(cac:Price/cbc:PriceAmount,'A$#,##0.00')"/>
                            </td>
                            <td class="py-2 pr-3 text-right tabular-nums">
                                <xsl:value-of select="cac:Item/cac:ClassifiedTaxCategory/cbc:Percent"/>
                            </td>
                            <td class="py-2 text-right tabular-nums">
                                <xsl:value-of select="format-number(cbc:LineExtensionAmount,'A$#,##0.00')"/>
                            </td>
                        </tr>
                    </xsl:for-each>
                </tbody>
            </table>
        </div>

        <div class="px-4 sm:px-10 py-5 border-t border-gray-100">
            <div class="flex justify-end">
                <div class="w-80">
                    <div class="mb-3">
                        <div class="flex justify-between py-0.5 text-gray-500">
                            <span>
                                VAT <xsl:value-of select="//cac:TaxTotal/cac:TaxSubtotal/cbc:Percent"/>
                                <span class="text-gray-400 ml-1">(S)</span>
                            </span>
                            <span class="tabular-nums">
                                <xsl:value-of select="format-number(//cac:TaxTotal/cbc:TaxAmount,'A$#,##0.00')"/>
                            </span>
                        </div>
                    </div>
                    <div class="border-t border-gray-200 pt-2 space-y-1">
                        <div class="flex justify-between">
                            <span class="text-gray-500">Subtotal</span>
                            <span class="tabular-nums">
                                <xsl:value-of select="format-number(//cac:LegalMonetaryTotal/cbc:LineExtensionAmount,'A$#,##0.00')"/>
                            </span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-500">Tax</span>
                            <span class="tabular-nums">
                                <xsl:value-of select="format-number(//cac:TaxTotal/cbc:TaxAmount,'A$#,##0.00')"/>
                            </span>
                        </div>
                        <div class="flex justify-between font-bold text-base border-t-2 border-gray-900 pt-2 mt-2">
                            <span>Amount Due</span>
                            <span class="tabular-nums">
                                <xsl:value-of select="format-number(//cac:LegalMonetaryTotal/cbc:PayableAmount,'A$#,##0.00')"/>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="px-4 sm:px-10 py-5 border-t border-gray-100">
            <div class="text-xs uppercase tracking-widest text-gray-400 mb-2">Payment Information</div>
            <div class="flex flex-wrap gap-x-8 gap-y-1 text-gray-600">
                <div><span class="text-gray-400">IBAN: </span><xsl:value-of select="//cac:PaymentMeans/cac:PayeeFinancialAccount/cbc:ID"/></div>
                <div><span class="text-gray-400">BIC: </span><xsl:value-of select="//cac:PaymentMeans/cac:PayeeFinancialAccount/cac:FinancialInstitutionBranch/cbc:ID"/></div>
                <div><span class="text-gray-400">Account: </span><xsl:value-of select="//cac:PaymentMeans/cac:PayeeFinancialAccount/cbc:Name"/></div>
            </div>
        </div>
    </div>
</body>
</html>

</xsl:template>
</xsl:stylesheet>