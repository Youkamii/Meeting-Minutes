export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-semibold mb-4">개인정보처리방침</h1>
      <p className="text-sm text-[var(--muted-foreground)] mb-4">최종 수정일: 2026-05-06</p>
      <div className="space-y-4 text-sm">
        <p>Meeting Minutes(이하 &quot;서비스&quot;)는 내부 운영 도구로, Google OAuth를 통해 인증된 사용자만 접근할 수 있습니다.</p>
        <h2 className="font-semibold text-lg">수집하는 정보</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Google 계정의 이름, 이메일 주소, 프로필 사진 — 사용자 식별 및 서비스 내 표시</li>
          <li>감사 로그(audit log)에 기록되는 클라이언트 IP — 보안 사고 추적 및 변경 이력 검증</li>
          <li>로그인 실패 IP 및 시각 — 무차별 대입 공격 방어</li>
        </ul>
        <h2 className="font-semibold text-lg">정보의 이용</h2>
        <p>수집된 정보는 서비스 운영, 사용자 인증, 보안 감사 목적으로만 사용되며, 제3자에게 제공되지 않습니다.</p>
        <h2 className="font-semibold text-lg">보존 기간</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>감사 로그 및 IP 기록: 최대 1년 (정기 정리 대상)</li>
          <li>로그인 실패 기록: 7일 (자동 만료)</li>
          <li>Google 계정 정보: 계정 삭제 시까지</li>
        </ul>
        <p className="text-xs text-[var(--muted-foreground)]">
          IP 주소는 GDPR 등 일부 법제에서 개인식별정보로 분류될 수 있어 본 항목에 명시합니다.
          API 응답에는 노출되지 않으며, 데이터베이스에서 직접 조회 권한을 가진 운영자만 확인할 수 있습니다.
        </p>
        <h2 className="font-semibold text-lg">문의</h2>
        <p>개인정보 관련 문의: gkfkd747@gmail.com</p>
      </div>
    </div>
  );
}
