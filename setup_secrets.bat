@echo off
echo Configuration des secrets Supabase...
echo.
echo Envoi des cles VAPID...

call npx supabase secrets set VAPID_PUBLIC_KEY=BOB8cDNa7fPe3p7FklnC11Hq4IL9SrwlOn97ep6eDCKwNF7f0zrvdFG6Y-4ose4IMEq7hISnfl-HgJ5EsPe91C8
call npx supabase secrets set VAPID_PRIVATE_KEY=rEmUSt3J0CbRVPk_vHUF_Hl5rDD4O9KgzOz8Pz4Yk7s

echo.
echo Secrets configures ! Vous pouvez maintenant deployer avec :
echo npx supabase functions deploy push-sender --no-verify-jwt
pause
