import { PrismaClient } from "@prisma/client"

const prismaClientSingleton = () => {
  return new PrismaClient({
    // In Prisma 7, we might need to pass the adapter if using edge functions, 
    // but for local SQLite it should work if properly configured in prisma.config.ts
    // However, usually we can just pass the datasource URL in the constructor if not in schema.
    datasourceUrl: process.env.DATABASE_URL
  })
}

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prisma ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma
