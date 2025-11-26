@echo off
echo Creating backup of original files...
xcopy App.tsx App.tsx.backup /Y
xcopy package.json package.json.backup /Y
xcopy services\storageService.ts services\storageService.ts.backup /Y
echo Backup completed!
echo Files backed up:
echo - App.tsx.backup
echo - package.json.backup
echo - services\storageService.ts.backup
pause