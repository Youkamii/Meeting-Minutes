export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">개인정보처리방침</h1>
      <p className="text-sm text-[var(--muted-foreground)] mb-4">최종 수정일: 2026-04-06</p>
      <div className="space-y-4 text-sm">
        <p>Meeting Minutes(이하 &quot;서비스&quot;)는 내부 운영 도구로, Google OAuth를 통해 인증된 사용자만 접근할 수 있습니다.</p>
        <h2 className="font-semibold text-lg">수집하는 정보</h2>
        <p>Google 계정의 이름, 이메일 주소, 프로필 사진을 수집합니다. 이 정보는 사용자 식별 및 서비스 내 표시 목적으로만 사용됩니다.</p>
        <h2 className="font-semibold text-lg">정보의 이용</h2>
        <p>수집된 정보는 서비스 운영 및 사용자 인증 목적으로만 사용되며, 제3자에게 제공되지 않습니다.</p>
        <h2 className="font-semibold text-lg">문의</h2>
        <p>개인정보 관련 문의: gkfkd747@gmail.com</p>
      </div>
    </div>
  );
}
