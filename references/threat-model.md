# Threat Model

## Scope

This repository is a React Native CLI mobile app that communicates with remote REST APIs, stores session state locally, and renders user-generated and server-provided content. The main runtime surfaces are:

- Authentication and onboarding flows.
- Home, Play, Rewards, Profile, Notification, and campaign management screens.
- Redux Toolkit slices, async thunks, and selectors that move data between screens.
- Local persistence through AsyncStorage and other storage helpers.
- Media playback, ad rendering, file upload, and webview/payment flows.

## Assets That Matter

- Access tokens, refreshable session state, and persisted user profile data.
- User wallet points, unlocked game state, and campaign ownership data.
- Uploaded media files and derived file URLs.
- Payment/session state for external checkout flows.
- Notification state and unread counts.

## Trust Boundaries

- Everything received from REST APIs is untrusted until normalized.
- Local storage is attacker-influenced because the user can modify device state, reinstall the app, or restore backups.
- Navigation params can be influenced by in-app UI flow and deep-link style state transitions.
- Media URLs, campaign metadata, and game unlock state are server-controlled and must be validated before use.
- Ad networks, webviews, and payment approval URLs cross an external trust boundary.

## Attacker-Controlled Inputs

- API response fields, especially auth responses, campaign records, game records, and unlock state.
- Uploaded file metadata and any URL fields returned by the backend.
- Notification payloads and route parameters derived from them.
- Persistent tokens or cached objects in AsyncStorage.
- Values selected in forms before submission.

## Security Invariants

- Only valid access tokens may be attached to authenticated API calls.
- Auth state must not be derived from arbitrary strings in API responses or cached storage.
- Locked game state must not grant unauthorized unlock paths.
- Media and webview URLs must be treated as untrusted and only used in the intended rendering path.
- Payment flows must not auto-complete without a verified success condition from the provider/backend.
- Cached data must not silently override fresher server state when it would change access control or monetized behavior.

## Primary Failure Modes

- Session confusion from malformed or stale stored tokens.
- Improper unlock of mini-games due to incorrect lock-state handling.
- Trusting API payloads without validating type, shape, or freshness.
- Replaying stale campaign/game data after the backend state has changed.
- Accepting untrusted URLs for media playback or webview navigation.
- Duplicate or out-of-order async requests causing incorrect UI state or unauthorized retries.

## Repository-Wide Risk Areas

- Auth, social login, and profile completion flows.
- Game unlock and ad gating flows.
- Campaign upload, retrieval, and media rendering.
- Payment and webview flows.
- Background caching, especially where it influences access control or monetization.
