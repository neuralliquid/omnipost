import { NextResponse } from 'next/server';
import { withErrorHandling } from '../../_utils/errors';
import { authService } from '../../../../lib/auth/auth-service';

export const GET = withErrorHandling(async (_req: Request) => {
  const user = await authService.getCurrentUser();

  if (!user) {
    return NextResponse.json({ authenticated: false, user: null });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
    },
  });
});
