# Fresh Repository Setup Steps

1. Backup current files:
```powershell
# Create backup folder
New-Item -ItemType Directory -Path "../project-backup" -Force
Copy-Item -Path * -Destination "../project-backup" -Recurse
```

2. Remove existing Git repository:
```powershell
# Remove Git tracking
Remove-Item -Path ".git" -Recurse -Force
Remove-Item -Path "crime-reporting-nexus" -Recurse -Force
```

3. Initialize new repository:
```powershell
# Create fresh Git repository
git init
git add .
git commit -m "Initial commit"
```

4. Create new GitHub repository:
```powershell
# After creating new repository on GitHub
git remote add origin <your-new-github-repo-url>
git branch -M main
git push -u origin main
```

Note: Replace <your-new-github-repo-url> with your actual new GitHub repository URL

# Fixing Secret Scanning Issues

1. Remove sensitive data:
```powershell
# Create .env.example template
Copy-Item .env .env.example
```

2. Clean sensitive data:
```powershell
# Remove real credentials from .env.example
(Get-Content .env.example) | ForEach-Object { 
    $_ -replace '(TWILIO_[A-Z_]+=).*', '$1YOUR_CREDENTIAL_HERE'
} | Set-Content .env.example

# Remove .env from git
git rm --cached .env
```

3. Update .gitignore:
```powershell
Add-Content .gitignore "`n.env"
```

4. Rewrite Git history:
```powershell
git filter-branch --force --index-filter `
    "git rm --cached --ignore-unmatch .env" `
    --prune-empty --tag-name-filter cat -- --all
```

5. Force push changes:
```powershell
git push origin main --force
```

Note: After pushing, share .env.example with team and ask them to create their own .env file
