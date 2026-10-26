CREATE TABLE "rate_limits" (
    "id" TEXT NOT NULL,
    "key" TEXT,
    "count" INTEGER NOT NULL DEFAULT 0,
    "lastRequest" BIGINT NOT NULL,

    CONSTRAINT "rate_limits_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "rate_limits_key_key" ON "rate_limits"("key");
