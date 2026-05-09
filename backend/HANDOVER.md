# Team Handover Document

This document outlines how the **Backend (Track A)** integrates with the **Frontend (Track B)**, and how Person A2 should proceed with the Commerce features.

---

## For Track B (Frontend Team)

### API Endpoints Overview
The backend is built with FastAPI and runs on `http://127.0.0.1:8000`. You can view the interactive documentation and schema definitions by visiting `http://127.0.0.1:8000/docs` while the server is running.

### 1. Authentication Flow (Phone OTP)
We are using a mock OTP system for the hackathon.

**Step A: Request OTP**
```http
POST /api/v1/auth/send-otp
Content-Type: application/json
{ "phone": "+919999999999" }
```
*The OTP is hardcoded to `123456`.*

**Step B: Verify & Login**
```http
POST /api/v1/auth/verify-otp
Content-Type: application/json
{ "phone": "+919999999999", "otp": "123456" }
```
**Important:** This will return a JSON object containing an `access_token`. You **MUST** save this token in `localStorage` or a cookie. 

For all protected requests going forward, attach this header:
`Authorization: Bearer <your_access_token>`

### 2. Media Upload Flow (S3 Bypassing)
To save server bandwidth, the React/Next.js frontend will upload large video files directly to S3/Cloudflare R2.

**Step A: Get Pre-Signed URL**
Send a request with the `Authorization` header:
```http
POST /api/v1/media/presigned-url
Content-Type: application/json
{ "filename": "video.mp4", "content_type": "video/mp4" }
```
You will receive an `url`, `s3_key`, and `vault_id`. 

**Step B: Upload to S3**
Do a `PUT` request directly to the `url` returned in Step A with the raw video file.

**Step C: Trigger Processing**
Once the `PUT` upload succeeds, tell the backend to start processing it:
```http
POST /api/v1/media/process-webhook
Content-Type: application/json
{ "vault_id": "<vault_id_from_step_a>", "s3_key": "<s3_key_from_step_a>" }
```

---

## For Track A (Person A2 - Commerce & Sanad)

Person A1 has completely scaffolded the PostgreSQL database schema for you. All the models you need to build the `Sanad`, `Workshop`, and `Bazaar` layers are available in `backend/app/models/models.py`.

### Database Schema Available
- **Master**: The core user.
- **Vault & CraftDNA**: The captured knowledge layer.
- **Sanad**: The public provenance layer. Links back to `CraftDNA`. Includes `crypto_signature`.
- **Workshop & Booking**: The "Ustaad" layer. Links to `Master`.
- **Bundle & Order**: The "Bazaar" layer.

### Where You Should Start
1. Create `app/api/endpoints/sanad.py` to handle the generation and verification of cryptographic signatures.
2. Create `app/api/endpoints/commerce.py` for handling Workshop bookings and Bazaar checkout flows.
3. Don't forget to register your new routers in `app/api/api.py`!

*Tip: You don't need to touch Alembic or the database connection; it's all wired up. Just import `get_db` and query the tables!*
