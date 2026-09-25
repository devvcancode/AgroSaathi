import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis

export function getPrisma() {
	if (!globalForPrisma.__agrosaathiPrisma) {
		globalForPrisma.__agrosaathiPrisma = new PrismaClient()
	}
	return globalForPrisma.__agrosaathiPrisma
}

export { PrismaClient }
