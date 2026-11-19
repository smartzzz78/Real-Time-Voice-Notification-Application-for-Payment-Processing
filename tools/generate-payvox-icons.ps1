$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$repo = Split-Path -Parent $PSScriptRoot
$icons = Join-Path $repo 'docs\icons'
$apkRes = Join-Path ([Environment]::GetFolderPath('MyDocuments')) 'coffee-slip-apk\app-merged\res'
New-Item -ItemType Directory -Force -Path $icons | Out-Null

function New-PayVoxMaster {
  param([string]$Path)

  $size = 1024
  $bmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
  $g.Clear([System.Drawing.Color]::Transparent)

  $circle = New-Object System.Drawing.RectangleF(28, 28, 968, 968)
  $border = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 0, 194, 255))
  $g.FillEllipse($border, $circle)

  $inner = New-Object System.Drawing.RectangleF(46, 46, 932, 932)
  $blue1 = [System.Drawing.Color]::FromArgb(255, 0, 80, 235)
  $blue2 = [System.Drawing.Color]::FromArgb(255, 0, 15, 105)
  $blueBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($inner, $blue1, $blue2, 55)
  $g.FillEllipse($blueBrush, $inner)

  # Keep every decorative element inside the blue badge.
  $clipPath = New-Object System.Drawing.Drawing2D.GraphicsPath
  $clipPath.AddEllipse($inner)
  $g.SetClip($clipPath)

  # Gloss and bottom wave.
  $gloss = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(35, 80, 230, 255))
  $g.FillEllipse($gloss, (New-Object System.Drawing.RectangleF(80, 55, 760, 500)))
  $waveBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(150, 0, 112, 255))
  $wave = New-Object System.Drawing.Drawing2D.GraphicsPath
  $wave.AddBezier(75, 825, 310, 930, 700, 830, 955, 705)
  $wave.AddLine(955, 935)
  $wave.AddLine(75, 935)
  $wave.CloseFigure()
  $g.FillPath($waveBrush, $wave)

  # Main P mark.
  $fontP = New-Object System.Drawing.Font('Arial', 430, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $white = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
  $g.DrawString('P', $fontP, $white, 225, 120)

  # Cyan lower stem accent.
  $cyan1 = [System.Drawing.Color]::FromArgb(255, 120, 245, 255)
  $cyan2 = [System.Drawing.Color]::FromArgb(255, 0, 175, 245)
  $stemRect = New-Object System.Drawing.RectangleF(390, 430, 145, 225)
  $cyanBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($stemRect, $cyan1, $cyan2, 25)
  $stemPath = New-Object System.Drawing.Drawing2D.GraphicsPath
  $stemPath.AddPolygon([System.Drawing.PointF[]]@(
    (New-Object System.Drawing.PointF(430, 425)),
    (New-Object System.Drawing.PointF(565, 425)),
    (New-Object System.Drawing.PointF(500, 650)),
    (New-Object System.Drawing.PointF(365, 650))
  ))
  $g.FillPath($cyanBrush, $stemPath)

  # Speaker inside P.
  $speaker = New-Object System.Drawing.Drawing2D.GraphicsPath
  $speaker.AddPolygon([System.Drawing.PointF[]]@(
    (New-Object System.Drawing.PointF(500, 338)),
    (New-Object System.Drawing.PointF(555, 338)),
    (New-Object System.Drawing.PointF(615, 295)),
    (New-Object System.Drawing.PointF(615, 420)),
    (New-Object System.Drawing.PointF(555, 377)),
    (New-Object System.Drawing.PointF(500, 377))
  ))
  $g.FillPath($white, $speaker)
  $wavePen = New-Object System.Drawing.Pen([System.Drawing.Color]::White, 24)
  $wavePen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $wavePen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $g.DrawArc($wavePen, 600, 305, 95, 110, -65, 130)
  $g.DrawArc($wavePen, 620, 275, 145, 170, -65, 130)

  # Wireless arcs at upper right.
  $signalPen = New-Object System.Drawing.Pen([System.Drawing.Color]::White, 32)
  $signalPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $signalPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $g.DrawArc($signalPen, 620, 125, 220, 220, 285, 70)
  $g.DrawArc($signalPen, 640, 80, 310, 310, 285, 70)

  # PayVox wordmark.
  $fontWord = New-Object System.Drawing.Font('Arial', 145, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $g.DrawString('Pay', $fontWord, $white, 130, 655)
  $g.DrawString('Vox', $fontWord, $cyanBrush, 445, 655)

  $underlinePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 55, 225, 255), 18)
  $underlinePen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $underlinePen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $g.DrawArc($underlinePen, 390, 790, 410, 120, 200, 140)

  $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)

  $underlinePen.Dispose(); $signalPen.Dispose(); $wavePen.Dispose()
  $fontWord.Dispose(); $fontP.Dispose()
  $clipPath.Dispose(); $stemPath.Dispose(); $wave.Dispose()
  $cyanBrush.Dispose(); $waveBrush.Dispose(); $gloss.Dispose()
  $blueBrush.Dispose(); $border.Dispose(); $white.Dispose()
  $g.Dispose(); $bmp.Dispose()
}

function Resize-Png {
  param([string]$Source, [string]$Target, [int]$Size)
  $sourceImage = [System.Drawing.Image]::FromFile($Source)
  $output = New-Object System.Drawing.Bitmap($Size, $Size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($output)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.Clear([System.Drawing.Color]::Transparent)
  $graphics.DrawImage($sourceImage, 0, 0, $Size, $Size)
  $parent = Split-Path -Parent $Target
  New-Item -ItemType Directory -Force -Path $parent | Out-Null
  $output.Save($Target, [System.Drawing.Imaging.ImageFormat]::Png)
  $graphics.Dispose(); $output.Dispose(); $sourceImage.Dispose()
}

$master = Join-Path $icons 'payvox-master.png'
New-PayVoxMaster -Path $master

Resize-Png $master (Join-Path $icons 'icon-512.png') 512
Resize-Png $master (Join-Path $icons 'icon-maskable-512.png') 512
Resize-Png $master (Join-Path $icons 'icon-192.png') 192
Resize-Png $master (Join-Path $icons 'apple-touch-icon.png') 180

$androidSizes = @{
  'mipmap-mdpi' = 48
  'mipmap-hdpi' = 72
  'mipmap-xhdpi' = 96
  'mipmap-xxhdpi' = 144
  'mipmap-xxxhdpi' = 192
}
foreach ($entry in $androidSizes.GetEnumerator()) {
  Resize-Png $master (Join-Path $apkRes ($entry.Key + '\ic_launcher.png')) $entry.Value
}

Write-Output "Generated PayVox icons from $master"
