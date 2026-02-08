# =====================================================
# Service Repair Management System - Database Setup
# PowerShell Script to Create PostgreSQL Schema
# Auto-detects PostgreSQL installation
# =====================================================

param(
    [Parameter(Mandatory=$false)]
    [string]$Server = "localhost",
    
    [Parameter(Mandatory=$false)]
    [string]$Port = "5432",
    
    [Parameter(Mandatory=$false)]
    [string]$Database = "srm_database",
    
    [Parameter(Mandatory=$false)]
    [string]$Username = "postgres",
    
    [Parameter(Mandatory=$false)]
    [string]$Password = "",
    
    [Parameter(Mandatory=$false)]
    [string]$SchemaFile = "srm_schema.sql",
    
    [Parameter(Mandatory=$false)]
    [string]$PsqlPath = ""
)

# Color output functions
function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

function Write-ErrorMsg {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Write-WarningMsg {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

# Function to find PostgreSQL installation
function Find-PostgreSQL {
    Write-Info "Searching for PostgreSQL installation..."
    
    # Common installation paths
    $commonPaths = @(
        "C:\Program Files\PostgreSQL\*\bin\psql.exe",
        "C:\Program Files (x86)\PostgreSQL\*\bin\psql.exe",
        "C:\PostgreSQL\*\bin\psql.exe"
    )
    
    foreach ($path in $commonPaths) {
        $found = Get-ChildItem -Path $path -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($found) {
            return $found.FullName
        }
    }
    
    return $null
}

# Banner
Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  SRM Database Schema Setup" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Find psql
$psqlExe = $null

if ($PsqlPath -and (Test-Path $PsqlPath)) {
    $psqlExe = $PsqlPath
    Write-Success "Using provided psql path: $psqlExe"
} else {
    # Try to find in PATH first
    $psqlCmd = Get-Command psql -ErrorAction SilentlyContinue
    if ($psqlCmd) {
        $psqlExe = $psqlCmd.Source
        Write-Success "PostgreSQL client found in PATH: $psqlExe"
    } else {
        # Search common installation directories
        $psqlExe = Find-PostgreSQL
        
        if ($psqlExe) {
            Write-Success "PostgreSQL client found: $psqlExe"
        } else {
            Write-ErrorMsg "PostgreSQL client (psql) not found!"
            Write-Host ""
            Write-Host "Please do one of the following:" -ForegroundColor Yellow
            Write-Host "1. Install PostgreSQL from: https://www.postgresql.org/download/" -ForegroundColor White
            Write-Host "2. Add PostgreSQL bin directory to PATH" -ForegroundColor White
            Write-Host "3. Run script with -PsqlPath parameter:" -ForegroundColor White
            Write-Host "   .\setup_srm_database.ps1 -PsqlPath 'C:\Program Files\PostgreSQL\16\bin\psql.exe'" -ForegroundColor Gray
            Write-Host ""
            exit 1
        }
    }
}

# Check if schema file exists
if (-not (Test-Path $SchemaFile)) {
    Write-ErrorMsg "Schema file not found: $SchemaFile"
    Write-WarningMsg "Please ensure srm_schema.sql is in the current directory."
    exit 1
}

Write-Success "Schema file found: $SchemaFile"

# Get password if not provided
if ([string]::IsNullOrWhiteSpace($Password)) {
    Write-Host ""
    $SecurePassword = Read-Host "Enter PostgreSQL password for user '$Username'" -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecurePassword)
    $Password = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
}

# Set environment variable for password
$env:PGPASSWORD = $Password

Write-Host ""
Write-Info "Database Configuration:"
Write-Host "  Server:   $Server"
Write-Host "  Port:     $Port"
Write-Host "  Database: $Database"
Write-Host "  Username: $Username"
Write-Host ""

# Test connection
Write-Info "Testing connection to PostgreSQL server..."
$testConnection = & $psqlExe -h $Server -p $Port -U $Username -d postgres -c "SELECT version();" 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-ErrorMsg "Failed to connect to PostgreSQL server!"
    Write-Host ""
    Write-Host "Error details:" -ForegroundColor Red
    Write-Host $testConnection -ForegroundColor Red
    Write-Host ""
    Write-WarningMsg "Please check:"
    Write-Host "  - PostgreSQL service is running" -ForegroundColor White
    Write-Host "  - Username and password are correct" -ForegroundColor White
    Write-Host "  - Server address and port are correct" -ForegroundColor White
    $env:PGPASSWORD = $null
    exit 1
}

Write-Success "Connected to PostgreSQL server successfully!"

# Check if database exists
Write-Info "Checking if database '$Database' exists..."
$dbExists = & $psqlExe -h $Server -p $Port -U $Username -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$Database'" 2>&1

if ($dbExists -eq "1") {
    Write-WarningMsg "Database '$Database' already exists!"
    Write-Host ""
    $response = Read-Host "Do you want to drop and recreate it? (yes/no)"
    
    if ($response -eq "yes") {
        Write-Info "Dropping database '$Database'..."
        & $psqlExe -h $Server -p $Port -U $Username -d postgres -c "DROP DATABASE IF EXISTS $Database;" 2>&1 | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Database dropped successfully!"
        } else {
            Write-ErrorMsg "Failed to drop database!"
            $env:PGPASSWORD = $null
            exit 1
        }
    } else {
        Write-Info "Using existing database '$Database'..."
    }
} else {
    Write-Info "Database '$Database' does not exist. Creating..."
}

# Create database if it doesn't exist
if ($dbExists -ne "1" -or $response -eq "yes") {
    Write-Info "Creating database '$Database'..."
    & $psqlExe -h $Server -p $Port -U $Username -d postgres -c "CREATE DATABASE $Database;" 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Database '$Database' created successfully!"
    } else {
        Write-ErrorMsg "Failed to create database!"
        $env:PGPASSWORD = $null
        exit 1
    }
}

Write-Host ""
Write-Info "Executing schema file..."
Write-Host ""

# Execute the schema file
& $psqlExe -h $Server -p $Port -U $Username -d $Database -f $SchemaFile

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Green
    Write-Success "Schema created successfully!"
    Write-Host "=========================================" -ForegroundColor Green
    Write-Host ""
    
    # Get table count
    $tableCount = & $psqlExe -h $Server -p $Port -U $Username -d $Database -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';"
    
    Write-Info "Database Statistics:"
    Write-Host "  Total Tables: $tableCount"
    
    # Get index count
    $indexCount = & $psqlExe -h $Server -p $Port -U $Username -d $Database -tAc "SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public';"
    Write-Host "  Total Indexes: $indexCount"
    
    Write-Host ""
    Write-Success "Your SRM database is ready to use!"
    Write-Host ""
    Write-Host "Connection String:" -ForegroundColor Yellow
    Write-Host "  postgresql://$Username@$Server`:$Port/$Database" -ForegroundColor White
    Write-Host ""
    
} else {
    Write-Host ""
    Write-ErrorMsg "Failed to create schema!"
    Write-WarningMsg "Please check the error messages above."
    $env:PGPASSWORD = $null
    exit 1
}

# Clear password from environment
$env:PGPASSWORD = $null

Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")