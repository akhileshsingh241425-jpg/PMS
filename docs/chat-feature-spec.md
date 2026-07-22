# Internal Company Chat — Feature Spec

## Objective
Real-time WhatsApp-style chat module for ~100 employees.

## Core Features
- User & Presence (online/offline/away, profile)
- 1-to-1 DM with real-time delivery, typing indicator, read receipts
- Group chat with admin controls
- Text, emoji, file/image/PDF sharing, reply, delete
- In-app + browser notifications, sound toggle
- Chat search & recent conversations list

## Access & Security
- Internal network / existing SSO login only
- Admin panel: block users, audit logs
- Encrypted at rest + in transit
- Role-based permissions (employee vs admin/HR)

## Tech Stack
- Real-time: Socket.IO
- Backend: Node.js (Express) — existing project uses Flask/Python, but chat will use Node
- Database: PostgreSQL (chat history), Redis (presence)
- Frontend: React.js (existing)
- File storage: S3 / internal storage
- Auth: JWT from existing system
- Notifications: WebSocket (in-app)

## User Stories
1. See who's online on login
2. DM any colleague instantly
3. Create groups with team members
4. Admins can manage groups/users
5. Get notifications when new messages arrive
6. Search old chat history
