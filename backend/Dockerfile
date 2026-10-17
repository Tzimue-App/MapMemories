# Stage 1: Build stage
FROM eclipse-temurin:25-jdk AS builder
WORKDIR /app

# Install Maven build tool
RUN apt-get update && apt-get install -y --no-install-recommends maven && rm -rf /var/lib/apt/lists/*

# Resolve dependencies in their own layer so source-only changes reuse the cache
COPY pom.xml ./
RUN mvn -B -q dependency:go-offline

# Copy source code and package the application JAR (tests run in CI before images are built)
COPY src ./src
RUN MAVEN_OPTS="-Dspring.classformat.ignore=true" mvn -B clean package -DskipTests

# Stage 2: Runtime stage
FROM eclipse-temurin:25-jre AS runner
WORKDIR /app

# Create non-root system user for security
RUN groupadd -r remembermap && useradd -r -g remembermap remembermap

COPY --from=builder --chown=remembermap:remembermap /app/target/*.jar app.jar

USER remembermap
EXPOSE 8080

# Size the heap from the container memory limit and fail fast on OOM so the orchestrator restarts us
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75 -XX:+ExitOnOutOfMemoryError"

ENTRYPOINT ["java", "-jar", "app.jar"]
