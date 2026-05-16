# WorkPet iOS / Apple Watch ⇆ FounderPet

The WorkPet native app at `/Users/ijeong-geun/workpet/apps/ios/` can talk to FounderPet's HTTP API. There is no need to rewrite the SwiftUI app — just point its base URL at the FounderPet host and consume `/api/watch`.

## Where to point WorkPet

`WorkPetAPIClient.swift` already supports a configurable base URL stored under `UserDefaults` key `workpet.api.baseURL`. Default is `http://127.0.0.1:8000`.

Set it at runtime (Settings screen) or hard-code for a build:

```swift
api.setBaseURL("https://founderpet.vercel.app")
```

## Endpoints

| WorkPet expectation         | FounderPet equivalent                         | Notes                                   |
|-----------------------------|-----------------------------------------------|-----------------------------------------|
| `GET /sync/bootstrap`        | `GET /api/pet?userId=<id>`                    | Returns full snapshot incl. events       |
| `POST /sync/watch-event`     | `POST /api/events`                            | Send `x-idempotency-key` per Watch event |
| Apple Watch complication     | `GET /api/watch?userId=<id>`                  | Compact 3-second payload                |

### Compact Watch payload shape

```jsonc
{
  "version": 1,
  "userId": "demo",
  "pet": { "stage": "DRAGON", "mood": "celebrating", "level": 21, "exp": 2050,
           "progressToNextStage": 100, "progressToNextLevel": 50 },
  "pulse": {
    "headline": "$49 verified today",
    "nextAction": "막힌 태스크 1개를 30분 안에 unblock 처리하세요.",
    "trustScore": 86,
    "buildScore": 42, "outcomeScore": 38, "momentumScore": 51, "launchReadiness": 60,
    "riskCount": 1
  },
  "today": { "revenue": 49, "verifiedRevenue": 49, "tasksDone": 1, "commits": 4,
             "agentRuns": 1, "leads": 0 },
  "complication": {
    "corner": "L21",
    "center": "CELEBRATING",
    "footer": "$49",
    "ringPercent": 100
  },
  "recent": [ /* 4 most-recent events */ ]
}
```

Use `complication.corner` for the corner gauge, `center` as the main label, `footer` as the small caption, and `ringPercent` for the progress ring. `pulse.nextAction` is short enough for a Watch notification body.

## Recommended Swift snippets

```swift
struct WatchPayload: Decodable {
    let version: Int
    let userId: String
    let pet: PetState
    let pulse: Pulse
    let complication: Complication

    struct PetState: Decodable {
        let stage: String
        let mood: String
        let level: Int
        let exp: Int
        let progressToNextStage: Int
    }
    struct Pulse: Decodable {
        let headline: String
        let nextAction: String
        let trustScore: Int
    }
    struct Complication: Decodable {
        let corner: String
        let center: String
        let footer: String
        let ringPercent: Int
    }
}

func fetchWatchPayload(baseURL: URL, userId: String) async throws -> WatchPayload {
    let url = baseURL.appendingPathComponent("/api/watch").appending(
        queryItems: [URLQueryItem(name: "userId", value: userId)]
    )
    let (data, _) = try await URLSession.shared.data(from: url)
    return try JSONDecoder().decode(WatchPayload.self, from: data)
}
```

Poll every 60s on Watch, every 5s on iPhone foreground, on-demand via complication push notification.

## Recording back from Watch

```swift
func recordWatchEvent(baseURL: URL, userId: String, kind: String,
                      value: Double, externalId: String) async throws {
    var request = URLRequest(url: baseURL.appendingPathComponent("/api/events"))
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    request.setValue(externalId, forHTTPHeaderField: "x-idempotency-key")
    if let secret = ProcessInfo.processInfo.environment["FOUNDERPET_INGEST_SECRET"] {
        request.setValue(secret, forHTTPHeaderField: "x-founderpet-secret")
    }
    request.httpBody = try JSONEncoder().encode([
        "userId": userId, "kind": kind, "value": value,
        "source": "manual",
    ] as [String: Any])
    _ = try await URLSession.shared.data(for: request)
}
```

`x-idempotency-key` should be deterministic per Watch action (e.g. `watch-<uuid>-tap-task-done`) so a single tap never double-credits.

## Outstanding native action

1. Open `/Users/ijeong-geun/workpet/apps/ios/WorkPet.xcodeproj` in Xcode.
2. Xcode → Settings → Accounts → add Apple ID `ljk7178@naver.com` (Team `Z9HQHX8T6Z`).
3. Select Targets `WorkPet`, `WorkPetWidget`, `WorkPet Watch App` → Signing & Capabilities → Team: Personal Team.
4. Pick the "째리" iPhone → Run (⌘R).
5. In the running app's Settings, set API URL to `https://<your-vercel-host>`.

## Why this works

FounderPet's `/api/watch` payload was deliberately designed for a 2.4" complication: ringPercent, 1 short headline, 1 next action. WorkPet's existing `WorkPetAnimatedPet` view does not need restructuring — only the data source.
