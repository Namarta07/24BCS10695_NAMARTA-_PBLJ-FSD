# Campus Event Registration API

REST API (Node.js, Express, MongoDB/Mongoose) for registering and managing attendees for the college technical symposium.

## Setup

```bash
npm install
cp .env.example .env     # set MONGODB_URI if needed
npm start                # or: npm run dev
```

Requires a running MongoDB instance (default: `mongodb://127.0.0.1:27017/campus_events`).

## Project structure

```
src/
  app.js                         Express app (routes + error handling)
  server.js                      DB connection and server start
  models/Registration.js         Mongoose schema and validations
  controllers/registrationController.js
  routes/registrationRoutes.js
  middleware/errorHandler.js     ValidationError / CastError / duplicate key (11000) handling
  utils/discount.js              Discount code logic
  utils/AppError.js
```

## Endpoints

| Method | Endpoint                 | Description                                              | Status codes        |
|--------|--------------------------|----------------------------------------------------------|---------------------|
| POST   | /api/registrations       | Create a registration                                    | 201, 400, 409       |
| GET    | /api/registrations       | List all (filters: `?eventType=ROBOTICS&status=CONFIRMED`) | 200, 400            |
| GET    | /api/registrations/:id   | Get one by ID                                            | 200, 400, 404       |
| PUT    | /api/registrations/:id   | Update (validators run on update)                        | 200, 400, 404, 409  |
| DELETE | /api/registrations/:id   | Cancel / delete                                          | 200, 400, 404       |

## Business rules

- **Discount codes:** `CAMPUS50` gives 50% off, `EARLYBIRD` gives a flat 100 off (never below 0), no code means `finalAmount = ticketPrice`. Any other code returns `400 "Invalid discount code"`.
- **AI workshop:** `AI_WORKSHOP` allows only `teamSize = 1`.
- **Update validation:** `PUT` uses `findByIdAndUpdate` with `runValidators: true`. The existing record is merged with the changes first, so the team-size rule and `finalAmount` are always checked against the final state (changing only `eventType` or only `teamSize` is caught too).
- `finalAmount` is always computed by the server; any value sent by the client is ignored.

## Error format

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": ["Must be a valid college email ending in .edu or .ac.in", "teamSize cannot be more than 4"]
}
```

| Case                         | Status | Message                                              |
|------------------------------|--------|------------------------------------------------------|
| Schema validation failure    | 400    | array of readable messages in `errors`               |
| Invalid discount code        | 400    | `Invalid discount code`                              |
| Invalid ObjectId             | 400    | `Invalid registration ID format`                     |
| Duplicate email (code 11000) | 409    | `This email is already registered for the event`     |
| Not found                    | 404    | `Registration not found`                             |

## Sample requests

```bash
# Create (finalAmount becomes 300)
curl -X POST http://localhost:3000/api/registrations \
  -H "Content-Type: application/json" \
  -d '{"studentName":"Aarav Sharma","collegeEmail":"aarav.cs24@institute.ac.in","rollNumber":"24CSB102","eventType":"CODING_HACKATHON","teamSize":3,"ticketPrice":600,"discountCode":"CAMPUS50"}'

# 1. Non-college email -> 400
curl -X POST http://localhost:3000/api/registrations -H "Content-Type: application/json" \
  -d '{"studentName":"Test User","collegeEmail":"student@gmail.com","rollNumber":"24CSB103","eventType":"ROBOTICS","teamSize":2,"ticketPrice":200}'

# 2. AI workshop with team of 2 -> 400
curl -X POST http://localhost:3000/api/registrations -H "Content-Type: application/json" \
  -d '{"studentName":"Test User","collegeEmail":"t@college.edu","rollNumber":"24CSB104","eventType":"AI_WORKSHOP","teamSize":2,"ticketPrice":200}'

# 3. Submit the same email twice -> second call returns 409

# 4. Invalid ObjectId -> 400
curl http://localhost:3000/api/registrations/12345invalid

# Filters
curl "http://localhost:3000/api/registrations?eventType=ROBOTICS&status=CONFIRMED"

# Update (validators run)
curl -X PUT http://localhost:3000/api/registrations/<id> -H "Content-Type: application/json" \
  -d '{"eventType":"AI_WORKSHOP","teamSize":3}'
```
