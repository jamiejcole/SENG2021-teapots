$ErrorActionPreference = "Stop"

Write-Host "Loading sample.xml..."
$orderXml = Get-Content -Raw "$PSScriptRoot\..\models\sample.xml"
Write-Host "Loaded XML length:" $orderXml.Length

$bodyObj = @{
  orderXml = [string]$orderXml   # force string
  invoiceSupplement = @{
    currencyCode = "AUD"
    taxRate = 0.1
    taxScheme = @{ id = "GST"; taxTypeCode = "GST" }
    paymentMeans = @{
      code = "30"
      payeeFinancialAccount = @{ id = "123456"; name = "Main Account" }
    }
    paymentTerms = @{ note = "Pay within 14 days" }
  }
}

$body = $bodyObj | ConvertTo-Json -Depth 6 -Compress
Write-Host "First 120 JSON chars:" $body.Substring(0,120)

$response = Invoke-WebRequest -Method Post `
  -Uri "http://localhost:3002/api/v1/invoices" `
  -ContentType "application/json" `
  -Body $body `
  -TimeoutSec 30

Write-Host "Status:" $response.StatusCode
Write-Host "Content-Type:" $response.Headers["Content-Type"]
Write-Host "First 200 chars:"
$response.Content.Substring(0, [Math]::Min(200, $response.Content.Length))