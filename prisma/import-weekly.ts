import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import dotenv from "dotenv";
import { getWeekDateRange } from "../src/lib/weekly-cycle";

dotenv.config({ path: ".env.local" });
const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL or DIRECT_URL is required");

const pool = new pg.Pool({ connectionString });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

// 3월 2주=W10, 3주=W12, 4주=W13, 5주=W14 (2026년 3월 기준)
// Actually let's compute: March 2026 Mondays: 2(W10), 9(W11), 16(W12), 23(W13), 30(W14)
// Excel says: 3월 2주, 3주, 4주, 5주 → these map to W11, W12, W13, W14
const WEEKS = [
  { label: "3월 2주", year: 2026, weekNumber: 11 },
  { label: "3월 3주", year: 2026, weekNumber: 12 },
  { label: "3월 4주", year: 2026, weekNumber: 13 },
  { label: "3월 5주", year: 2026, weekNumber: 14 },
];

type Row = { company: string; tasks: (string | null)[] };

const DATA: Row[] = [
  { company: "한국정보인증", tasks: [
    "특이사항없음\n프로젝트 참여자 프로필 작성 및 제출(성장전략실 고매니저님 취합)",
    "지난 주 프로필 전달 외 다른 추가진행사항 없음",
    null, null
  ]},
  { company: "루미나 마스크", tasks: [
    "기술협상 결과서 작성하기 (양M, DT에 확인)\n3/12(목) 기술협상 결과서 완성, CP 및 견적",
    "엠로(구매시스템) 재견적요청\n고객사측에서는 UniERP 구매모듈 비교견적 요청\n(양M) 차주부터 계약서 챙길것!! -> DT에서 챙기도록 체크\n우선협상 진행 중 - SCOPE 진행 중(RFI 진행 단계)",
    "4/1 계약예정", null
  ]},
  { company: "세방리튬배터리", tasks: [
    "3/11 (주.담, 양M) 출장 및 제언발표",
    "벤치마킹 준비 중\n- 벤치마킹하고 RFP 대응",
    "3월 30-31일 미팅 역삼", null
  ]},
  { company: "퍼시스", tasks: [
    "FCM ERP 구축, 특이사항없음",
    "별도 지시 전까지 대기", null, null
  ]},
  { company: "무신사", tasks: [
    "재경 업무 영역 진단, (양M) 연락해볼것~",
    "이번 주 고객사 담당자 CONTACT (양매니저님)\n4/22 정대철 실장 점심식사 예정",
    null, null
  ]},
  { company: "수비올", tasks: [
    "3/25 (양M) 고객 저녁식사예정",
    "DKT측 MM모듈 신규입사자 투입 안된 것으로 확인",
    null, null
  ]},
  { company: "(주)유피케미칼", tasks: [
    "전사 IT 진단 및 IT 전략과제 워크샵 Agenda 작성\n- 중국계 반도체 소재, 하이닉스 납품업체\n- (김M) 우선 순위 진행예정 (3/17)",
    "17일(화) 참석예정\n- 성장전략실 : 이수연, 정용수, 정유진\n- 신사업추진담당 : 주순제, 양재성\n워크샵 진행 후 추가 ACTION 결정",
    "4월 9일", null
  ]},
  { company: "발카코리아", tasks: [
    "차주 AI 워크숍 Agenda 작성 및 제언 내용 작성\n일본 본사 GSI 추진에 따른 도입 방식 이견\n본사: 전사 시스템 통합을 위해 GSI 기반 Roll-in 방식 요구\n한국 법인: 국내 현지 운영 커스터마이제이션을 위해 Roll-out 형태 희망\n(3/17) - 김문경 매니저",
    "17일(화) 참석예정\n- 성장전략실 : 이수연, 정용수, 정유진\n- 신사업추진담당 : 주순제, 양재성\n3/20, Roll-in, Roll-out 가견적 제출",
    null, null
  ]},
  { company: "인천공항시설관리", tasks: [
    "AI 기반 시설 관리 제안 관련 제안서 제출 완료\n성장전략실 실장님 협조 요청에 따라 제안서 수정 작업 진행\n3/10 (최M) AI 핵심 기술 설명 백업자료 제작 및 기술 지원",
    "이번 주 열원 관련 프로토타입 및 추가 진행 사항\n- 주담당님 지시: 신성장전략실 협조 요청 시 협조 진행",
    "3/30 보고", null
  ]},
  { company: "GS 엠비즈", tasks: [
    "워크숍 진행 (김문경 참석), Solution 해결방안 텍스트 정리\n- SAP 전환 니즈 있음, 칼텍스 메일 포워딩 확인\n- HOLDING (3/18) - 김문경 매니저",
    "18일(수) 워크샵 참석\n- 성장전략실 : 이수연 실장, 정유진 매니저\n- 신사업추진담당 : 주순제 담당, 김문경 매니저\n- 회의록 작성 및 공유 완료 (김문경 매니저)",
    null, null
  ]},
  { company: "대한제분", tasks: [
    "SAP 업그레이드 프로젝트 제안 참여 결정\n- RFP 검토 결과 내용 광범위함\n- 제조업 특성상 공장 프로세스 파악 중요\n- 공정별 원가 또는 개별 원가 여부 검토 필요",
    "SAP사업본부에서 주도하기로\n담당님 지시사항: 관련 자료 수시 리뷰\n- RFP 중심으로 재무관련 자료 모니터링 (김문경 매니저)\n- 데일리 진척도 확인 (최혁 매니저)",
    null, null
  ]},
  { company: "히타치하이테크", tasks: [
    "3/10, 3/11 (최M) 요구사항 분석 및 설계, 프로토타이핑\n제언서 리뷰 진행: 3/12 (주담당님, 이광영M, 김문경M)\n주담당님: 명목상 제언서, 실질적으로 제안서 수준으로 진행",
    "3/18 오전 제언서 자료 작성 및 리뷰\n3/19 제언 발송 예정\n양M, 장순철M과 소통, 공수산정(3/17까지)\n제언 전 사업성 검토\n제언 발송 전 주담당님 리뷰 (3/19 수, 10시)",
    "제안서는 제출, 고객 피드백 확인", null
  ]},
  { company: "조선선재", tasks: [
    "(양M) 정민수 책임 컨텍 -> 당사포함 최소 5개사 비교검토\n당사 1안에 관심, MA요율 20% 통보",
    "추가 수신한 특이사항 없음\n(3/19) 숏리스트에 포함됐다고 회신받음, 4월중 최종의사결정예정",
    null, null
  ]},
  { company: "아이리스브라이트", tasks: [
    null,
    "4월 PI 진행 예정 (관련 진단 검토 예정)\n- 필요 시 SAP 사업본부 협업 예정",
    null, null
  ]},
  { company: "이녹스리튬", tasks: [
    "(3/12) 기존 CCTV를 활용한 AI분석 솔루션 도입 검토중\n구축형X -> Verkada로 제안 검토",
    "(3/23) Verkada 소개 및 시연 예정, PoC도 병행 진행검토\n(3/23) 시연 회사 소개: 양매니저님 진행",
    "3/27(금) 초도 견적예정\n- 고객예산 5천만원 -> 충분한 예산확보 가능토록 영업\n- PoC 유도 및 예산범위내 도입가능범위 추가 안내",
    null
  ]},
  { company: "신한다이아몬드", tasks: [
    null,
    "1. (3/24 이전) SAP 업그레이드 가견적 제출\n2. (3/19~20) 2차 워크샵 자료 사전 공유\n3. (3/24) 제조 현장 책임자 2차 미팅\n4. (5월 목표) 중국 신규 법인 롤아웃 대응\n※ SAP 사업본부 자료 수신하면 진행\n(3/19) SAP EHP 업그레이드 견적송부 - 6.9억",
    null, null
  ]},
  { company: "한국공항공사", tasks: [
    "(3/19) 미팅 예정",
    "회사명 Embargo", null, null
  ]},
  { company: "서울반도체", tasks: [
    null, "후순위 진행", "이상무 부사장 국내 체류중", null
  ]},
  { company: "유진그룹", tasks: [
    null,
    "PI방법론 및 유진ITS W/S 자료 세부 검토 (3/19)\nPI 관련 부서 미팅 진행 (3/20)\n유진ITS 워크샵 참석 (3/20 오후)",
    null, null
  ]},
  { company: "성지제강그룹", tasks: [null, null, null, null] },
];

