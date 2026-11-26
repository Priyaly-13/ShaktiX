<#
  REPLATE — Local HTTP Server, Auth (PBKDF2 + HMAC), Food Safety Validator & JSON Database
  Compatible with Windows PowerShell 5.1 (.NET Framework 4.x)
#>

param(
  [int]$Port = $(if ($env:PORT) { [int]$env:PORT } else { 5050 }),
  [string]$HostName = $(if ($env:REPLATE_HOST) { $env:REPLATE_HOST } else { 'localhost' })
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Web

$RootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$DbPath = Join-Path $RootDir 'db.json'
$UploadsDir = Join-Path $RootDir 'uploads'
$ImagesDir = Join-Path $RootDir 'images'

if (-not (Test-Path $UploadsDir)) { New-Item -ItemType Directory -Path $UploadsDir | Out-Null }
if (-not (Test-Path $ImagesDir)) { New-Item -ItemType Directory -Path $ImagesDir | Out-Null }

# Secret key for signing auth tokens (persisted per local workspace)
$SecretPath = Join-Path $RootDir '.auth_secret'
if (-not (Test-Path $SecretPath)) {
  $rng = New-Object System.Security.Cryptography.RNGCryptoServiceProvider
  $bytes = New-Object byte[] 32
  $rng.GetBytes($bytes)
  [Convert]::ToBase64String($bytes) | Set-Content -Path $SecretPath -Encoding UTF8
}
$AuthSecret = (Get-Content -Path $SecretPath -Raw).Trim()

# ==============================================================================
# Crypto Helpers: PBKDF2-SHA256 Password Hashing & HMAC-SHA256 Token Signing
# ==============================================================================
function New-PasswordHash {
  param([string]$Password)
  $saltBytes = New-Object byte[] 16
  $rng = New-Object System.Security.Cryptography.RNGCryptoServiceProvider
  $rng.GetBytes($saltBytes)
  $pbkdf2 = New-Object System.Security.Cryptography.Rfc2898DeriveBytes($Password, $saltBytes, 12000, [System.Security.Cryptography.HashAlgorithmName]::SHA256)
  $hashBytes = $pbkdf2.GetBytes(32)
  return "pbkdf2_sha256`$$([Convert]::ToBase64String($saltBytes))`$$([Convert]::ToBase64String($hashBytes))"
}

function Test-PasswordHash {
  param([string]$Password, [string]$StoredHash)
  if ([string]::IsNullOrWhiteSpace($StoredHash)) { return $false }
  $parts = $StoredHash -split '\$'
  if ($parts.Length -ne 3 -or $parts[0] -ne 'pbkdf2_sha256') { return $false }
  try {
    $saltBytes = [Convert]::FromBase64String($parts[1])
    $expected = [Convert]::FromBase64String($parts[2])
    $pbkdf2 = New-Object System.Security.Cryptography.Rfc2898DeriveBytes($Password, $saltBytes, 12000, [System.Security.Cryptography.HashAlgorithmName]::SHA256)
    $actual = $pbkdf2.GetBytes(32)
    if ($actual.Length -ne $expected.Length) { return $false }
    $diff = 0
    for ($i = 0; $i -lt $actual.Length; $i++) {
      $diff = $diff -bor ($actual[$i] -bxor $expected[$i])
    }
    return ($diff -eq 0)
  } catch {
    return $false
  }
}

function ConvertTo-Base64Url {
  param([byte[]]$Bytes)
  return ([Convert]::ToBase64String($Bytes)).TrimEnd('=').Replace('+', '-').Replace('/', '_')
}

function ConvertFrom-Base64Url {
  param([string]$Text)
  $s = $Text.Replace('-', '+').Replace('_', '/')
  while (($s.Length % 4) -ne 0) { $s += '=' }
  return [Convert]::FromBase64String($s)
}

function New-AuthToken {
  param([string]$LoginId, [string]$Role)
  $exp = [DateTimeOffset]::UtcNow.AddDays(7).ToUnixTimeSeconds()
  $payloadObj = [ordered]@{ loginId = $LoginId; role = $Role; exp = $exp }
  $payloadJson = $payloadObj | ConvertTo-Json -Compress
  $payloadB64 = ConvertTo-Base64Url ([Text.Encoding]::UTF8.GetBytes($payloadJson))
  $hmac = New-Object System.Security.Cryptography.HMACSHA256 (,[Text.Encoding]::UTF8.GetBytes($AuthSecret))
  $sigBytes = $hmac.ComputeHash([Text.Encoding]::UTF8.GetBytes($payloadB64))
  $sigB64 = ConvertTo-Base64Url $sigBytes
  return "$payloadB64.$sigB64"
}

function Read-AuthToken {
  param([string]$Token)
  if ([string]::IsNullOrWhiteSpace($Token)) { return $null }
  $parts = $Token -split '\.'
  if ($parts.Length -ne 2) { return $null }
  try {
    $hmac = New-Object System.Security.Cryptography.HMACSHA256 (,[Text.Encoding]::UTF8.GetBytes($AuthSecret))
    $expectedSig = ConvertTo-Base64Url ($hmac.ComputeHash([Text.Encoding]::UTF8.GetBytes($parts[0])))
    if ($expectedSig -ne $parts[1]) { return $null }
    $json = [Text.Encoding]::UTF8.GetString((ConvertFrom-Base64Url $parts[0]))
    $payload = $json | ConvertFrom-Json
    $now = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
    if ([long]$payload.exp -lt $now) { return $null }
    return $payload
  } catch {
    return $null
  }
}

# ==============================================================================
# Food Image Matcher Helper
# ==============================================================================
function Get-MatchingDishImage {
  param([string]$FoodName, [string]$Category)
  $n = if ($FoodName) { $FoodName.ToLower() } else { '' }
  if ($n -match 'kadhi') { return '/images/kadhi-chawal.jpg' }
  if ($n -match 'rajma') { return '/images/rajma-chawal.svg' }
  if ($n -match 'chole|bhature|chana') { return '/images/chole-bhature.svg' }
  if ($n -match 'dal|daal|khichdi|tadka') { return '/images/dal-rice.jpg' }
  if ($n -match 'biryani|pulao|tehri') { return '/images/veg-biryani.jpg' }
  if ($n -match 'samosa|kachori|pakora|bhaji') { return '/images/samosa.svg' }
  if ($n -match 'poha|upma|sheera') { return '/images/poha.svg' }
  if ($n -match 'idli|dosa|vada|uttapam|sambar') { return '/images/idli.jpg' }
  if ($n -match 'gulab|jamun|rasgulla|laddu|ladoo|barfi|halwa') { return '/images/gulab-jamun.jpg' }
  if ($n -match 'jalebi|imarti|malpua') { return '/images/jalebi.svg' }
  return '/images/fallback-food.jpg'
}

# ==============================================================================
# Food Safety Validator
# ==============================================================================
function Test-FoodSafety {
  param(
    [string]$FoodName,
    [string]$PreparedAtStr,
    [string]$BestBeforeStr,
    [string]$Details
  )

  if ([string]::IsNullOrWhiteSpace($FoodName) -or $FoodName.Trim().Length -lt 2) {
    return @{ safe = $false; reason = 'Please enter a valid food name.' }
  }

  $combined = ("$FoodName $Details").ToLower()
  $unsafeKeywords = @('spoiled', 'rotten', 'mold', 'mould', 'fungus', 'expired', 'stale', 'smelly', 'sour milk', 'bitten', 'leftover plate', 'alcohol', 'raw meat', 'uncooked meat')
  foreach ($kw in $unsafeKeywords) {
    if ($combined -match [regex]::Escape($kw)) {
      return @{
        safe = $false
        reason = "Food rejected by safety check: contains unsuitable or unsafe indicator ('$kw'). Only fresh, hygienic food can be donated."
      }
    }
  }

  $prepDt = [DateTimeOffset]::MinValue
  $bestDt = [DateTimeOffset]::MinValue
  if (-not [DateTimeOffset]::TryParse($PreparedAtStr, [ref]$prepDt)) {
    return @{ safe = $false; reason = 'Please enter a valid preparation date and time.' }
  }
  if (-not [DateTimeOffset]::TryParse($BestBeforeStr, [ref]$bestDt)) {
    return @{ safe = $false; reason = 'Please enter a valid best-before date and time.' }
  }

  $now = [DateTimeOffset]::Now
  if ($prepDt -gt $now.AddMinutes(10)) {
    return @{ safe = $false; reason = 'Preparation date and time cannot be in the future.' }
  }
  if ($bestDt -le $prepDt) {
    return @{ safe = $false; reason = 'Best-before time must be later than the preparation time.' }
  }
  if ($bestDt -le $now) {
    return @{ safe = $false; reason = 'Food is already past its best-before date and time, so it cannot be matched or donated.' }
  }
  if (($bestDt - $now).TotalMinutes -lt 30) {
    return @{ safe = $false; reason = 'Food expires in less than 30 minutes, leaving too little time for safe NGO pickup.' }
  }
  if (($now - $prepDt).TotalHours -gt 24) {
    return @{ safe = $false; reason = 'Food prepared more than 24 hours ago cannot be safely matched with NGOs.' }
  }

  return @{ safe = $true; reason = 'Passed food safety and freshness checks.' }
}

# ==============================================================================
# Initial Database Seeding
# ==============================================================================
function Initialize-Database {
  if (Test-Path $DbPath) { return }

  $now = [DateTimeOffset]::Now
  $prepToday = $now.AddHours(-1).ToString('yyyy-MM-ddTHH:mm')
  $prepMorning = $now.AddHours(-2).ToString('yyyy-MM-ddTHH:mm')
  $bestEvening = $now.AddHours(5).ToString('yyyy-MM-ddTHH:mm')
  $bestNight = $now.AddHours(7).ToString('yyyy-MM-ddTHH:mm')
  $bestSoon = $now.AddHours(2).ToString('yyyy-MM-ddTHH:mm')

  $seed = [ordered]@{
    users = @(
      [ordered]@{
        loginId = 'shaktix'
        passwordHash = (New-PasswordHash 'donor123')
        role = 'donor'
        name = 'ShaktiX'
        initials = 'SX'
        orgName = 'ShaktiX Community Kitchen'
        phone = '+91 98100 42110'
        address = '428 Linden Street, Indiranagar'
        defaultWindow = '5:30 PM - 7:30 PM'
        autoMatchRadiusKm = 6
        coldChainVerified = $true
        allergenTagging = $true
        urgentAlerts = $true
        emailDigest = $true
      },
      [ordered]@{
        loginId = 'saffron'
        passwordHash = (New-PasswordHash 'ngo123')
        role = 'ngo'
        name = 'Saffron Table Shelter'
        initials = 'ST'
        orgName = 'Saffron Table Shelter'
        phone = '+91 98100 55220'
        address = '18 Parkview Lane, Koramangala'
        defaultWindow = '5:00 PM - 8:30 PM'
        autoMatchRadiusKm = 8
        coldChainVerified = $true
        allergenTagging = $true
        urgentAlerts = $true
        emailDigest = $true
      },
      [ordered]@{
        loginId = 'maya'
        passwordHash = (New-PasswordHash 'volunteer123')
        role = 'volunteer'
        name = 'Maya Lin'
        initials = 'ML'
        orgName = 'REPLATE Volunteer Courier'
        phone = '+91 98100 77330'
        address = 'Central Pickup Hub'
        defaultWindow = '4:00 PM - 9:00 PM'
        autoMatchRadiusKm = 12
        coldChainVerified = $true
        allergenTagging = $true
        urgentAlerts = $true
        emailDigest = $false
      },
      [ordered]@{
        loginId = 'admin'
        passwordHash = (New-PasswordHash 'admin123')
        role = 'admin'
        name = 'REPLATE Admin'
        initials = 'RA'
        orgName = 'REPLATE Operations'
        phone = '+91 98100 00001'
        address = 'REPLATE HQ'
        defaultWindow = 'All Day'
        autoMatchRadiusKm = 25
        coldChainVerified = $true
        allergenTagging = $true
        urgentAlerts = $true
        emailDigest = $true
      }
    )

    donations = @(
      [ordered]@{
        id = 'DON-1042'
        title = 'Kadhi Chawal'
        category = 'Home-Style Meals'
        quantity = '14 kg'
        quantityKg = 14
        servings = 45
        imageUrl = '/images/kadhi-chawal.jpg'
        preparedAt = $prepToday
        bestBefore = $bestEvening
        pickupAddress = '428 Linden Street, Indiranagar'
        window = 'Today, 5:30 PM - 7:00 PM'
        status = 'Matched'
        matchedNgo = 'Willowbrook Community Kitchen'
        donorLoginId = 'shaktix'
        donorName = 'ShaktiX'
        safetyStatus = 'Approved'
        safetyReason = 'Freshly cooked and packed cleanly.'
        notes = 'Warm yogurt kadhi with pakoras and steamed basmati rice in sealed steel containers.'
      },
      [ordered]@{
        id = 'DON-1043'
        title = 'Rajma Chawal'
        category = 'Home-Style Meals'
        quantity = '18 kg'
        quantityKg = 18
        servings = 55
        imageUrl = '/images/rajma-chawal.svg'
        preparedAt = $prepToday
        bestBefore = $bestSoon
        pickupAddress = '428 Linden Street, Indiranagar'
        window = 'Today, 4:30 PM - 6:00 PM'
        status = 'Available'
        matchedNgo = $null
        donorLoginId = 'shaktix'
        donorName = 'ShaktiX'
        safetyStatus = 'Approved'
        safetyReason = 'Passed food safety check.'
        notes = 'Slow-cooked Punjabi rajma with jeera rice, packed hot for evening dinner service.'
      },
      [ordered]@{
        id = 'DON-1044'
        title = 'Chole Bhature'
        category = 'Home-Style Meals'
        quantity = '35 plates'
        quantityKg = 12
        servings = 35
        imageUrl = '/images/chole-bhature.svg'
        preparedAt = $prepMorning
        bestBefore = $bestEvening
        pickupAddress = '428 Linden Street, Indiranagar'
        window = 'Today, 6:00 PM - 7:30 PM'
        status = 'Available'
        matchedNgo = $null
        donorLoginId = 'shaktix'
        donorName = 'ShaktiX'
        safetyStatus = 'Approved'
        safetyReason = 'Passed food safety check.'
        notes = 'Spiced chickpea curry with fresh bhature packed in clean food-grade boxes.'
      },
      [ordered]@{
        id = 'DON-1045'
        title = 'Veg Biryani'
        category = 'Home-Style Meals'
        quantity = '20 kg'
        quantityKg = 20
        servings = 60
        imageUrl = '/images/veg-biryani.jpg'
        preparedAt = $prepToday
        bestBefore = $bestNight
        pickupAddress = '428 Linden Street, Indiranagar'
        window = 'Today, 6:30 PM - 8:30 PM'
        status = 'Matched'
        matchedNgo = 'Saffron Table Shelter'
        donorLoginId = 'shaktix'
        donorName = 'ShaktiX'
        safetyStatus = 'Approved'
        safetyReason = 'Passed food safety check.'
        notes = 'Aromatic vegetable biryani with mint raita cups, ready for family meal distribution.'
      },
      [ordered]@{
        id = 'DON-1046'
        title = 'Samosa'
        category = 'Snacks & Street Food'
        quantity = '60 pieces'
        quantityKg = 8
        servings = 30
        imageUrl = '/images/samosa.svg'
        preparedAt = $prepMorning
        bestBefore = $bestSoon
        pickupAddress = '428 Linden Street, Indiranagar'
        window = 'Today, 4:00 PM - 5:30 PM'
        status = 'Available'
        matchedNgo = $null
        donorLoginId = 'shaktix'
        donorName = 'ShaktiX'
        safetyStatus = 'Approved'
        safetyReason = 'Passed food safety check.'
        notes = 'Crispy potato samosas with mint and tamarind chutneys.'
      },
      [ordered]@{
        id = 'DON-1047'
        title = 'Poha'
        category = 'Breakfast'
        quantity = '10 kg'
        quantityKg = 10
        servings = 32
        imageUrl = '/images/poha.svg'
        preparedAt = $prepMorning
        bestBefore = $bestEvening
        pickupAddress = '428 Linden Street, Indiranagar'
        window = 'Today, 5:00 PM - 6:30 PM'
        status = 'Completed'
        matchedNgo = 'Meadowlark Youth Pantry'
        donorLoginId = 'shaktix'
        donorName = 'ShaktiX'
        safetyStatus = 'Approved'
        safetyReason = 'Passed food safety check.'
        notes = 'Light flattened rice poha with peanuts, curry leaves, and fresh lemon.'
      },
      [ordered]@{
        id = 'DON-1048'
        title = 'Idli'
        category = 'Breakfast'
        quantity = '80 pieces'
        quantityKg = 9
        servings = 28
        imageUrl = '/images/idli.jpg'
        preparedAt = $prepMorning
        bestBefore = $bestEvening
        pickupAddress = '428 Linden Street, Indiranagar'
        window = 'Today, 5:00 PM - 7:00 PM'
        status = 'Available'
        matchedNgo = $null
        donorLoginId = 'shaktix'
        donorName = 'ShaktiX'
        safetyStatus = 'Approved'
        safetyReason = 'Passed food safety check.'
        notes = 'Soft steamed idlis packed with warm sambar and coconut chutney.'
      },
      [ordered]@{
        id = 'DON-1049'
        title = 'Dal Rice'
        category = 'Home-Style Meals'
        quantity = '16 kg'
        quantityKg = 16
        servings = 50
        imageUrl = '/images/dal-rice.jpg'
        preparedAt = $prepToday
        bestBefore = $bestNight
        pickupAddress = '428 Linden Street, Indiranagar'
        window = 'Today, 6:00 PM - 8:00 PM'
        status = 'Available'
        matchedNgo = $null
        donorLoginId = 'shaktix'
        donorName = 'ShaktiX'
        safetyStatus = 'Approved'
        safetyReason = 'Passed food safety check.'
        notes = 'Comforting yellow dal tadka and steamed rice in insulated containers.'
      },
      [ordered]@{
        id = 'DON-1050'
        title = 'Gulab Jamun'
        category = 'Sweets & Desserts'
        quantity = '50 pieces'
        quantityKg = 5
        servings = 25
        imageUrl = '/images/gulab-jamun.jpg'
        preparedAt = $prepMorning
        bestBefore = $bestNight
        pickupAddress = '428 Linden Street, Indiranagar'
        window = 'Today, 5:30 PM - 8:00 PM'
        status = 'Available'
        matchedNgo = $null
        donorLoginId = 'shaktix'
        donorName = 'ShaktiX'
        safetyStatus = 'Approved'
        safetyReason = 'Passed food safety check.'
        notes = 'Warm gulab jamun in light cardamom syrup, sealed in leak-proof tubs.'
      },
      [ordered]@{
        id = 'DON-1051'
        title = 'Jalebi'
        category = 'Sweets & Desserts'
        quantity = '4 kg'
        quantityKg = 4
        servings = 24
        imageUrl = '/images/jalebi.svg'
        preparedAt = $prepMorning
        bestBefore = $bestEvening
        pickupAddress = '428 Linden Street, Indiranagar'
        window = 'Today, 5:00 PM - 7:00 PM'
        status = 'Available'
        matchedNgo = $null
        donorLoginId = 'shaktix'
        donorName = 'ShaktiX'
        safetyStatus = 'Approved'
        safetyReason = 'Passed food safety check.'
        notes = 'Fresh saffron jalebis packed neatly in food-safe trays.'
      }
    )

    matches = @(
      [ordered]@{
        id = 'MCH-301'
        donationId = 'DON-1043'
        donationTitle = 'Rajma Chawal'
        quantityLabel = '18 kg'
        servings = 55
        ngoName = 'Saffron Table Shelter'
        ngoLoginId = 'saffron'
        distanceKm = 1.4
        compatibility = 98
        pickupTime = 'Today, 5:15 PM'
        status = 'Pending'
      },
      [ordered]@{
        id = 'MCH-302'
        donationId = 'DON-1044'
        donationTitle = 'Chole Bhature'
        quantityLabel = '35 plates'
        servings = 35
        ngoName = 'Willowbrook Community Kitchen'
        ngoLoginId = 'willowbrook'
        distanceKm = 2.1
        compatibility = 95
        pickupTime = 'Today, 6:15 PM'
        status = 'Pending'
      },
      [ordered]@{
        id = 'MCH-303'
        donationId = 'DON-1046'
        donationTitle = 'Samosa'
        quantityLabel = '60 pieces'
        servings = 30
        ngoName = 'Bloom & Bread Mutual Aid'
        ngoLoginId = 'bloom'
        distanceKm = 0.9
        compatibility = 92
        pickupTime = 'Today, 4:30 PM'
        status = 'Pending'
      },
      [ordered]@{
        id = 'MCH-304'
        donationId = 'DON-1042'
        donationTitle = 'Kadhi Chawal'
        quantityLabel = '14 kg'
        servings = 45
        ngoName = 'Willowbrook Community Kitchen'
        ngoLoginId = 'willowbrook'
        distanceKm = 2.1
        compatibility = 97
        pickupTime = 'Today, 5:40 PM'
        status = 'Accepted'
      }
    )

    pickups = @(
      [ordered]@{
        id = 'PKP-811'
        donationId = 'DON-1042'
        donationTitle = 'Kadhi Chawal'
        ngoName = 'Willowbrook Community Kitchen'
        volunteerName = 'Maya Lin'
        volunteerLoginId = 'maya'
        status = 'On the Way'
        handoffCode = 'RPL-482'
        window = '5:30 PM - 7:00 PM'
        pickupAddress = '428 Linden Street, Indiranagar'
      },
      [ordered]@{
        id = 'PKP-812'
        donationId = 'DON-1045'
        donationTitle = 'Veg Biryani'
        ngoName = 'Saffron Table Shelter'
        volunteerName = 'Noah Sterling'
        volunteerLoginId = 'noah'
        status = 'Scheduled'
        handoffCode = 'RPL-195'
        window = '6:30 PM - 8:30 PM'
        pickupAddress = '428 Linden Street, Indiranagar'
      },
      [ordered]@{
        id = 'PKP-813'
        donationId = 'DON-1047'
        donationTitle = 'Poha'
        ngoName = 'Meadowlark Youth Pantry'
        volunteerName = 'Maya Lin'
        volunteerLoginId = 'maya'
        status = 'Completed'
        handoffCode = 'RPL-609'
        window = 'Completed at 1:15 PM'
        pickupAddress = '428 Linden Street, Indiranagar'
      },
      [ordered]@{
        id = 'PKP-814'
        donationId = 'DON-1039'
        donationTitle = 'Dal Rice'
        ngoName = 'St. Jude Harvest Collective'
        volunteerName = 'Aria Kapoor'
        volunteerLoginId = 'aria'
        status = 'Cancelled'
        handoffCode = 'RPL-310'
        window = 'Cancelled · Reassigned'
        pickupAddress = '428 Linden Street, Indiranagar'
      }
    )

    notifications = @(
      [ordered]@{
        id = 'NTF-1'
        category = 'Matches'
        title = 'Best NGO match found for Rajma Chawal'
        body = 'Saffron Table Shelter is 1.4 km away and ready to pick up 55 meals.'
        time = '6 mins ago'
        unread = $true
        actionLabel = 'See Matches'
        actionView = 'matches'
      },
      [ordered]@{
        id = 'NTF-2'
        category = 'Pickups'
        title = 'Maya Lin is on the way for Kadhi Chawal'
        body = 'Pickup code is RPL-482 at 428 Linden Street.'
        time = '22 mins ago'
        unread = $true
        actionLabel = 'Track Pickup'
        actionView = 'pickups'
      },
      [ordered]@{
        id = 'NTF-3'
        category = 'Safety'
        title = 'Food safety check passed for Chole Bhature'
        body = 'Preparation and best-before times look safe for evening pickup.'
        time = '45 mins ago'
        unread = $true
        actionLabel = 'View Food'
        actionView = 'donations'
      },
      [ordered]@{
        id = 'NTF-4'
        category = 'Pickups'
        title = 'Poha delivered to Meadowlark Youth Pantry'
        body = '32 meals were shared safely today.'
        time = '3 hours ago'
        unread = $false
        actionLabel = 'See Impact'
        actionView = 'impact'
      }
    )

    safetyLogs = @()

    impactData = [ordered]@{
      week = [ordered]@{
        meals = 468
        kg = 184
        co2 = 460
        ngos = 9
        series = @(
          [ordered]@{ label = 'Mon'; meals = 52 },
          [ordered]@{ label = 'Tue'; meals = 64 },
          [ordered]@{ label = 'Wed'; meals = 48 },
          [ordered]@{ label = 'Thu'; meals = 78 },
          [ordered]@{ label = 'Fri'; meals = 94 },
          [ordered]@{ label = 'Sat'; meals = 82 },
          [ordered]@{ label = 'Sun'; meals = 50 }
        )
      }
      month = [ordered]@{
        meals = 1842
        kg = 736
        co2 = 412
        ngos = 16
        series = @(
          [ordered]@{ label = 'Wk 1'; meals = 390 },
          [ordered]@{ label = 'Wk 2'; meals = 445 },
          [ordered]@{ label = 'Wk 3'; meals = 482 },
          [ordered]@{ label = 'Wk 4'; meals = 525 }
        )
      }
      year = [ordered]@{
        meals = 14280
        kg = 3240
        co2 = 7840
        ngos = 28
        series = @(
          [ordered]@{ label = 'Jun'; meals = 980 },
          [ordered]@{ label = 'Jul'; meals = 1120 },
          [ordered]@{ label = 'Aug'; meals = 1310 },
          [ordered]@{ label = 'Sep'; meals = 1480 },
          [ordered]@{ label = 'Oct'; meals = 1558 },
          [ordered]@{ label = 'Nov'; meals = 1842 }
        )
      }
    }
  }

  $seed | ConvertTo-Json -Depth 12 | Set-Content -Path $DbPath -Encoding UTF8
}

function Read-Db {
  Initialize-Database
  $raw = Get-Content -Path $DbPath -Raw -Encoding UTF8
  return ($raw | ConvertFrom-Json)
}

function Write-Db {
  param($Db)
  $Db | ConvertTo-Json -Depth 12 | Set-Content -Path $DbPath -Encoding UTF8
}

function ConvertTo-PublicUser {
  param($User)
  return [ordered]@{
    loginId = $User.loginId
    role = $User.role
    name = $User.name
    initials = $User.initials
    orgName = $User.orgName
    phone = $User.phone
    address = $User.address
    defaultWindow = $User.defaultWindow
    autoMatchRadiusKm = $User.autoMatchRadiusKm
    coldChainVerified = [bool]$User.coldChainVerified
    allergenTagging = [bool]$User.allergenTagging
    urgentAlerts = [bool]$User.urgentAlerts
    emailDigest = [bool]$User.emailDigest
  }
}

# ==============================================================================
# HTTP Helpers
# ==============================================================================
function Send-Json {
  param($Response, [int]$StatusCode, $Obj)
  $Response.StatusCode = $StatusCode
  $Response.ContentType = 'application/json; charset=utf-8'
  $json = $Obj | ConvertTo-Json -Depth 12
  $bytes = [Text.Encoding]::UTF8.GetBytes($json)
  $Response.ContentLength64 = $bytes.Length
  $Response.OutputStream.Write($bytes, 0, $bytes.Length)
  $Response.OutputStream.Close()
}

function Read-RequestBodyJson {
  param($Request)
  $reader = New-Object System.IO.StreamReader($Request.InputStream, [Text.Encoding]::UTF8)
  $body = $reader.ReadToEnd()
  $reader.Close()
  if ([string]::IsNullOrWhiteSpace($body)) { return $null }
  return ($body | ConvertFrom-Json)
}

function Get-MimeType {
  param([string]$FilePath)
  $ext = [IO.Path]::GetExtension($FilePath).ToLower()
  switch ($ext) {
    '.html' { return 'text/html; charset=utf-8' }
    '.css'  { return 'text/css; charset=utf-8' }
    '.js'   { return 'application/javascript; charset=utf-8' }
    '.json' { return 'application/json; charset=utf-8' }
    '.png'  { return 'image/png' }
    '.jpg'  { return 'image/jpeg' }
    '.jpeg' { return 'image/jpeg' }
    '.webp' { return 'image/webp' }
    '.svg'  { return 'image/svg+xml' }
    default { return 'application/octet-stream' }
  }
}

function Get-RequestUser {
  param($Request, $Db)
  $authHeader = $Request.Headers['Authorization']
  if (-not $authHeader -or -not $authHeader.StartsWith('Bearer ')) { return $null }
  $token = $authHeader.Substring(7).Trim()
  $payload = Read-AuthToken $token
  if (-not $payload) { return $null }
  $user = $Db.users | Where-Object { $_.loginId -eq $payload.loginId } | Select-Object -First 1
  return $user
}

# ==============================================================================
# Start Listener
# ==============================================================================
Initialize-Database
$Listener = New-Object System.Net.HttpListener
$Prefix = "http://${HostName}:$Port/"
$Listener.Prefixes.Add($Prefix)
$Listener.Start()
Write-Host "REPLATE server running at $Prefix"

try {
  while ($Listener.IsListening) {
    $ctx = $Listener.GetContext()
    $req = $ctx.Request
    $res = $ctx.Response

    try {
      $res.Headers.Add('Access-Control-Allow-Origin', '*')
      $res.Headers.Add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
      $res.Headers.Add('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')

      if ($req.HttpMethod -eq 'OPTIONS') {
        $res.StatusCode = 204
        $res.OutputStream.Close()
        continue
      }

      $path = $req.Url.AbsolutePath

      # ------------------------------------------------------------------------
      # API ROUTES
      # ------------------------------------------------------------------------
      if ($path -eq '/api/health' -and $req.HttpMethod -eq 'GET') {
        Send-Json $res 200 @{ ok = $true; service = 'replate-backend' }
        continue
      }

      if ($path -eq '/api/auth/login' -and $req.HttpMethod -eq 'POST') {
        $body = Read-RequestBodyJson $req
        if (-not $body) {
          Send-Json $res 400 @{ ok = $false; error = 'Missing login credentials.' }
          continue
        }
        $db = Read-Db
        $loginId = if ($body.loginId) { $body.loginId.Trim().ToLower() } else { '' }
        $password = if ($body.password) { [string]$body.password } else { '' }

        $user = $db.users | Where-Object { $_.loginId.ToLower() -eq $loginId } | Select-Object -First 1
        if (-not $user -or -not (Test-PasswordHash $password $user.passwordHash)) {
          Send-Json $res 401 @{ ok = $false; error = 'Wrong Login ID or password.' }
          continue
        }

        $token = New-AuthToken $user.loginId $user.role
        Send-Json $res 200 @{ ok = $true; token = $token; user = (ConvertTo-PublicUser $user) }
        continue
      }

      if ($path -eq '/api/auth/register' -and $req.HttpMethod -eq 'POST') {
        $body = Read-RequestBodyJson $req
        if (-not $body) {
          Send-Json $res 400 @{ ok = $false; error = 'Missing registration details.' }
          continue
        }
        $db = Read-Db
        $loginId = if ($body.loginId) { $body.loginId.Trim().ToLower() } else { '' }
        $password = if ($body.password) { [string]$body.password } else { '' }
        $name = if ($body.name) { $body.name.Trim() } else { '' }
        $orgName = if ($body.orgName) { $body.orgName.Trim() } else { $name }
        $role = if ($body.role) { $body.role.Trim().ToLower() } else { 'donor' }

        if ($role -eq 'admin') {
          Send-Json $res 403 @{ ok = $false; error = 'You cannot register as Admin.' }
          continue
        }
        if ($role -notin @('donor', 'ngo', 'volunteer')) {
          Send-Json $res 400 @{ ok = $false; error = 'Please choose Donor, NGO, or Volunteer.' }
          continue
        }
        if ($loginId.Length -lt 3 -or $loginId -notmatch '^[a-z0-9._-]+$') {
          Send-Json $res 400 @{ ok = $false; error = 'Login ID must be at least 3 letters or numbers.' }
          continue
        }
        if ($password.Length -lt 6) {
          Send-Json $res 400 @{ ok = $false; error = 'Password must be at least 6 characters long.' }
          continue
        }
        if ([string]::IsNullOrWhiteSpace($name)) {
          Send-Json $res 400 @{ ok = $false; error = 'Please enter your name.' }
          continue
        }

        $exists = $db.users | Where-Object { $_.loginId.ToLower() -eq $loginId } | Select-Object -First 1
        if ($exists) {
          Send-Json $res 409 @{ ok = $false; error = 'That Login ID is already taken. Try another one.' }
          continue
        }

        $parts = @($name -split '\s+' | Where-Object { $_ })
        $initials = if ($parts.Length -ge 2) { "$($parts[0][0])$($parts[1][0])".ToUpper() } else { $name.Substring(0, [Math]::Min(2, $name.Length)).ToUpper() }

        $newUser = [ordered]@{
          loginId = $loginId
          passwordHash = (New-PasswordHash $password)
          role = $role
          name = $name
          initials = $initials
          orgName = $orgName
          phone = if ($body.phone) { [string]$body.phone } else { '' }
          address = if ($body.address) { [string]$body.address } else { '428 Linden Street, Indiranagar' }
          defaultWindow = '5:30 PM - 7:30 PM'
          autoMatchRadiusKm = 6
          coldChainVerified = $true
          allergenTagging = $true
          urgentAlerts = $true
          emailDigest = $true
        }

        $usersList = New-Object System.Collections.ArrayList
        foreach ($u in $db.users) { [void]$usersList.Add($u) }
        [void]$usersList.Add($newUser)
        $db.users = $usersList
        Write-Db $db

        $token = New-AuthToken $newUser.loginId $newUser.role
        Send-Json $res 201 @{ ok = $true; token = $token; user = (ConvertTo-PublicUser $newUser) }
        continue
      }

      if ($path -eq '/api/auth/me' -and $req.HttpMethod -eq 'GET') {
        $db = Read-Db
        $user = Get-RequestUser $req $db
        if (-not $user) {
          Send-Json $res 401 @{ ok = $false; error = 'Please log in first.' }
          continue
        }
        Send-Json $res 200 @{ ok = $true; user = (ConvertTo-PublicUser $user) }
        continue
      }

      if ($path -eq '/api/auth/logout' -and $req.HttpMethod -eq 'POST') {
        Send-Json $res 200 @{ ok = $true }
        continue
      }

      # Public landing preview data (safe summary only)
      if ($path -eq '/api/public/summary' -and $req.HttpMethod -eq 'GET') {
        $db = Read-Db
        $featured = @($db.donations | Where-Object { $_.safetyStatus -eq 'Approved' } | Select-Object -First 3)
        Send-Json $res 200 @{
          ok = $true
          featuredDonations = $featured
          impactData = $db.impactData
        }
        continue
      }

      # Full Workspace State (requires valid auth token)
      if ($path -eq '/api/state' -and $req.HttpMethod -eq 'GET') {
        $db = Read-Db
        $user = Get-RequestUser $req $db
        if (-not $user) {
          Send-Json $res 401 @{ ok = $false; error = 'Unauthorized. Please log in.' }
          continue
        }

        $publicUsers = @()
        if ($user.role -eq 'admin') {
          $publicUsers = @($db.users | ForEach-Object { ConvertTo-PublicUser $_ })
        }

        Send-Json $res 200 @{
          ok = $true
          user = (ConvertTo-PublicUser $user)
          donations = @($db.donations)
          matches = @($db.matches)
          pickups = @($db.pickups)
          notifications = @($db.notifications)
          impactData = $db.impactData
          safetyLogs = if ($user.role -eq 'admin') { @($db.safetyLogs) } else { @($db.safetyLogs | Where-Object { $_.donorLoginId -eq $user.loginId }) }
          users = @($publicUsers)
        }
        continue
      }

      # Create Donation (Donor or Admin only)
      if ($path -eq '/api/donations' -and $req.HttpMethod -eq 'POST') {
        $db = Read-Db
        $user = Get-RequestUser $req $db
        if (-not $user) { Send-Json $res 401 @{ ok = $false; error = 'Please log in first.' }; continue }
        if ($user.role -notin @('donor', 'admin')) {
          Send-Json $res 403 @{ ok = $false; error = 'Only Donors or Admins can submit food donations.' }
          continue
        }

        $body = Read-RequestBodyJson $req
        $title = if ($body.title) { $body.title.Trim() } else { '' }
        $category = if ($body.category) { $body.category.Trim() } else { 'Home-Style Meals' }
        $quantity = if ($body.quantity) { $body.quantity.Trim() } else { '5 kg' }
        $servings = if ($body.servings) { [int]$body.servings } else { 15 }
        $preparedAt = [string]$body.preparedAt
        $bestBefore = [string]$body.bestBefore
        $pickupAddress = if ($body.pickupAddress) { $body.pickupAddress.Trim() } else { $user.address }
        $notes = if ($body.notes) { $body.notes.Trim() } else { '' }

        $safety = Test-FoodSafety -FoodName $title -PreparedAtStr $preparedAt -BestBeforeStr $bestBefore -Details $notes

        if (-not $safety.safe) {
          $logs = New-Object System.Collections.ArrayList
          foreach ($l in $db.safetyLogs) { [void]$logs.Add($l) }
          [void]$logs.Insert(0, [ordered]@{
            id = "SAF-$(Get-Random -Minimum 100 -Maximum 999)"
            title = $title
            donorLoginId = $user.loginId
            donorName = $user.name
            preparedAt = $preparedAt
            bestBefore = $bestBefore
            reason = $safety.reason
            checkedAt = [DateTimeOffset]::Now.ToString('g')
          })
          $db.safetyLogs = $logs
          Write-Db $db

          Send-Json $res 422 @{
            ok = $false
            rejected = $true
            error = $safety.reason
          }
          continue
        }

        $newId = "DON-$(Get-Random -Minimum 2000 -Maximum 9999)"
        $imageUrl = Get-MatchingDishImage -FoodName $title -Category $category

        # Handle optional base64 photo upload
        if ($body.photoDataUrl -and $body.photoDataUrl -match '^data:image/(png|jpeg|jpg|webp);base64,(.+)$') {
          $ext = if ($Matches[1] -eq 'jpeg') { 'jpg' } else { $Matches[1] }
          $b64 = $Matches[2]
          $imgBytes = [Convert]::FromBase64String($b64)
          if ($imgBytes.Length -le 5242880) {
            $fileName = "$newId.$ext"
            [IO.File]::WriteAllBytes((Join-Path $UploadsDir $fileName), $imgBytes)
            $imageUrl = "/uploads/$fileName"
          }
        }

        $qtyKgMatch = [regex]::Match($quantity, '(\d+(\.\d+)?)')
        $qtyKg = if ($qtyKgMatch.Success) { [double]$qtyKgMatch.Groups[1].Value } else { [Math]::Round($servings * 0.35, 1) }

        $bestDtParsed = [DateTimeOffset]::Parse($bestBefore)
        $windowText = "Before $($bestDtParsed.ToString('MMM d, h:mm tt'))"

        $newDonation = [ordered]@{
          id = $newId
          title = $title
          category = $category
          quantity = $quantity
          quantityKg = $qtyKg
          servings = $servings
          imageUrl = $imageUrl
          preparedAt = $preparedAt
          bestBefore = $bestBefore
          pickupAddress = $pickupAddress
          window = $windowText
          status = 'Available'
          matchedNgo = $null
          donorLoginId = $user.loginId
          donorName = $user.name
          safetyStatus = 'Approved'
          safetyReason = $safety.reason
          notes = if ($notes) { $notes } else { 'Fresh food ready for pickup.' }
        }

        $donList = New-Object System.Collections.ArrayList
        foreach ($d in $db.donations) { [void]$donList.Add($d) }
        [void]$donList.Insert(0, $newDonation)
        $db.donations = $donList

        # Auto-create a smart NGO match for this safe food
        $ngoCandidates = @(
          @{ name = 'Saffron Table Shelter'; loginId = 'saffron'; dist = 1.4 },
          @{ name = 'Willowbrook Community Kitchen'; loginId = 'willowbrook'; dist = 2.1 },
          @{ name = 'Bloom & Bread Mutual Aid'; loginId = 'bloom'; dist = 0.9 }
        )
        $pickNgo = $ngoCandidates[(Get-Random -Minimum 0 -Maximum $ngoCandidates.Count)]
        $score = Get-Random -Minimum 91 -Maximum 99
        $newMatch = [ordered]@{
          id = "MCH-$(Get-Random -Minimum 400 -Maximum 999)"
          donationId = $newId
          donationTitle = $title
          quantityLabel = $quantity
          servings = $servings
          ngoName = $pickNgo.name
          ngoLoginId = $pickNgo.loginId
          distanceKm = $pickNgo.dist
          compatibility = $score
          pickupTime = $windowText
          status = 'Pending'
        }

        $mList = New-Object System.Collections.ArrayList
        foreach ($m in $db.matches) { [void]$mList.Add($m) }
        [void]$mList.Insert(0, $newMatch)
        $db.matches = $mList

        $nList = New-Object System.Collections.ArrayList
        foreach ($n in $db.notifications) { [void]$nList.Add($n) }
        [void]$nList.Insert(0, [ordered]@{
          id = "NTF-$([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds())"
          category = 'Matches'
          title = "New $score% NGO match for $title"
          body = "$($pickNgo.name) is $($pickNgo.dist) km away and can serve $servings people."
          time = 'Just now'
          unread = $true
          actionLabel = 'See Matches'
          actionView = 'matches'
        })
        $db.notifications = $nList

        Write-Db $db
        Send-Json $res 201 @{ ok = $true; donation = $newDonation; match = $newMatch }
        continue
      }

      # Delete Donation
      if ($path -match '^/api/donations/([^/]+)$' -and $req.HttpMethod -eq 'DELETE') {
        $donId = $Matches[1]
        $db = Read-Db
        $user = Get-RequestUser $req $db
        if (-not $user) { Send-Json $res 401 @{ ok = $false; error = 'Please log in first.' }; continue }

        $target = $db.donations | Where-Object { $_.id -eq $donId } | Select-Object -First 1
        if (-not $target) { Send-Json $res 404 @{ ok = $false; error = 'Donation not found.' }; continue }
        if ($user.role -ne 'admin' -and $target.donorLoginId -ne $user.loginId) {
          Send-Json $res 403 @{ ok = $false; error = 'You can only remove your own donations.' }
          continue
        }

        $db.donations = @($db.donations | Where-Object { $_.id -ne $donId })
        $db.matches = @($db.matches | Where-Object { $_.donationId -ne $donId })
        Write-Db $db
        Send-Json $res 200 @{ ok = $true }
        continue
      }

      # Accept / Decline NGO Match
      if ($path -match '^/api/matches/([^/]+)/(accept|decline)$' -and $req.HttpMethod -eq 'POST') {
        $matchId = $Matches[1]
        $action = $Matches[2]
        $db = Read-Db
        $user = Get-RequestUser $req $db
        if (-not $user) { Send-Json $res 401 @{ ok = $false; error = 'Please log in first.' }; continue }
        if ($user.role -notin @('donor', 'ngo', 'admin')) {
          Send-Json $res 403 @{ ok = $false; error = 'Only Donors, NGOs, or Admins can update matches.' }
          continue
        }

        $match = $db.matches | Where-Object { $_.id -eq $matchId } | Select-Object -First 1
        if (-not $match) { Send-Json $res 404 @{ ok = $false; error = 'Match not found.' }; continue }

        $don = $db.donations | Where-Object { $_.id -eq $match.donationId } | Select-Object -First 1

        if ($action -eq 'accept') {
          # Re-run food safety expiry check before matching!
          if ($don) {
            $recheck = Test-FoodSafety -FoodName $don.title -PreparedAtStr $don.preparedAt -BestBeforeStr $don.bestBefore -Details $don.notes
            if (-not $recheck.safe) {
              $don.safetyStatus = 'Rejected'
              $don.safetyReason = $recheck.reason
              $don.status = 'Expired'
              $match.status = 'Declined'
              Write-Db $db
              Send-Json $res 422 @{ ok = $false; error = "Cannot match expired or unsafe food: $($recheck.reason)" }
              continue
            }
            $don.status = 'Matched'
            $don.matchedNgo = $match.ngoName
          }

          $match.status = 'Accepted'
          $code = "RPL-$(Get-Random -Minimum 200 -Maximum 999)"
          $newPickup = [ordered]@{
            id = "PKP-$(Get-Random -Minimum 820 -Maximum 999)"
            donationId = $match.donationId
            donationTitle = $match.donationTitle
            ngoName = $match.ngoName
            volunteerName = 'Maya Lin'
            volunteerLoginId = 'maya'
            status = 'Scheduled'
            handoffCode = $code
            window = $match.pickupTime
            pickupAddress = if ($don) { $don.pickupAddress } else { '428 Linden Street, Indiranagar' }
          }

          $pkList = New-Object System.Collections.ArrayList
          foreach ($p in $db.pickups) { [void]$pkList.Add($p) }
          [void]$pkList.Insert(0, $newPickup)
          $db.pickups = $pkList

          $nList = New-Object System.Collections.ArrayList
          foreach ($n in $db.notifications) { [void]$nList.Add($n) }
          [void]$nList.Insert(0, [ordered]@{
            id = "NTF-$([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds())"
            category = 'Pickups'
            title = "Match accepted with $($match.ngoName)"
            body = "Pickup scheduled for $($match.donationTitle). Pickup code: $code."
            time = 'Just now'
            unread = $true
            actionLabel = 'Track Pickup'
            actionView = 'pickups'
          })
          $db.notifications = $nList
        } else {
          $match.status = 'Declined'
        }

        Write-Db $db
        Send-Json $res 200 @{ ok = $true; match = $match }
        continue
      }

      # Update Pickup Status (Scheduled | On the Way | Completed | Cancelled)
      if ($path -match '^/api/pickups/([^/]+)/status$' -and $req.HttpMethod -eq 'POST') {
        $pkId = $Matches[1]
        $db = Read-Db
        $user = Get-RequestUser $req $db
        if (-not $user) { Send-Json $res 401 @{ ok = $false; error = 'Please log in first.' }; continue }

        $body = Read-RequestBodyJson $req
        $newStatus = [string]$body.status
        if ($newStatus -notin @('Scheduled', 'On the Way', 'Completed', 'Cancelled')) {
          Send-Json $res 400 @{ ok = $false; error = 'Status must be Scheduled, On the Way, Completed, or Cancelled.' }
          continue
        }

        $pk = $db.pickups | Where-Object { $_.id -eq $pkId } | Select-Object -First 1
        if (-not $pk) { Send-Json $res 404 @{ ok = $false; error = 'Pickup not found.' }; continue }

        $pk.status = $newStatus
        if ($user.role -eq 'volunteer') {
          $pk.volunteerName = $user.name
          $pk.volunteerLoginId = $user.loginId
        }

        $don = $db.donations | Where-Object { $_.id -eq $pk.donationId -or $_.title -eq $pk.donationTitle } | Select-Object -First 1
        if ($don) {
          if ($newStatus -eq 'Completed') { $don.status = 'Completed' }
          elseif ($newStatus -eq 'Cancelled') { $don.status = 'Available'; $don.matchedNgo = $null }
        }

        Write-Db $db
        Send-Json $res 200 @{ ok = $true; pickup = $pk }
        continue
      }

      # Mark Notifications Read
      if ($path -eq '/api/notifications/read' -and $req.HttpMethod -eq 'POST') {
        $db = Read-Db
        $user = Get-RequestUser $req $db
        if (-not $user) { Send-Json $res 401 @{ ok = $false; error = 'Please log in first.' }; continue }
        $body = Read-RequestBodyJson $req
        $targetId = if ($body -and $body.id) { [string]$body.id } else { '' }
        foreach ($n in $db.notifications) {
          if (-not $targetId -or $n.id -eq $targetId) {
            $n.unread = $false
          }
        }
        Write-Db $db
        Send-Json $res 200 @{ ok = $true }
        continue
      }

      # Update User Profile / Settings
      if ($path -eq '/api/settings' -and $req.HttpMethod -eq 'POST') {
        $db = Read-Db
        $user = Get-RequestUser $req $db
        if (-not $user) { Send-Json $res 401 @{ ok = $false; error = 'Please log in first.' }; continue }
        $body = Read-RequestBodyJson $req

        if ($body.name) { $user.name = $body.name.Trim() }
        if ($body.orgName) { $user.orgName = $body.orgName.Trim() }
        if ($null -ne $body.phone) { $user.phone = [string]$body.phone }
        if ($null -ne $body.address) { $user.address = [string]$body.address }
        if ($body.defaultWindow) { $user.defaultWindow = [string]$body.defaultWindow }
        if ($null -ne $body.autoMatchRadiusKm) { $user.autoMatchRadiusKm = [int]$body.autoMatchRadiusKm }
        if ($null -ne $body.coldChainVerified) { $user.coldChainVerified = [bool]$body.coldChainVerified }
        if ($null -ne $body.allergenTagging) { $user.allergenTagging = [bool]$body.allergenTagging }
        if ($null -ne $body.urgentAlerts) { $user.urgentAlerts = [bool]$body.urgentAlerts }
        if ($null -ne $body.emailDigest) { $user.emailDigest = [bool]$body.emailDigest }

        $parts = @($user.name -split '\s+' | Where-Object { $_ })
        $user.initials = if ($parts.Length -ge 2) { "$($parts[0][0])$($parts[1][0])".ToUpper() } else { $user.name.Substring(0, [Math]::Min(2, $user.name.Length)).ToUpper() }

        Write-Db $db
        Send-Json $res 200 @{ ok = $true; user = (ConvertTo-PublicUser $user) }
        continue
      }

      # ------------------------------------------------------------------------
      # STATIC FILES
      # ------------------------------------------------------------------------
      $decodedPath = [System.Web.HttpUtility]::UrlDecode($path)
      $relPath = if ($decodedPath -eq '/' -or $decodedPath -eq '') { 'index.html' } else { $decodedPath.TrimStart('/').Replace('/', '\') }
      $fullPath = [IO.Path]::GetFullPath((Join-Path $RootDir $relPath))

      if (-not $fullPath.StartsWith($RootDir)) {
        $res.StatusCode = 403
        $res.OutputStream.Close()
        continue
      }

      # Prevent direct access to db.json, auth secret, server.ps1, or .git
      $relNorm = $relPath.Replace('\', '/').ToLower()
      if ($relNorm -in @('db.json', '.auth_secret', 'server.ps1') -or $relNorm.StartsWith('.git')) {
        $res.StatusCode = 403
        $res.OutputStream.Close()
        continue
      }

      if (Test-Path $fullPath -PathType Leaf) {
        $res.StatusCode = 200
        $res.ContentType = Get-MimeType $fullPath
        $bytes = [IO.File]::ReadAllBytes($fullPath)
        $res.ContentLength64 = $bytes.Length
        $res.OutputStream.Write($bytes, 0, $bytes.Length)
        $res.OutputStream.Close()
      } else {
        $res.StatusCode = 404
        $bytes = [Text.Encoding]::UTF8.GetBytes('Not Found')
        $res.OutputStream.Write($bytes, 0, $bytes.Length)
        $res.OutputStream.Close()
      }
    } catch {
      try {
        Send-Json $res 500 @{ ok = $false; error = $_.Exception.Message }
      } catch {}
    }
  }
} finally {
  $Listener.Stop()
  $Listener.Close()
}
