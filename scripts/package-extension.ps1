param(
  [string]$OutputDirectory = "dist"
)

$ErrorActionPreference = "Stop"

$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
$manifestPath = Join-Path $projectRoot "manifest.json"
$manifest = Get-Content -Raw -Encoding utf8 $manifestPath | ConvertFrom-Json
$outputRoot = [IO.Path]::GetFullPath((Join-Path $projectRoot $OutputDirectory))
$outputPath = Join-Path $outputRoot "kamjjak-$($manifest.version).zip"
$tempRoot = [IO.Path]::GetFullPath([IO.Path]::GetTempPath())
$stagePath = [IO.Path]::GetFullPath(
  (Join-Path $tempRoot "clicker-package-$([Guid]::NewGuid().ToString('N'))")
)

if (-not $stagePath.StartsWith($tempRoot, [StringComparison]::OrdinalIgnoreCase)) {
  throw "Temporary package path escaped the system temp directory."
}

$files = @("manifest.json", "LICENSE")
$directories = @("assets", "pages", "src", "styles")

New-Item -ItemType Directory -Force $outputRoot | Out-Null
New-Item -ItemType Directory $stagePath | Out-Null

try {
  foreach ($file in $files) {
    Copy-Item -LiteralPath (Join-Path $projectRoot $file) -Destination $stagePath
  }

  foreach ($directory in $directories) {
    Copy-Item -LiteralPath (Join-Path $projectRoot $directory) -Destination (Join-Path $stagePath $directory) -Recurse
  }

  if (Test-Path -LiteralPath $outputPath) {
    [IO.File]::Delete($outputPath)
  }

  Add-Type -AssemblyName System.IO.Compression.FileSystem
  [IO.Compression.ZipFile]::CreateFromDirectory(
    $stagePath,
    $outputPath,
    [IO.Compression.CompressionLevel]::Optimal,
    $false
  )
} finally {
  if (Test-Path -LiteralPath $stagePath) {
    [IO.Directory]::Delete($stagePath, $true)
  }
}

$archive = [IO.Compression.ZipFile]::OpenRead($outputPath)
try {
  $entryNames = @($archive.Entries | ForEach-Object FullName)
  if ($entryNames -notcontains "manifest.json") {
    throw "manifest.json is not at the ZIP root."
  }
  if ($entryNames | Where-Object { $_ -match '^(docs|tests|scripts|\.agents|\.git)/' }) {
    throw "Development files were included in the release ZIP."
  }
} finally {
  $archive.Dispose()
}

Write-Output $outputPath
