@echo off
setlocal
set MAVEN_DIR=%~dp0.mvn\apache-maven-3.9.9
set MVN_EXEC=%MAVEN_DIR%\bin\mvn.cmd

if not exist "%MVN_EXEC%" (
    echo Downloading and extracting Maven 3.9.9...
    powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; (New-Object Net.WebClient).DownloadFile('https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/3.9.9/apache-maven-3.9.9-bin.zip', '%~dp0.mvn\maven.zip'); Expand-Archive -Path '%~dp0.mvn\maven.zip' -DestinationPath '%~dp0.mvn' -Force; Remove-Item '%~dp0.mvn\maven.zip'"
)

call "%MVN_EXEC%" %*