async function main() {
  // 1. Delete existing weekly actions (and related versions/notes first)
  await prisma.weeklyActionVersion.deleteMany({});
  await prisma.internalNote.deleteMany({ where: { ownerType: "weekly_action" } });
  const deleted = await prisma.weeklyAction.deleteMany({});
  console.log(`Deleted ${deleted.count} existing weekly actions`);

  // 2. Ensure cycles exist
  const cycleMap = new Map<number, string>();
  for (const w of WEEKS) {
    const { startDate, endDate } = getWeekDateRange(w.year, w.weekNumber);
    const cycle = await prisma.weeklyCycle.upsert({
      where: { year_weekNumber: { year: w.year, weekNumber: w.weekNumber } },
      update: {},
      create: { year: w.year, weekNumber: w.weekNumber, startDate, endDate },
    });
    cycleMap.set(w.weekNumber, cycle.id);
    console.log(`Cycle ${w.label} (W${w.weekNumber}): ${cycle.id}`);
  }

  // 3. Ensure companies exist & get IDs
  const companyMap = new Map<string, string>();
  for (const row of DATA) {
    let company = await prisma.company.findFirst({
      where: { canonicalName: { equals: row.company, mode: "insensitive" } },
    });
    if (!company) {
      company = await prisma.company.create({
        data: { canonicalName: row.company },
      });
      console.log(`Created company: ${row.company}`);
    }
    companyMap.set(row.company, company.id);
  }

  // 4. Insert actions
  let inserted = 0;
  for (const row of DATA) {
    const companyId = companyMap.get(row.company)!;
    for (let i = 0; i < WEEKS.length; i++) {
      const content = row.tasks[i];
      if (!content) continue;
      const cycleId = cycleMap.get(WEEKS[i].weekNumber)!;
      await prisma.weeklyAction.create({
        data: {
          cycleId,
          companyId,
          content,
          status: "scheduled",
          priority: "medium",
        },
      });
      inserted++;
    }
  }

  console.log(`\nInserted ${inserted} weekly actions for ${DATA.length} companies across ${WEEKS.length} weeks`);
}

main()
  .then(() => { prisma.$disconnect(); pool.end(); })
  .catch((e) => { console.error(e); prisma.$disconnect(); pool.end(); process.exit(1); });
