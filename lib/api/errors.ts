import { NextResponse } from 'next/server';

export type ApiError = {
  error: string;
  code?: string;
  details?: unknown;
};

export function errorResponse(message: string, status: number, code?: string) {
  return NextResponse.json({ error: message, code } satisfies ApiError, { status });
}

export const ApiErrors = {
  unauthorized: () => errorResponse('인증이 필요합니다.', 401, 'UNAUTHORIZED'),
  forbidden: (msg = '권한이 없습니다.') => errorResponse(msg, 403, 'FORBIDDEN'),
  usageExceeded: () => errorResponse('이번 달 사용량을 모두 사용했어요. Pro 플랜으로 업그레이드해보세요.', 403, 'USAGE_EXCEEDED'),
  notFound: (resource = '리소스') => errorResponse(`${resource}를 찾을 수 없습니다.`, 404, 'NOT_FOUND'),
  badRequest: (msg: string) => errorResponse(msg, 400, 'BAD_REQUEST'),
  serverError: (msg = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.') => errorResponse(msg, 500, 'SERVER_ERROR'),
};
