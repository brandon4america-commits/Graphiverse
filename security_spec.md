# Known Universe Observatory — Firestore Security Specification

## 1. Authentication & Admin Bootstrap
- All database access requires Firebase Authentication (`request.auth != null`).
- Admin role (`isAdmin()`) requires either:
  - A `/users/{uid}` document with `role == 'admin'`, OR
  - Primary observatory owner email (`brandon4america@gmail.com`) with `request.auth.token.email_verified == true`.
- Self-assigned privilege escalation is strictly prevented on `/users/{userId}`.

## 2. Collections & Access Control

### `/users/{userId}`
- **Read (`get`)**: Owner (`isOwner(userId)`) or Admin (`isAdmin()`). No blanket `list`.
- **Create**: Owner (`isOwner(userId)`), valid ID (`isValidId(userId)`), schema validated (`isValidUserProfile`), `createdAt == request.time`, `updatedAt == request.time`, `role == 'researcher'` (unless `isAdmin()`).
- **Update**: Owner or Admin, schema validated, `uid` and `createdAt` immutable, `updatedAt == request.time`, `role` immutable unless `isAdmin()`.
- **Delete**: Admin only.

### `/celestialDiscoveries/{discoveryId}`
- **Read (`get`, `list`)**: Authenticated users may read if `resource.data.ownerId == request.auth.uid || resource.data.isPublic == true || isAdmin()`.
- **Create**: Authenticated user where `request.resource.data.ownerId == request.auth.uid`, valid ID, `isValidDiscovery(request.resource.data)`, `createdAt == request.time`, `updatedAt == request.time`.
- **Update**: Owner or Admin, `ownerId` and `createdAt` immutable, `updatedAt == request.time`, `isValidDiscovery(request.resource.data)`.
- **Delete**: Owner or Admin.

### `/expeditions/{expeditionId}`
- **Read (`get`, `list`)**: Owner (`resource.data.ownerId == request.auth.uid`) or Admin.
- **Create**: Authenticated owner, valid ID, `isValidExpedition(request.resource.data)`, `createdAt == request.time`, `updatedAt == request.time`.
- **Update**: Owner or Admin, `ownerId` and `createdAt` immutable, `updatedAt == request.time`, `isValidExpedition(request.resource.data)`.
- **Delete**: Owner or Admin.

### `/chatSessions/{sessionId}`
- **Read (`get`, `list`)**: Owner (`resource.data.ownerId == request.auth.uid`) or Admin.
- **Create**: Authenticated owner, valid ID, `isValidChatSession(request.resource.data)`, `createdAt == request.time`, `updatedAt == request.time`.
- **Update**: Owner or Admin, `ownerId` and `createdAt` immutable, `updatedAt == request.time`, `isValidChatSession(request.resource.data)`.
- **Delete**: Owner or Admin.

### `/sharedMaps/{mapId}`
- **Read (`get`, `list`)**: Authenticated users may read if `resource.data.ownerId == request.auth.uid || resource.data.isPublic == true || isAdmin()`.
- **Create**: Authenticated owner, valid ID, `isValidSharedMap(request.resource.data)`, `createdAt == request.time`, `updatedAt == request.time`.
- **Update**:
  - Owner or Admin: full update with `ownerId` and `createdAt` immutable and `updatedAt == request.time`.
  - Authenticated community member on a public map: may increment `starCount` by `+1` along with `updatedAt == request.time` (`affectedKeys().hasOnly(['starCount', 'updatedAt'])`).
- **Delete**: Owner or Admin.
