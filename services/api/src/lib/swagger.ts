/**
 * OpenAPI/Swagger Configuration
 *
 * Provides API documentation for the Vlossom Protocol API.
 * Reference: Phase 3 - API Documentation requirement
 */

import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Vlossom Protocol API',
      version: '1.0.0',
      description: `
# Vlossom Protocol API

The Vlossom Protocol API powers the blockchain-based beauty services marketplace.

## Authentication

Most endpoints require JWT Bearer token authentication:
\`\`\`
Authorization: Bearer <your_jwt_token>
\`\`\`

Tokens are obtained via:
- **Email/Password**: POST /api/v1/auth/login
- **SIWE (Wallet)**: POST /api/v1/auth/siwe/verify

## Rate Limiting

All endpoints are rate limited. Default limits:
- Global: 100 requests/minute
- Authentication: 5 requests/15 minutes
- Bookings: 20 requests/hour

Rate limit headers are included in all responses:
- \`X-RateLimit-Limit\`: Maximum requests allowed
- \`X-RateLimit-Remaining\`: Requests remaining
- \`X-RateLimit-Reset\`: Unix timestamp when limit resets

## Error Responses

All errors follow a standard format:
\`\`\`json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": { ... }
  },
  "requestId": "uuid-for-tracing"
}
\`\`\`

## Versioning

This API uses URL path versioning. Current version: v1
      `,
      contact: {
        name: 'Vlossom Team',
        url: 'https://vlossom.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3002',
        description: 'Development server',
      },
      {
        url: 'https://api.vlossom.com',
        description: 'Production server',
      },
    ],
    tags: [
      { name: 'Auth', description: 'Authentication and user management' },
      { name: 'Bookings', description: 'Booking CRUD and lifecycle' },
      { name: 'Stylists', description: 'Stylist profiles and search' },
      { name: 'Wallet', description: 'Wallet and transaction management' },
      { name: 'Reviews', description: 'Review and rating system' },
      { name: 'Notifications', description: 'Push and in-app notifications' },
      { name: 'Properties', description: 'Property registration and management' },
      { name: 'Hair Health', description: 'Hair health tracking' },
      { name: 'Favorites', description: 'Favorite stylists' },
      { name: 'Rituals', description: 'Hair care rituals' },
      { name: 'DeFi', description: 'Liquidity and yield operations' },
      { name: 'Admin', description: 'Administrative operations' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from /api/v1/auth/login or /api/v1/auth/siwe/verify',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'VALIDATION_ERROR' },
                message: { type: 'string', example: 'Invalid input data' },
                details: { type: 'object' },
              },
              required: ['code', 'message'],
            },
            requestId: { type: 'string', format: 'uuid' },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            displayName: { type: 'string' },
            role: { type: 'string', enum: ['CUSTOMER', 'STYLIST', 'PROPERTY_OWNER', 'ADMIN'] },
            walletAddress: { type: 'string', pattern: '^0x[a-fA-F0-9]{40}$' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Booking: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            customerId: { type: 'string', format: 'uuid' },
            stylistId: { type: 'string', format: 'uuid' },
            serviceId: { type: 'string', format: 'uuid' },
            status: {
              type: 'string',
              enum: ['PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'PAYMENT_PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DISPUTED'],
            },
            scheduledStartTime: { type: 'string', format: 'date-time' },
            scheduledEndTime: { type: 'string', format: 'date-time' },
            totalAmountCents: { type: 'integer' },
            locationType: { type: 'string', enum: ['STYLIST_BASE', 'CUSTOMER_HOME', 'PROPERTY'] },
            locationAddress: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Stylist: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            bio: { type: 'string' },
            specialties: { type: 'array', items: { type: 'string' } },
            operatingMode: { type: 'string', enum: ['FIXED', 'MOBILE', 'HYBRID'] },
            isAcceptingBookings: { type: 'boolean' },
            rating: { type: 'number', minimum: 0, maximum: 5 },
            reviewCount: { type: 'integer' },
            services: { type: 'array', items: { $ref: '#/components/schemas/Service' } },
          },
        },
        Service: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            description: { type: 'string' },
            category: {
              type: 'string',
              enum: ['HAIRCUT', 'STYLING', 'COLORING', 'TREATMENT', 'BRAIDING', 'EXTENSIONS', 'OTHER'],
            },
            priceAmountCents: { type: 'integer' },
            estimatedDurationMin: { type: 'integer' },
            isActive: { type: 'boolean' },
          },
        },
        Wallet: {
          type: 'object',
          properties: {
            address: { type: 'string', pattern: '^0x[a-fA-F0-9]{40}$' },
            balance: { type: 'string', description: 'Balance in wei' },
            balanceFormatted: { type: 'string', description: 'Balance formatted with decimals' },
          },
        },
        Review: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            bookingId: { type: 'string', format: 'uuid' },
            rating: { type: 'integer', minimum: 1, maximum: 5 },
            comment: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Notification: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            type: { type: 'string' },
            title: { type: 'string' },
            body: { type: 'string' },
            read: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Property: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            address: { type: 'string' },
            status: { type: 'string', enum: ['PENDING', 'APPROVED', 'SUSPENDED'] },
            amenities: { type: 'array', items: { type: 'string' } },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer', minimum: 1 },
            limit: { type: 'integer', minimum: 1, maximum: 100 },
            total: { type: 'integer' },
            hasMore: { type: 'boolean' },
          },
        },
      },
      responses: {
        Unauthorized: {
          description: 'Authentication required or token invalid',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
                requestId: '550e8400-e29b-41d4-a716-446655440000',
              },
            },
          },
        },
        Forbidden: {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
        ValidationError: {
          description: 'Invalid input data',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
        RateLimited: {
          description: 'Too many requests',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                error: {
                  code: 'RATE_LIMIT_EXCEEDED',
                  message: 'Too many requests. Please try again later.',
                  retryAfter: 60,
                },
              },
            },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.ts', './src/routes/**/*.ts'],
};

const swaggerSpec = swaggerJsdoc(options);

/**
 * Setup Swagger UI middleware
 */
export function setupSwagger(app: Express): void {
  // Serve OpenAPI spec as JSON
  app.get('/api/docs/openapi.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // Serve Swagger UI
  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customSiteTitle: 'Vlossom API Documentation',
      customCss: `
        .swagger-ui .topbar { display: none; }
        .swagger-ui .info .title { color: #D17B69; }
      `,
    })
  );
}

export { swaggerSpec };
