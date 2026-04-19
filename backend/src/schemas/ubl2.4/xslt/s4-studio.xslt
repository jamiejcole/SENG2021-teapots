<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:inv="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
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
                    <xsl:value-of select="(/inv:Invoice/cbc:ID)[1]"/>
                </title>
                <link href="tailwind.min.css" rel="stylesheet"/>
            </head>
            <body>
                <div class="w-full main" style="font-family: 'Geist Mono', 'Geist Mono Fallback', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', monospace">
                    <div class="px-4 sm:px-10 pt-10 pb-5">
                        <div class="flex items-start justify-between gap-4">
                            <div>
                                <span class="inline-block rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-amber-800">
                                    Invoice
                                </span>
                                <div class="mt-2 text-xl font-bold">
                                    <xsl:value-of select="(/inv:Invoice/cbc:ID)[1]"/>
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
                        <div class="space-y-1">
                            <div class="text-xs uppercase tracking-widest text-gray-400">Your business</div>
                            <div class="font-semibold text-base">
                                <xsl:value-of select="//cac:AccountingSupplierParty//cbc:Name"/>
                            </div>
                            <div>
                                <xsl:value-of select="//cac:AccountingSupplierParty//cac:PostalAddress/cbc:StreetName"/>
                                <xsl:if test="normalize-space(//cac:AccountingSupplierParty//cac:PostalAddress/cbc:PostalZone) or normalize-space(//cac:AccountingSupplierParty//cac:PostalAddress/cbc:CityName)">
                                    <br/>
                                    <xsl:value-of select="//cac:AccountingSupplierParty//cac:PostalAddress/cbc:PostalZone"/>
                                    <xsl:text> </xsl:text>
                                    <xsl:value-of select="//cac:AccountingSupplierParty//cac:PostalAddress/cbc:CityName"/>
                                </xsl:if>
                                <xsl:if test="normalize-space(//cac:AccountingSupplierParty//cac:PostalAddress/cbc:CountrySubentity)">
                                    <br/>
                                    <xsl:value-of select="//cac:AccountingSupplierParty//cac:PostalAddress/cbc:CountrySubentity"/>
                                </xsl:if>
                            </div>
                            <div class="text-gray-600">
                                <span class="text-gray-400">Phone: </span>
                                <xsl:value-of select="//cac:AccountingSupplierParty//cac:Contact/cbc:Telephone"/>
                            </div>
                            <div class="text-gray-600">
                                <span class="text-gray-400">Email: </span>
                                <xsl:value-of select="//cac:AccountingSupplierParty//cac:Contact/cbc:ElectronicMail"/>
                            </div>
                        </div>

                        <div class="space-y-1">
                            <div class="text-xs uppercase tracking-widest text-gray-400">Customer details</div>
                            <div class="font-semibold text-base">
                                <xsl:value-of select="//cac:AccountingCustomerParty//cbc:Name"/>
                            </div>
                            <div>
                                <xsl:value-of select="//cac:AccountingCustomerParty//cac:PostalAddress/cbc:StreetName"/>
                                <xsl:if test="normalize-space(//cac:AccountingCustomerParty//cac:PostalAddress/cbc:PostalZone) or normalize-space(//cac:AccountingCustomerParty//cac:PostalAddress/cbc:CityName)">
                                    <br/>
                                    <xsl:value-of select="//cac:AccountingCustomerParty//cac:PostalAddress/cbc:PostalZone"/>
                                    <xsl:text> </xsl:text>
                                    <xsl:value-of select="//cac:AccountingCustomerParty//cac:PostalAddress/cbc:CityName"/>
                                </xsl:if>
                                <xsl:if test="normalize-space(//cac:AccountingCustomerParty//cac:PostalAddress/cbc:CountrySubentity)">
                                    <br/>
                                    <xsl:value-of select="//cac:AccountingCustomerParty//cac:PostalAddress/cbc:CountrySubentity"/>
                                </xsl:if>
                            </div>
                            <div class="text-gray-600">
                                <span class="text-gray-400">Contact email: </span>
                                <xsl:value-of select="//cac:AccountingCustomerParty//cac:Contact/cbc:ElectronicMail"/>
                            </div>
                            <div class="text-gray-600">
                                <span class="text-gray-400">Contact phone: </span>
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
                                            <div class="font-medium">
                                                <xsl:value-of select="cac:Item/cbc:Name"/>
                                            </div>
                                            <div class="text-sm text-gray-500">
                                                <xsl:value-of select="cac:Item/cbc:Description"/>
                                            </div>
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
                                        <td class="py-2 text-right tabular-nums">
                                            <xsl:value-of select="format-number(cbc:LineExtensionAmount,'A$#,##0.00')"/>
                                        </td>
                                    </tr>
                                </xsl:for-each>
                            </tbody>
                        </table>
                    </div>

                    <div class="sm:hidden px-4 py-5 space-y-3">
                        <xsl:for-each select="//cac:InvoiceLine">
                            <div class="rounded-2xl border border-gray-100 p-3 space-y-1">
                                <div class="flex items-start justify-between gap-2">
                                    <div class="font-medium">
                                        <xsl:value-of select="cac:Item/cbc:Name"/>
                                    </div>
                                    <div class="tabular-nums font-semibold shrink-0">
                                        <xsl:value-of select="format-number(cbc:LineExtensionAmount,'A$#,##0.00')"/>
                                    </div>
                                </div>
                                <div class="text-xs text-gray-500">
                                    <xsl:value-of select="cbc:InvoicedQuantity"/>
                                    <xsl:text> </xsl:text>
                                    <xsl:value-of select="cbc:InvoicedQuantity/@unitCode"/>
                                    <xsl:text> × </xsl:text>
                                    <xsl:value-of select="format-number(cac:Price/cbc:PriceAmount,'A$#,##0.00')"/>
                                </div>
                                <div class="text-xs text-gray-500">
                                    <xsl:value-of select="cac:Item/cbc:Description"/>
                                </div>
                            </div>
                        </xsl:for-each>
                    </div>

                    <div class="px-4 sm:px-10 py-5 border-t border-gray-100">
                        <div class="flex justify-end">
                            <div class="w-80">
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
                        <div class="text-xs uppercase tracking-widest text-gray-400 mb-2">Job details</div>
                        <div class="text-gray-600">
                            <xsl:value-of select="normalize-space((//cbc:Note)[1])"/>
                        </div>
                    </div>

                    <div class="px-4 sm:px-10 py-5 border-t border-gray-100">
                        <div class="text-xs uppercase tracking-widest text-gray-400 mb-2">Payment information</div>
                        <div class="flex flex-wrap gap-x-8 gap-y-1 text-gray-600">
                            <div>
                                <span class="text-gray-400">BSB: </span>
                                <xsl:value-of select="//cac:PaymentMeans/cac:PayeeFinancialAccount/cac:FinancialInstitutionBranch/cbc:ID"/>
                            </div>
                            <div>
                                <span class="text-gray-400">Account number: </span>
                                <xsl:value-of select="//cac:PaymentMeans/cac:PayeeFinancialAccount/cbc:ID"/>
                            </div>
                            <div>
                                <span class="text-gray-400">Account name: </span>
                                <xsl:value-of select="//cac:PaymentMeans/cac:PayeeFinancialAccount/cbc:Name"/>
                            </div>
                        </div>
                        <div class="mt-4 text-gray-600">
                            <div class="text-xs uppercase tracking-widest text-gray-400 mb-2">Payment notes</div>
                            <xsl:value-of select="normalize-space(//cac:PaymentTerms/cbc:Note)"/>
                        </div>
                    </div>

                    <div class="h-10"></div>
                </div>
            </body>
        </html>
    </xsl:template>
</xsl:stylesheet>
