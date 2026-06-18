Add-Type -AssemblyName System.Drawing

$dir = "src-tauri\icons"
New-Item -ItemType Directory -Force -Path $dir | Out-Null

function New-KefirBitmap([int]$size) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g   = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    # Navy background
    $g.Clear([System.Drawing.Color]::FromArgb(10, 37, 64))
    # Orange circle (Minfy brand)
    $pad   = [Math]::Max(1, [int]($size * 0.12))
    $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(232, 93, 38))
    $g.FillEllipse($brush, $pad, $pad, $size - 2*$pad, $size - 2*$pad)
    $brush.Dispose()
    $g.Dispose()
    return $bmp
}

# PNGs
foreach ($s in @(32, 128, 256)) {
    $bmp = New-KefirBitmap $s
    $bmp.Save("$dir\$($s)x$($s).png", [System.Drawing.Imaging.ImageFormat]::Png)
    if ($s -eq 128) {
        $bmp.Save("$dir\128x128@2x.png", [System.Drawing.Imaging.ImageFormat]::Png)
    }
    $bmp.Dispose()
    Write-Host "  Created ${s}x${s}.png"
}

# ICO — multi-size (16, 32, 48, 256) in PNG-inside-ICO format
$icoSizes = @(16, 32, 48, 256)
$pngBytes = @()
foreach ($s in $icoSizes) {
    $bmp = New-KefirBitmap $s
    $ms  = New-Object System.IO.MemoryStream
    $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    $pngBytes += , $ms.ToArray()
    $bmp.Dispose(); $ms.Dispose()
}

$ms = New-Object System.IO.MemoryStream
$bw = New-Object System.IO.BinaryWriter($ms)

# ICONDIR header
$bw.Write([uint16]0)                        # reserved
$bw.Write([uint16]1)                        # type = ICO
$bw.Write([uint16]$icoSizes.Count)          # image count

# ICONDIRENTRY array
$dataOffset = [int](6 + 16 * $icoSizes.Count)
for ($i = 0; $i -lt $icoSizes.Count; $i++) {
    $s = $icoSizes[$i]
    $bw.Write([byte]$(if ($s -ge 256) { 0 } else { $s }))   # width  (0 = 256)
    $bw.Write([byte]$(if ($s -ge 256) { 0 } else { $s }))   # height (0 = 256)
    $bw.Write([byte]0)          # color count (truecolor)
    $bw.Write([byte]0)          # reserved
    $bw.Write([uint16]1)        # planes
    $bw.Write([uint16]32)       # bits per pixel
    $bw.Write([uint32]$pngBytes[$i].Length)
    $bw.Write([uint32]$dataOffset)
    $dataOffset += $pngBytes[$i].Length
}

# Image data
foreach ($bytes in $pngBytes) { $bw.Write($bytes) }
$bw.Flush()

[System.IO.File]::WriteAllBytes("$dir\icon.ico", $ms.ToArray())
$bw.Dispose(); $ms.Dispose()
Write-Host "  Created icon.ico (16/32/48/256px)"

# ICNS — macOS placeholder (not needed for Windows builds)
Copy-Item "$dir\128x128.png" "$dir\icon.icns" -Force
Write-Host "  Created icon.icns (placeholder)"

Write-Host "`nAll icons ready in $dir"
