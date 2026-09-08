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
        id = "MEN-2026-001"
        name = "Andre Garbutt"
        email = "andre.garbutt@mcf-mentors.org"
        title = "Founder & Lead Trainer | HR & Learning Consultant"
        organization = "Hands-On Excellence Academy / WAVE"
        domain = "Workforce Development, Talent Management & HR Strategy"
        bio = "HR Consultant, Learning & Development Professional, and Corporate Trainer with over a decade of experience."
        avatar = "/assets/mentors/andre_garbutt.jpg"
        rating = 4.95
        totalSessions = 24
        expertise = @("Workforce Development", "Talent Management", "Employability Training")
        schedule = @(
            @{ id = 1; date = "2026-08-20"; time = "10:00 AM"; isBooked = $false; bookedBy = $null },
            @{ id = 2; date = "2026-08-22"; time = "02:00 PM"; isBooked = $true; bookedBy = "Amina Kwame" }
        )
    },
    @{
        id = "MEN-2026-002"
        name = "Awele Elueze"
        email = "awele.elueze@mcf-mentors.org"
        title = "Group Head of Human Resources | CIPD (UK) Certified"
        organization = "Alerzo Limited (Ex-EY & Saroafrica International)"
        domain = "Strategic HR Transformation, Performance Management & Executive Leadership"
        bio = "Seasoned HR executive and CIPD-certified strategist currently serving as Group Head of HR at Alerzo Limited."
        avatar = "/assets/mentors/awele_elueze.jpg"
        rating = 5.0
        totalSessions = 32
        expertise = @("HR Transformation", "Performance Management", "Executive Coaching")
        schedule = @(
            @{ id = 3; date = "2026-08-21"; time = "11:00 AM"; isBooked = $false; bookedBy = $null }
        )
    }
)

$sessions = @(
    @{
        id = "SES-8801"
        associateId = "MCF-2026-089"
        associateName = "Amina Kwame"
        mentorId = "MEN-2026-001"
        mentorName = "Andre Garbutt"
        mentorDomain = "Workforce Development, Talent Management & HR Strategy"
        date = "2026-08-20"
        time = "02:00 PM"
        duration = "1 Hour"
        objective = "Review workforce development strategy and employability roadmap for African scholars."
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
