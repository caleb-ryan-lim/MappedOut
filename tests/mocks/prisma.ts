export const prisma = new Proxy(
  {},
  {
    get() {
      throw new Error("Prisma access is not available in unit tests.");
    },
  },
);
