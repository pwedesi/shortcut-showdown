import { expect, test } from "@playwright/test";

type LobbyApiPlayer = {
  player_id?: unknown;
  is_leader?: unknown;
};

type LobbyApiResponse = {
  id?: unknown;
  players?: unknown;
};

function parseLobbyCreateResponse(raw: unknown): {
  lobbyId: string;
  leaderPlayerId: string;
} {
  const body = (raw ?? {}) as LobbyApiResponse;
  const lobbyId = typeof body.id === "string" ? body.id.trim() : "";
  if (!lobbyId) {
    throw new Error("Expected create lobby response to include lobby id.");
  }

  const players = Array.isArray(body.players)
    ? (body.players as LobbyApiPlayer[])
    : [];
  const leader =
    players.find((p) => p && p.is_leader === true) ?? players.at(0) ?? null;
  const leaderPlayerId =
    leader && typeof leader.player_id === "string" ? leader.player_id.trim() : "";
  if (!leaderPlayerId) {
    throw new Error("Expected create lobby response to include leader player id.");
  }

  return { lobbyId, leaderPlayerId };
}

test("join -> play -> results loop works against local backend", async ({
  browser,
  request,
}) => {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";
  const health = await request.get(`${apiBaseUrl}/`);
  expect(
    health.ok(),
    `Local backend must be running at ${apiBaseUrl} before running this test.`,
  ).toBeTruthy();

  const leaderContext = await browser.newContext();
  const joinerContext = await browser.newContext();

  try {
    const leaderPage = await leaderContext.newPage();
    const joinerPage = await joinerContext.newPage();

    await leaderPage.goto("/");
    await expect(leaderPage.getByText("Realtime connected")).toBeVisible({
      timeout: 20_000,
    });
    await leaderPage.getByLabel("Player Callsign").fill("LEADER_E2E");

    const createLobbyResponsePromise = leaderPage.waitForResponse(
      (res) =>
        res.request().method() === "POST" &&
        new URL(res.url()).pathname === "/lobbies" &&
        res.ok(),
    );
    await leaderPage.getByRole("button", { name: /create lobby/i }).click();
    await expect(leaderPage).toHaveURL(/\/lobby\?id=/, { timeout: 20_000 });

    const createLobbyResponse = await createLobbyResponsePromise;
    const { lobbyId, leaderPlayerId } = parseLobbyCreateResponse(
      await createLobbyResponse.json(),
    );

    const setChallengeCount = await request.post(
      `${apiBaseUrl}/lobbies/${encodeURIComponent(lobbyId)}/set-challenge-count`,
      { data: { player_id: leaderPlayerId, challenge_count: 1 } },
    );
    expect(setChallengeCount.ok()).toBeTruthy();

    const setRoundDuration = await request.post(
      `${apiBaseUrl}/lobbies/${encodeURIComponent(lobbyId)}/set-round-duration`,
      { data: { player_id: leaderPlayerId, round_duration_seconds: 10 } },
    );
    expect(setRoundDuration.ok()).toBeTruthy();

    await joinerPage.goto("/");
    await expect(joinerPage.getByText("Realtime connected")).toBeVisible({
      timeout: 20_000,
    });
    await joinerPage.getByLabel("Player Callsign").fill("JOINER_E2E");
    await joinerPage.getByRole("button", { name: /join lobby/i }).click();
    await joinerPage.getByLabel("Lobby id or code").fill(lobbyId);
    await joinerPage.getByRole("button", { name: /join with code/i }).click();
    await expect(joinerPage).toHaveURL(new RegExp(`/lobby\\?id=${lobbyId}`), {
      timeout: 20_000,
    });

    await joinerPage.getByRole("button", { name: /mark ready/i }).click();
    await expect(joinerPage.getByRole("button", { name: /^ready$/i })).toBeVisible();

    const launchButton = leaderPage.getByRole("button", {
      name: /initiate launch/i,
    });
    await expect(launchButton).toBeEnabled({ timeout: 20_000 });
    await launchButton.click();

    await expect(leaderPage).toHaveURL(/\/gameplay\?/, { timeout: 20_000 });
    await expect(joinerPage).toHaveURL(/\/gameplay\?/, { timeout: 20_000 });

    await expect(leaderPage).toHaveURL(/\/results\?/, { timeout: 40_000 });
    await expect(joinerPage).toHaveURL(/\/results\?/, { timeout: 40_000 });
    await expect(
      leaderPage.getByRole("heading", { name: /session telemetry/i }),
    ).toBeVisible();
    await expect(
      joinerPage.getByRole("heading", { name: /session telemetry/i }),
    ).toBeVisible();
  } finally {
    await leaderContext.close();
    await joinerContext.close();
  }
});
