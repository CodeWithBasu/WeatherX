-- CreateTable
CREATE TABLE "WeatherCache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "location" TEXT NOT NULL,
    "lat" REAL NOT NULL,
    "lon" REAL NOT NULL,
    "data" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    "expiresAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SearchHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "query" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SavedLocation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "lat" REAL NOT NULL,
    "lon" REAL NOT NULL,
    "timezone" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "WeatherCache_location_key" ON "WeatherCache"("location");

-- CreateIndex
CREATE UNIQUE INDEX "SavedLocation_name_key" ON "SavedLocation"("name");
