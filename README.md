# Resilient Email Service

A robust, production-ready email sending service built with TypeScript that implements multiple resilience patterns including retry logic, fallback providers, circuit breakers, rate limiting, and idempotency.

### Core Requirements
-  **EmailService Class**: Centralized service with two mock email providers
-  **Retry Logic**: Exponential backoff with configurable max attempts
-  **Fallback Mechanism**: Automatic provider switching on failure
-  **Idempotency**: Prevents duplicate email sends using content-based IDs
-  **Rate Limiting**: Configurable request throttling
-  **Status Tracking**: Real-time monitoring of email sending attempts

### Bonus Features
-  **Circuit Breaker Pattern**: Prevents cascading failures
-  **Comprehensive Logging**: Structured logging with multiple levels
-  **Queue System**: Asynchronous email processing
-  **Health Monitoring**: Provider health checks and metrics
-  **Web Interface**: Interactive demo with real-time status updates

###  Architecture

### Design Principles
- **SOLID Principles**: Clean, maintainable, and extensible code
- **Dependency Injection**: Configurable providers and options
- **Error Handling**: Comprehensive error handling and recovery
- **Observability**: Detailed logging and monitoring
- **Testability**: Fully unit tested with mocks

### Key Components

```
lib/
├── email-service.ts          # Main EmailService class
├── types.ts                  # TypeScript interfaces
├── providers/
│   └── mock-providers.ts     # Mock email providers
└── utils/
    ├── rate-limiter.ts       # Rate limiting implementation
    ├── circuit-breaker.ts    # Circuit breaker pattern
    ├── logger.ts             # Structured logging
    └── helpers.ts            # Utility functions
```

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd resilient-email-service
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open the demo**
   Navigate to \`http://localhost:3000\` to see the interactive
   demo Live Link : 

### Running Tests
```bash
npm test
```

### Running the Test Script
```bash
node scripts/test-email-service.js
```

### Basic Usage

```typescript
import { EmailService } from './lib/email-service'
import { MockEmailProviderA, MockEmailProviderB } from './lib/providers/mock-providers'

const emailService = new EmailService([
  new MockEmailProviderA(),
  new MockEmailProviderB()
], {
  maxRetries: 3,
  baseDelay: 1000,
  rateLimit: { requests: 10, windowMs: 60000 }
})

const status = await emailService.sendEmail({
  to: 'recipient@example.com',
  from: 'sender@example.com',
  subject: 'Hello World',
  body: 'This is a test email'
})

console.log('Email status:', status)
```

### API Endpoints

- **POST /api/email/send** - Send an email
- **GET /api/email/status/:id** - Get email status

### Configuration Options

```typescript
interface EmailServiceOptions {
  maxRetries?: number        // Default: 3
  baseDelay?: number         // Default: 1000ms
  rateLimit?: {
    requests: number         // Default: 10
    windowMs: number         // Default: 60000ms
  }
}
```

### Retry Logic
- **Exponential Backoff**: Delays increase exponentially (1s, 2s, 4s, ...)
- **Jitter**: Random delay added to prevent thundering herd
- **Max Delay**: Capped at 30 seconds
- **Provider Fallback**: Tries all providers before retrying

### Circuit Breaker
- **Failure Threshold**: Opens after 5 consecutive failures
- **Recovery Timeout**: 30 seconds before attempting recovery
- **Half-Open State**: Single test request before full recovery

### Rate Limiting
- **Sliding Window**: Time-based request counting
- **Configurable Limits**: Customizable requests per time window
- **Graceful Degradation**: Clear error messages when limits exceeded

### Idempotency
- **Content-Based IDs**: MD5 hash of email content
- **Duplicate Detection**: Prevents sending identical emails
- **Status Preservation**: Returns existing status for duplicates

### Testing Strategy

### Unit Tests
- **Service Logic**: Core EmailService functionality
- **Provider Mocking**: Simulated provider failures
- **Edge Cases**: Rate limiting, circuit breaker states
- **Error Handling**: Various failure scenarios

### Integration Tests
- **End-to-End**: Full email sending flow
- **API Endpoints**: HTTP request/response testing
- **Resilience Patterns**: Retry and fallback behavior

### Mock Providers
- **Configurable Failure Rates**: Simulate real-world conditions
- **Network Delays**: Realistic response times
- **Error Scenarios**: Various failure types

### Logging
- **Structured Logs**: JSON format with timestamps
- **Log Levels**: Debug, Info, Warn, Error
- **Contextual Information**: Request IDs, provider names, attempt counts

### Metrics
- **Email Status**: Success/failure rates
- **Provider Health**: Circuit breaker states
- **Rate Limiting**: Current usage and limits
- **Performance**: Response times and retry counts

### Health Checks
- **Provider Status**: Individual provider health
- **Circuit Breaker State**: Open/closed status
- **Rate Limit Status**: Current usage

### Error Handling

### Error Types
- **Provider Errors**: Network failures, service unavailable
- **Rate Limit Errors**: Too many requests
- **Validation Errors**: Invalid email format, missing fields
- **Circuit Breaker Errors**: Provider temporarily unavailable

### Recovery Strategies
- **Automatic Retry**: With exponential backoff
- **Provider Fallback**: Switch to alternative providers
- **Circuit Recovery**: Automatic healing after timeout
- **Graceful Degradation**: Meaningful error messages

### Production Considerations

### Scalability
- **Horizontal Scaling**: Stateless service design
- **Database Integration**: Persistent status storage
- **Queue Integration**: Redis/RabbitMQ for high volume
- **Load Balancing**: Multiple service instances

### Security
- **Input Validation**: Sanitize all email content
- **Rate Limiting**: Prevent abuse and DoS attacks
- **Authentication**: API key or JWT validation
- **Audit Logging**: Track all email sending attempts

### Monitoring
- **Application Metrics**: Prometheus/Grafana integration
- **Error Tracking**: Sentry or similar service
- **Performance Monitoring**: APM tools
- **Alerting**: Critical failure notifications
