const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

export interface AdminUser {
  id: number;
  username: string;
}

export interface AdminLoginResponse {
  admin: AdminUser;
}

export interface PrizeRule {
  id: number;
  game_config_id: number;
  required_wins: number;
  prize_name: string;
  prize_image_url: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface GameConfig {
  id: number;
  total_games: number;
  is_active: boolean;
  prizes: PrizeRule[];
  created_at: string;
  updated_at: string;
}

async function parseError(response: Response): Promise<string> {
  try {
    const data = await response.json();

    if (typeof data?.detail === 'string') {
      return data.detail;
    }
  } catch {
    // Ignore invalid/non-JSON responses.
  }

  return `Request failed with status ${response.status}`;
}

export async function loginAdmin(
  username: string,
  password: string,
): Promise<AdminLoginResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/admin/auth/login`,
    {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        password,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return response.json() as Promise<AdminLoginResponse>;
}

export async function getCurrentAdmin(): Promise<AdminUser> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/admin/auth/me`,
    {
      method: 'GET',
      credentials: 'include',
    },
  );

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return response.json() as Promise<AdminUser>;
}

export async function logoutAdmin(): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/admin/auth/logout`,
    {
      method: 'POST',
      credentials: 'include',
    },
  );

  if (!response.ok) {
    throw new Error(await parseError(response));
  }
}

export async function getGameConfig(): Promise<GameConfig> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/game-config`,
    {
      method: 'GET',
      credentials: 'include',
    },
  );

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return response.json() as Promise<GameConfig>;
}

export async function updateGameConfig(
  totalGames: number,
): Promise<GameConfig> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/game-config`,
    {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        total_games: totalGames,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return response.json() as Promise<GameConfig>;
}

export async function createPrizeRule(
  gameConfigId: number,
  data: {
    required_wins: number;
    prize_name: string;
    prize_image_url: string;
    is_active: boolean;
  },
): Promise<PrizeRule> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/game-config/${gameConfigId}/prize-rules`,
    {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    },
  );

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return response.json() as Promise<PrizeRule>;
}

export async function updatePrizeRule(
  gameConfigId: number,
  prizeRuleId: number,
  data: {
    required_wins: number;
    prize_name: string;
    prize_image_url: string;
    is_active: boolean;
  },
): Promise<PrizeRule> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/game-config/${gameConfigId}/prize-rules/${prizeRuleId}`,
    {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    },
  );

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return response.json() as Promise<PrizeRule>;
}

export async function uploadPrizeImage(
  file: File,
): Promise<{ url: string; filename: string }> {
  const formData = new FormData();

  formData.append('file', file);

  const response = await fetch(
    `${API_BASE_URL}/api/v1/admin/uploads/prize-image`,
    {
      method: 'POST',
      credentials: 'include',
      body: formData,
    },
  );

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return response.json() as Promise<{
    url: string;
    filename: string;
  }>;
}

export async function deletePrizeRule(
  gameConfigId: number,
  prizeRuleId: number,
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/game-config/${gameConfigId}/prize-rules/${prizeRuleId}`,
    {
      method: 'DELETE',
      credentials: 'include',
    },
  );

  if (!response.ok) {
    let message = 'Unable to delete prize rule.';

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
}