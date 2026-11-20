# Exports cv.docx -> ..\cv.pdf and cv(esp).docx -> ..\cv(esp).pdf using Microsoft Word.
# Each export runs in its own job with a timeout, because Word automation occasionally hangs.
$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Split-Path -Parent $here
$pairs = @(
  @{ src = Join-Path $here 'cv.docx';      dst = Join-Path $root 'cv.pdf' },
  @{ src = Join-Path $here 'cv(esp).docx'; dst = Join-Path $root 'cv(esp).pdf' }
)
$export = {
  param($src, $dst)
  $w = New-Object -ComObject Word.Application
  $w.DisplayAlerts = 0
  $w.AutomationSecurity = 3
  try {
    $d = $w.Documents.OpenNoRepairDialog($src, $false, $true, $false)
    $pages = $d.ComputeStatistics(2)
    $d.ExportAsFixedFormat($dst, 17)
    $d.Close(0)
    "$(Split-Path -Leaf $src) -> $(Split-Path -Leaf $dst) ($pages pages)"
  } finally { $w.Quit() }
}
foreach ($p in $pairs) {
  $ok = $false
  for ($try = 1; $try -le 3 -and -not $ok; $try++) {
    $j = Start-Job -ScriptBlock $export -ArgumentList $p.src, $p.dst
    if (Wait-Job $j -Timeout 120) { Receive-Job $j; $ok = $true }
    else {
      Write-Output "timeout exporting $($p.src) (attempt $try)"
      Stop-Job $j
      Get-Process WINWORD -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -eq '' } | Stop-Process -Force
    }
    Remove-Job $j -Force
  }
  if (-not $ok) { throw "Could not export $($p.src)" }
}
