@echo off
REM Forward to the actual script in the new location
pushd %~dp0startup\scripts
call stop-platform.bat %*
popd