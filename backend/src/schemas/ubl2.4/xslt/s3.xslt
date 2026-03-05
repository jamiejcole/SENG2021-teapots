<?xml version="1.0" encoding="UTF-8"?>

<xsl:stylesheet version="2.0"
xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
xmlns:inv="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
exclude-result-prefixes="cac cbc inv">

<xsl:output method="html" encoding="UTF-8" indent="yes"/>

<xsl:template match="/">

<html>
<head>
<meta charset="utf-8"/>

<style>

body{
font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
background:#f5f6fa;
margin:0;
padding:40px;
color:#1f2937;
}

.invoice{
max-width:1000px;
margin:auto;
background:white;
padding:40px;
box-shadow:0 10px 40px rgba(0,0,0,0.08);
border-radius:12px;
}

.header{
display:flex;
justify-content:space-between;
align-items:flex-start;
margin-bottom:40px;
}

.title{
font-size:34px;
font-weight:700;
letter-spacing:1px;
}

.meta{
text-align:right;
font-size:14px;
color:#6b7280;
}

.section{
display:flex;
gap:40px;
margin-bottom:40px;
}

.party{
flex:1;
background:#fafafa;
padding:20px;
border-radius:8px;
}

.party h3{
margin:0 0 10px 0;
font-size:14px;
text-transform:uppercase;
color:#6b7280;
}

.party p{
margin:4px 0;
}

table{
width:100%;
border-collapse:collapse;
margin-bottom:30px;
}

thead{
background:#111827;
color:white;
}

th{
padding:12px;
text-align:left;
font-weight:600;
font-size:13px;
}

td{
padding:12px;
border-bottom:1px solid #e5e7eb;
}

td.right{
text-align:right;
}

tfoot td{
font-weight:600;
}

.totals{
width:320px;
margin-left:auto;
}

.totals td{
border:none;
padding:6px 0;
}

.totals tr.total td{
font-size:18px;
font-weight:700;
padding-top:10px;
}

.footer{
margin-top:40px;
font-size:13px;
color:#6b7280;
text-align:center;
}

@media print {
body{background:white;padding:0}
.invoice{box-shadow:none}
}

</style>

</head>

<body>

<div class="invoice">

<div class="header">

<div class="title">
INVOICE
</div>

<div class="meta">
<div><b>Invoice #:</b> <xsl:value-of select="//cbc:ID"/></div>
<div><b>Issue Date:</b> <xsl:value-of select="//cbc:IssueDate"/></div>
<div><b>Due Date:</b> <xsl:value-of select="//cbc:DueDate"/></div>
</div>

</div>


<div class="section">

<div class="party">
<h3>Supplier</h3>

<p><b><xsl:value-of select="//cac:AccountingSupplierParty//cbc:Name"/></b></p>

<p>
<xsl:value-of select="//cac:AccountingSupplierParty//cbc:StreetName"/>
</p>

<p>
<xsl:value-of select="//cac:AccountingSupplierParty//cbc:CityName"/>
</p>

<p>
<xsl:value-of select="//cac:AccountingSupplierParty//cbc:PostalZone"/>
</p>

</div>


<div class="party">
<h3>Customer</h3>

<p><b><xsl:value-of select="//cac:AccountingCustomerParty//cbc:Name"/></b></p>

<p>
<xsl:value-of select="//cac:AccountingCustomerParty//cbc:StreetName"/>
</p>

<p>
<xsl:value-of select="//cac:AccountingCustomerParty//cbc:CityName"/>
</p>

<p>
<xsl:value-of select="//cac:AccountingCustomerParty//cbc:PostalZone"/>
</p>

</div>

</div>


<table>

<thead>
<tr>
<th>Description</th>
<th>Qty</th>
<th>Unit Price</th>
<th class="right">Total</th>
</tr>
</thead>

<tbody>

<xsl:for-each select="//cac:InvoiceLine">

<tr>

<td>
<xsl:value-of select="cac:Item/cbc:Name"/>
</td>

<td>
<xsl:value-of select="cbc:InvoicedQuantity"/>
</td>

<td>
<xsl:value-of select="cac:Price/cbc:PriceAmount"/>
</td>

<td class="right">
<xsl:value-of select="cbc:LineExtensionAmount"/>
</td>

</tr>

</xsl:for-each>

</tbody>

</table>


<table class="totals">

<tr>
<td>Subtotal</td>
<td class="right">
<xsl:value-of select="//cac:LegalMonetaryTotal/cbc:LineExtensionAmount"/>
</td>
</tr>

<tr>
<td>Tax</td>
<td class="right">
<xsl:value-of select="//cac:TaxTotal/cbc:TaxAmount"/>
</td>
</tr>

<tr class="total">
<td>Total</td>
<td class="right">
<xsl:value-of select="//cac:LegalMonetaryTotal/cbc:PayableAmount"/>
</td>
</tr>

</table>


<div class="footer">
Thank you for your business
</div>

</div>

</body>
</html>

</xsl:template>

</xsl:stylesheet>