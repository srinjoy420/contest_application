# Rankroom frontend

A small React dashboard for the contest ranking project. It provides the user-facing actions currently exposed by `user_service` and the admin ranking actions exposed by `admin-service`.

## Included functionality

- Sign up for an eligible account
- Sign in and log out
- Create a post with caption, category, and image/video upload
- Like, unlike, and comment on a post by ID
- View global, category, and consistency rankings
- Refresh ranking data
- Run the admin prize cascade
- Show loading, success, and backend error states

## Run locally

Start the backend services first:

```powershell
cd user_service
npm run dev
```

```powershell
cd admin-service
npm run dev
```

Then start the frontend:

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

The frontend expects:

- User service at `http://localhost:3000`
- Admin service at `http://localhost:5000`

## API integration

The browser calls the admin service for rankings and cascade execution. The admin service calls the protected user-service ranking routes with `INTERNAL_SERVICE_SECRET`, so that secret is not placed in the frontend.

User requests use these routes:

- `POST /api/v1/auth/signup`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `POST /api/v1/post/createpost`
- `POST /api/v1/post/:id/like`
- `DELETE /api/v1/post/:id/like`
- `POST /api/v1/post/:id/comment`

Admin proxy requests use:

- `GET /api/v1/admin/rankings/global`
- `GET /api/v1/admin/rankings/category`
- `GET /api/v1/admin/rankings/consistency`
- `POST /api/v1/admin/run-cascade`

## Current limitation

The user service does not currently expose a `GET posts` or feed endpoint. The frontend therefore keeps the newly created post ID and also allows a post ID to be entered manually for like, unlike, and comment actions. A feed can be added once a post-list API is available.

## Contest rules shown

- Eligible residency: `Chhattisgarh`
- Contest start: `2026-01-05`
- Consistency requirement: 3 posts per week for 4 weeks
