# PowerShell script to move test files to their new locations
# This script implements the dual-level test organization approach

# Component tests
Write-Host "Moving component tests..."
Copy-Item -Path "components\BotConfigurationPage.test.tsx" -Destination "tests\components\" -Force
Copy-Item -Path "components\PerformancePage.test.tsx" -Destination "tests\components\" -Force
Copy-Item -Path "components\TechnicalAnalysisPage.test.tsx" -Destination "tests\components\" -Force

# Create editor subdirectory if it doesn't exist
if (-not (Test-Path "tests\components\editor")) {
    New-Item -Path "tests\components\editor" -ItemType Directory -Force
}

# Editor component tests
Copy-Item -Path "components\editor\EditableField.test.tsx" -Destination "tests\components\editor\" -Force
Copy-Item -Path "components\editor\integration.test.tsx" -Destination "tests\components\editor\" -Force
Copy-Item -Path "components\editor\RichTextEditor.test.tsx" -Destination "tests\components\editor\" -Force

# Service tests
Write-Host "Moving service tests..."
Copy-Item -Path "services\botService.test.ts" -Destination "tests\services\" -Force

# Context tests
Write-Host "Moving context tests..."
Copy-Item -Path "contexts\EditorContext.test.tsx" -Destination "tests\contexts\" -Force

# Backend tests
Write-Host "Moving backend tests..."
Copy-Item -Path "backend\test-auth.js" -Destination "tests\backend\" -Force
Copy-Item -Path "backend\test-bot.js" -Destination "tests\backend\" -Force
Copy-Item -Path "backend\test-cms.js" -Destination "tests\backend\" -Force
Copy-Item -Path "backend\test-media.js" -Destination "tests\backend\" -Force

# Move startup test files if they're not already in the right place
# Note: These appear to already be correctly placed in tests/startup/

Write-Host "Test files have been moved successfully."