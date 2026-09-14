# Stage 1: Build stage
FROM eclipse-temurin:25-jdk AS builder
WORKDIR /app

# Install Maven build tool
RUN apt-get update && apt-get install -y maven && rm -rf /var/lib/apt/lists/*

# Copy pom.xml and source code
COPY pom.xml ./
COPY src ./src

# Package application JAR
RUN MAVEN_OPTS="-Dspring.classformat.ignore=true" mvn clean package -DskipTests

# Stage 2: Runtime stage
FROM eclipse-temurin:25-jre AS runner
WORKDIR /app

# Create non-root system user for security
RUN groupadd -r remembermap && useradd -r -g remembermap remembermap

COPY --from=builder /app/target/*.jar app.jar
RUN chown remembermap:remembermap app.jar

USER remembermap
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
