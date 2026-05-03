'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';

export default function SettingsPage() {
  const { user } = useAuth();
  const name = user?.displayName ?? '사용자';
  const initials = name.slice(0, 2).toUpperCase();

  return (
    <div className="space-y-6 max-w-2xl animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">설정</h1>
        <p className="text-sm text-foreground-muted mt-1">계정 정보와 사용량을 관리하세요</p>
      </div>

      {/* 프로필 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">프로필</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarImage src={user?.photoURL ?? ''} alt={name} />
              <AvatarFallback className="text-base">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-foreground">{name}</p>
              <p className="text-sm text-foreground-muted">{user?.email}</p>
              <Badge variant="default" className="mt-1.5">Free 플랜</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 사용량 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">이번 달 사용량</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-foreground-muted">글 생성</span>
              <span className="font-medium text-foreground">0 / 5편</span>
            </div>
            <Progress value={0} />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-foreground-muted">영상 생성</span>
              <span className="font-medium text-foreground">0 / 1편</span>
            </div>
            <Progress value={0} />
          </div>
          <p className="text-xs text-foreground-subtle">매월 1일에 초기화됩니다</p>
        </CardContent>
      </Card>

      {/* 플랜 */}
      <Card className="border-primary-200 bg-primary-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-foreground">Pro 플랜으로 업그레이드</p>
              <p className="text-sm text-foreground-muted mt-1">
                무제한 글 + 영상 30편 + OCR + 자동 발행
              </p>
            </div>
            <p className="text-xl font-bold text-primary-500">₩29,900<span className="text-sm font-normal">/월</span></p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
