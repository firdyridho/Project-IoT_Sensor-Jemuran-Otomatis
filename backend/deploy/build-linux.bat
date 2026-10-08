@echo off
echo ======================================================================
echo   MENGOMPILASI HUJANPANTAU BACKEND (LINUX AMD64) UNTUK TENCENT VPS
echo ======================================================================
cd ..
set GOOS=linux
set GOARCH=amd64
set CGO_ENABLED=0
go build -ldflags="-s -w" -o hujan-backend-linux main.go
if %ERRORLEVEL% EQU 0 (
    echo [SUKSES] Binary 'hujan-backend-linux' berhasil dibuat!
    echo Upload file 'hujan-backend-linux' ini ke aaPanel di Tencent VPS Anda.
) else (
    echo [ERROR] Kompilasi gagal. Periksa error di atas.
)
cd deploy
pause
