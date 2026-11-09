# ---- build stage: compile the jar with Maven ----
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
# Copy pom first so dependency downloads are cached between builds
COPY pom.xml .
RUN mvn -B -q dependency:go-offline
COPY src ./src
RUN mvn -B -q -DskipTests package

# ---- run stage: small JRE image ----
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

# Free hosting tiers have ~512 MB RAM: keep the JVM inside it.
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=70 -XX:+UseSerialGC"

# The host sets PORT; application.properties reads it (default 8080).
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]