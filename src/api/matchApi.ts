export interface MatchCompletionRequest {
  player_wins: number;
  buddy_wins: number;
}

export interface MatchCompletionResponse {
  total_games: number;
  player_wins: number;
  buddy_wins: number;
  winner: 'player' | 'buddy';
  reward_eligible: boolean;
  prize_name: string | null;
  prize_image_url: string | null;
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

export async function completeMatch(
  request: MatchCompletionRequest
): Promise<MatchCompletionResponse> {
  console.log('MATCH REQUEST:', request);
  const response = await fetch(
    `${API_BASE_URL}/api/v1/match/complete`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    }
  );

  if (!response.ok) {
    let message = 'Unable to complete the match.';

    try {
      const error = await response.json();

      if (typeof error.detail === 'string') {
        message = error.detail;
      }
    } catch {
      // Keep the default error message.
    }

    throw new Error(message);
  }

  return response.json() as Promise<MatchCompletionResponse>;
}