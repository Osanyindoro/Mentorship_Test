# Jobberman x Mastercard Foundation Mentorship Portal - PowerShell REST API Server
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:5000/v1/")
$listener.Prefixes.Add("http://localhost:5000/")

try {
    $listener.Start()
    Write-Host "[MCF Backend API] REST API Server listening on http://localhost:5000/v1/"
} catch {
    Write-Host "[MCF Backend API] Listener notice: $_"
}

# Initial Data State
$mentors = @(
    @{
        id = "MEN-101"
        name = "Dr. Samuel Osei"
        email = "samuel.osei@mcf-mentors.org"
        title = "Principal AI Scientist & Former Google Research Lead"
        organization = "DeepMind / CMU Africa Faculty"
        domain = "Software Engineering & AI"
        bio = "15+ years experience in Artificial Intelligence and NLP for African languages."
        avatar = "/assets/mentor_samuel.jpg"
        rating = 4.9
        totalSessions = 42
        expertise = @("AI / Machine Learning", "PhD Advice", "Tech Career Roadmap")
        schedule = @(
            @{ id = 1; date = "2026-08-18"; time = "10:00 AM"; isBooked = $false; bookedBy = $null },
            @{ id = 2; date = "2026-08-18"; time = "02:30 PM"; isBooked = $true; bookedBy = "Amina Kwame" }
        )
    },
    @{
        id = "MEN-102"
        name = "Nia Temilade"
        email = "nia.temilade@mcf-mentors.org"
        title = "VP of Product Management & Venture Partner"
        organization = "Paystack / Flutterwave Mentor Network"
        domain = "Fintech & Product"
        bio = "Product strategist who scaled payments infrastructure across 6 African countries."
        avatar = "/assets/mentor_nia.jpg"
        rating = 5.0
        totalSessions = 38
        expertise = @("Product Strategy", "Fintech Leadership", "Interview Prep")
        schedule = @(
            @{ id = 3; date = "2026-08-19"; time = "09:00 AM"; isBooked = $false; bookedBy = $null }
        )
    }
)

$sessions = @(
    @{
        id = "SES-8801"
        associateId = "MCF-2026-089"
        associateName = "Amina Kwame"
        mentorId = "MEN-101"
        mentorName = "Dr. Samuel Osei"
        mentorDomain = "Software Engineering & AI"
        date = "2026-08-18"
        time = "02:30 PM"
        duration = "1 Hour"
        objective = "Review PhD statement of purpose for AI programs."
        consentToRecord = $true
        status = "Accepted"
        meetingLink = "https://meet.zoho.com/mcf-mentorship-ses-8801"
    }
)

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        # CORS Headers
        $response.AddHeader("Access-Control-Allow-Origin", "*")
        $response.AddHeader("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS")
        $response.AddHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")

        if ($request.HttpMethod -eq "OPTIONS") {
            $response.StatusCode = 200
            $response.Close()
            continue
        }

        $urlPath = $request.Url.AbsolutePath
        $response.ContentType = "application/json"

        # Reading Request Body
        $bodyText = ""
        if ($request.HasEntityBody) {
            $reader = New-Object System.IO.StreamReader($request.InputStream, $request.ContentEncoding)
            $bodyText = $reader.ReadToEnd()
            $reader.Close()
        }

        if ($urlPath -eq "/v1" -or $urlPath -eq "/v1/" -or $urlPath -eq "/") {
            $apiIndex = @{
                service = "Jobberman x Mastercard Foundation Mentorship REST API"
                status = "online"
                endpoints = @(
                    @{ name = "Health Check"; path = "http://localhost:5000/v1/health"; method = "GET" },
                    @{ name = "Mentors Directory"; path = "http://localhost:5000/v1/mentors"; method = "GET" },
                    @{ name = "Sessions History"; path = "http://localhost:5000/v1/sessions"; method = "GET" },
                    @{ name = "User Login"; path = "http://localhost:5000/v1/auth/login"; method = "POST" },
                    @{ name = "Forgot Password"; path = "http://localhost:5000/v1/auth/forgot-password"; method = "POST" }
                )
            }
            $json = $apiIndex | ConvertTo-Json -Depth 5
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        }
        elseif ($urlPath -eq "/v1/health") {
            $resData = @{ status = "healthy"; timestamp = (Get-Date).ToString("o"); service = "Jobberman x MCF API Backend" }
            $json = $resData | ConvertTo-Json -Depth 5
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        }
        elseif ($urlPath -eq "/v1/auth/login" -and $request.HttpMethod -eq "POST") {
            $body = $bodyText | ConvertFrom-Json
            $email = $body.email
            
            $resUser = @{
                token = "mcf_token_" + [guid]::NewGuid().ToString()
                user = @{
                    id = "MCF-2026-089"
                    role = $body.role
                    name = "Amina Kwame"
                    email = $email
                    institution = "Ashesi University / Carnegie Mellon Africa"
                    organization = "Ashesi University / Carnegie Mellon Africa"
                    title = "Mastercard Foundation Scholar & Tech Fellow"
                    track = "Software Engineering & Data Science"
                    bio = "Passionate about building AI tools for healthcare in Africa."
                    avatar = "/assets/assoc_amina.jpg"
                }
            }
            $json = $resUser | ConvertTo-Json -Depth 5
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        }
        elseif ($urlPath -eq "/v1/auth/forgot-password" -and $request.HttpMethod -eq "POST") {
            $token = [guid]::NewGuid().ToString()
            $resetLink = "https://mentorship-jobberman.vercel.app/reset-password?token=" + $token
            Write-Host "[Auth API] Password reset link dispatched: $resetLink"
            
            $resMsg = @{ message = "If your email is registered, a password reset link has been sent."; resetLinkDemo = $resetLink }
            $json = $resMsg | ConvertTo-Json -Depth 5
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        }
        elseif ($urlPath -eq "/v1/mentors" -and $request.HttpMethod -eq "GET") {
            $json = $mentors | ConvertTo-Json -Depth 5
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        }
        elseif ($urlPath -eq "/v1/sessions" -and $request.HttpMethod -eq "GET") {
            $json = $sessions | ConvertTo-Json -Depth 5
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        }
        else {
            $response.StatusCode = 404
            $errObj = @{ error = "Endpoint not found" }
            $json = $errObj | ConvertTo-Json
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        }

        $response.Close()
    } catch {
        # ignore context errors during stop
    }
}
