import swaggerJsdoc from "swagger-jsdoc";
import path from "path";

export const openapiSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Realtor Shamraiz API",
      version: "1.0.0",
      description: "Backend REST API for the Realtor Shamraiz admin panel and public site.",
    },
    servers: [{ url: "/api/v1" }],
    components: {
      securitySchemes: {
        cookieAuth: { type: "apiKey", in: "cookie", name: "rs_access" },
      },
    },
  },
  apis: [path.join(__dirname, "../modules/**/*.routes.{ts,js}")],
});
