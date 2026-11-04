# Known Universe Observatory — Firestore Security Specification

## 1. Data Invariants & Access Model
- **Default Deny**: All unmatched paths are unconditionally denied (`allow read, write: if false;`).
- **Verified Identity**: All write operations require an authenticated, email-verified user (`request.auth != null && request.auth.token.email_verified == true`) whose `uid` matches the document owner (`uid` or `ownerId`).
- **Admin Bootstrap & Lookup**: `isAdmin()` is true only when `request.auth != null && request.auth.token.email_verified == true` and either:
  - `request.auth.token.email == 'brandon4america@gmail.com'`, OR
  - `/users/$(request.auth.uid)` exists and has `role == 'admin'`.
- **Denial-of-Wallet Ordering**: Every rule evaluates (1) Auth check (`isSignedIn()` / `isVerifiedUser()`), (2) Static ID and Schema validation (`isValidId()`, `isValid[Entity]()`), and (3) Relational/Admin DB reads (`isAdmin()`) last.
- **Temporal & Ownership Immutability**: `createdAt` and `ownerId`/`uid` are set on creation (`createdAt == request.time`) and locked on update; `updatedAt == request.time` on all writes.

## 2. The "Dirty Dozen" Adversarial Payloads (All Must Return `PERMISSION_DENIED`)
1. **Unauthenticated Profile Write**: `auth = null`, `create /users/u1` -> Denied by `isVerifiedUser()`.
2. **Unverified Email Spoof of Admin**: `auth = { uid: 'u2', email: 'brandon4america@gmail.com', email_verified: false }` -> Denied by `email_verified == true` gate in `isVerifiedUser()` and `isAdmin()`.
3. **Self-Assigned Admin Escalation on Create**: `create /users/u1` with `{ role: 'admin' }` by non-admin -> Denied by `incoming().role == 'researcher' || isAdmin()`.
4. **Role Escalation on Update**: `update /users/u1` changing `role` from `'researcher'` to `'admin'` by non-admin -> Denied by `incoming().role == existing().role` in non-admin update branch.
5. **Shadow Field Injection**: `create /celestialDiscoveries/d1` with extra key `{ isVerified: true }` -> Denied by `data.keys().hasOnly(...)` in `isValidDiscovery`.
6. **Cross-User PII Read**: Authenticated `uid: 'attacker'` performs `get /users/victim` -> Denied by `isOwner(userId) || isAdmin()`.
7. **Blanket User List Scraping**: Authenticated non-admin performs `list /users` -> Denied by `allow list: if isAdmin();`.
8. **Private Discovery Query Scraping**: Authenticated `uid: 'attacker'` performs `list /celestialDiscoveries` without filtering -> Denied unless `resource.data.ownerId == request.auth.uid || resource.data.isPublic == true || isAdmin()`.
9. **Ownership Hijack on Update**: Owner updates `/celestialDiscoveries/d1` setting `ownerId: 'otherUser'` -> Denied by `incoming().ownerId == existing().ownerId`.
10. **Forged Backdated Timestamp**: Client passes `createdAt: Timestamp(2020, 1, 1)` on `create` -> Denied by `incoming().createdAt == request.time`.
11. **Oversized Payload / ID Poisoning**: Document ID > 128 chars or containing `/` or `biosignatureNotes` > 4000 chars -> Denied by `isValidId()` and `.size() <= 4000`.
12. **Arbitrary Star Manipulation on Shared Maps**: Non-owner updates `/sharedMaps/m1` with `starCount: existing.starCount + 100` or modifies `title` -> Denied by `affectedKeys().hasOnly(['starCount', 'updatedAt'])` and `incoming().starCount == existing().starCount + 1`.
