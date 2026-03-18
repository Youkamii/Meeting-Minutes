import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

// Safety check: require --force flag to prevent accidental production runs
if (!process.argv.includes("--force")) {
  console.error("⚠ This script deletes ALL existing data before importing.");
  console.error("  Run with --force to confirm: npx tsx prisma/import-excel.ts --force");
  process.exit(1);
}

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL or DIRECT_URL is required");
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool as unknown as ConstructorParameters<typeof PrismaPg>[0]);
const prisma = new PrismaClient({ adapter });

// Stage mapping from Excel columns to DB enum
const STAGE_MAP: Record<string, string> = {
  "Inbound(초도미팅)": "inbound",
  Funnel: "funnel",
  PipeLine: "pipeline",
  "제안": "proposal",
  "계약": "contract",
  "구축": "build",
  "유지보수": "maintenance",
};

// Excel data parsed from 신사업담당_사업관리_3월3주차.xlsx
const rows = [
  {
    visibility: "public",
    company: "발카코리아",
    business: "",
    timing: "",
    scale: null,
    stages: {},
  },
  {
    visibility: "public",
    company: "화승",
    business: "",
    timing: "",
    scale: null,
    stages: {},
  },
  {
    visibility: "public",
    company: "토스페이먼츠",
    business: "토스페이먼츠 SAP S/4HANA 전환 PI",
    timing: "",
    scale: 4.0,
    stages: {
      proposal: "(01/26) SAP전환 구축 PI/마스터플랜 수립 RFP 수령",
    },
  },
  {
    visibility: "public",
    company: "NH정보시스템",
    business: "NH정보시스템 업무포탈",
    timing: "",
    scale: 15.0,
    stages: {
      inbound:
        "(02/03) 일정 변경 및 업무 범위 협의 미팅",
      funnel:
        "(01/29) RFP 수령, 디자인센터 참여 여부 검토",
      pipeline:
        "(01/21) 구축범위 미팅, 에스코어 주계약자 - 콘소여부 결정",
    },
  },
  {
    visibility: "public",
    company: "한국정보인증",
    business: "전사 IT 진단 및 IT 전략과제",
    timing: "",
    scale: 5.5,
    stages: {
      inbound:
        "(12/15) 고객사 초도 미팅 후 아이티에스와 콘소 형태로 사업, 향후 차세대 구축사업 파트너십 가능 여부 타진중",
      funnel: `(12/17) 고객 미팅 통하여 사업 내용 확인
12/23일 까지 개략적 예산 정보 제공
26년 1월 초 RFP 구성을 위한 고객 W/S 진행 예정
26년 1월말 까지 RFP 작성 지원`,
      pipeline: `(01/06) 사전질의서 발송, 1월 7일 워크샵
(12/29) 12월 30일까지 사전질의서 발송 예정, 12월 31일 I사와 1월 7일 워크샵 선행회의
(12/23) 가견적 포함 제언자료 발송 (2025.12.23). RFP 작성지원 워크샵 자료준비
(12/19) 제언자료 준비 및 발송 (차주) 예정. RFP 자료준비지원 워크샵 일정조율 (1월 7일 수요일 확정)`,
      proposal: `(02/04) 2월6일 가격제안서 제출 관련해서 아이티스정보통신에서 자료 전달
(01/14) 1월30일 2차 제안서 및 RFP 초안 전달`,
    },
  },
  {
    visibility: "public",
    company: "무신사",
    business: "재경 업무 영역 진단",
    timing: "",
    scale: 2.0,
    stages: {
      inbound:
        "(12/22) 무신사 재경 실장 미팅, 고객사 Needs 확인 : (1) 재경 업무 영역 시스템 지원을 원활하도록 할 수 있는 방안, (2) 중국법인 정보를 통합하여 확인 할 수 있는 방안 Next : 12월 중순 CEO 변경으로 인하여 내부 업무 조정 예정 26년 1월 초/중 추가 미팅 통합여 진단 또는 ISP 등 추진 방안 모색과 이슈 도출 위한 W/S 수행 방안 논의 예정",
      funnel:
        "(01/08) CFO/재경실장 Contact, 01/19 주차 추가 미팅 일정 확보 예정",
    },
  },
  {
    visibility: "public",
    company: "퍼시스",
    business: "FCM ERP 구축",
    timing: "",
    scale: 8.0,
    stages: {
      inbound:
        "(12/17) 고객사 VP (CIO) 미팅 하여 Needs 확인/ 12월말 또는 26년 1월 정도 최대한 빠른 시간 내에 솔루션 소개 및 고객 요구사항 논의 진행 요청",
      funnel: `(01/08) VP/총괄팀장 Contact, 01/19 주차 추가 미팅 일정 확보 예정
(12/29) 12월 30일 고객사 미팅 (신사업추진담당)
(12/22) 고객사 시연 일정 협의 완료 (12/30, 오후 3시30분 예정)
(12/19) SAP 클라우드 사업센터와 미팅하여 12월 마지막주차 시연 준비예정 논의`,
    },
  },
  {
    visibility: "public",
    company: "수비올",
    business: "수비올 IT 시스템 운영",
    timing: "",
    scale: 1.5,
    stages: {
      inbound:
        "(12/09) 신사업담당 통한 신규 사업 기회 확보\n현행 타사 에서 유지보수 계약 진행 중이긴 하나, 인력 이슈 및 운영 이슈 발생 예상되어 26년 중 고객사에서 이슈 제기 되는 경우 (발생 가능성 높음) 대체 수행사로 투입 하는 방안 모색 중",
      funnel:
        "(01/08) 라이선스와 운영 업무 구분하여 라이선스 영역 우선 전환을 유도하기 위하여 고객 컨택 중 (기존 운영사인 dkt는 현재 PCE A&O 요건 미달 상황 도래)",
    },
  },
  {
    visibility: "public",
    company: "유진ITS",
    business: "유진그룹 차세대 ERP 구축을 위한 PI",
    timing: "",
    scale: 4.0,
    stages: {
      inbound:
        "(12/8) 신사업담당 통한 신규 사업 기회 확보\n유진ITS CEO 통화 결과 내부 보고 완료되었으나, 26년초에 진행될 것으로 예상",
      funnel:
        "(01/08) CEO Contact, 01/19 주차 추가 미팅 일정 확보 예정",
    },
  },
  {
    visibility: "public",
    company: "서울반도체",
    business: "서울반도체 SAP / MES ITO",
    timing: "",
    scale: 20.0,
    stages: {
      inbound:
        "(12/2) 신사업담당 통한 신규 사업 기회 확보",
      funnel:
        "(12/8) 고객사 주요 Contact Point (VP) 해외 일정으로 인하여 26년 1월 중 세부 미팅 진행 예정",
    },
  },
  {
    visibility: "public",
    company: "(주)유피케미칼",
    business: "전사 IT 진단 및 IT 전략과제",
    timing: "",
    scale: 3.0,
    stages: {
      inbound:
        "(12/26) 1월2주차 방문 미팅 예정. 전사 시스템 진단 및 업무 시스템 구축 과제 수립 필요",
      funnel: `(1/2) 고객 통화, 일정 조정 (1월 27일 또는 28일 방문 일정 확보 중 / 사업 관련 Ref 자료 요청 (인프라 진단, AI 기술 도입 관련) -> 내부 자료 Search 중)`,
      pipeline: `(03/17) 워크샵
(03/13) 워크샵 대비 제언 Agenda 자료 준비(김M)
(1/28) 진단 과제 방향 제언 요청
(1/6) 27일 고객사 방문회의일정 확정, 고객사 요청사항 준비중`,
    },
  },
  {
    visibility: "public",
    company: "루트로닉",
    business: "IT PMI",
    timing: "",
    scale: 15.0,
    stages: {
      inbound:
        "(12/17) 내부 PM프로필 전달, 26년 초 미국 부사장과 미팅 예정",
    },
  },
  {
    visibility: "public",
    company: "CESCO",
    business: "SAP S/4HANA",
    timing: "",
    scale: 15.0,
    stages: {
      inbound:
        "(9/30) 사업부 이관/이태훈매니저 담당_고객사에서 기존 DDA 진행 파일 전달받아, 확인 예정 (추석이후)\n(9/10) ERP솔루션 재검토, SAP FCM L4 기능구성도 및 소개자료 제출(비교용, 이후 미팅예정, SAP DRS 완료)",
    },
  },
  {
    visibility: "public",
    company: "삼성엔지니어링",
    business: "SAP S/4HANA Conversion",
    timing: "",
    scale: 120.0,
    stages: {
      inbound:
        "(8/14) SDS EPC 그룹 미팅, 26년 EPC 계열사 차세대 S/4HANA Conversion 사업구성 방안 논의 - 컨설턴트 중심 소싱/ GDC 대체 ABAP 조직 구성 방향 논의 예정/ SDS 주계약자, GSITM 부계약자 방식으로 사업 수행 논의",
    },
  },
  {
    visibility: "public",
    company: "삼성웰스토리",
    business: "SAP S/4HANA Conversion",
    timing: "",
    scale: 50.0,
    stages: {
      inbound:
        "(8/14) SDS EPC 그룹 미팅, 26년 EPC 계열사 차세대 S/4HANA Conversion 사업구성 방안 논의 - 컨설턴트 중심 소싱/ GDC 대체 ABAP 조직 구성 방향 논의 예정/ SDS 주계약자, GSITM 부계약자 방식으로 사업 수행 논의",
    },
  },
  {
    visibility: "public",
    company: "고려해운",
    business: "해운사 차세대 PI",
    timing: "",
    scale: 30.0,
    stages: {
      inbound:
        "(5/15) 딜로이트 제언작업 - GS 리소스 투입 논의\n(5/7) 딜로이트 콘소 구성, 제언 설명회 진행 (6월)",
    },
  },
  {
    visibility: "public",
    company: "고려해운",
    business: "해운사 차세대시스템 구축",
    timing: "",
    scale: 70.0,
    stages: {
      inbound:
        "(5/7) PI팀 태핑\n(5/14) SI사 협업 구성 태핑",
    },
  },
  {
    visibility: "private",
    company: "BS한양",
    business: "",
    timing: "",
    scale: null,
    stages: {},
  },
  {
    visibility: "public",
    company: "세방리튬베터리",
    business: "",
    timing: "",
    scale: null,
    stages: {
      inbound: "(3/11) 출장, 제언발표",
    },
  },
  {
    visibility: "public",
    company: "네오트랜스",
    business: "",
    timing: "",
    scale: null,
    stages: {},
  },
  {
    visibility: "public",
    company: "한화에어로스페이스",
    business: "",
    timing: "",
    scale: null,
    stages: {},
  },
  {
    visibility: "private",
    company: "카카오페이손해보험",
    business: "",
    timing: "",
    scale: null,
    stages: {},
  },
  {
    visibility: "private",
    company: "아이리스브라이트",
    business: "",
    timing: "",
    scale: null,
    stages: {
      funnel: "4월1,2주 워크샵예정",
    },
  },
  {
    visibility: "public",
    company: "조선선재",
    business: "",
    timing: "",
    scale: null,
    stages: {
      inbound: "(2/13) 초도미팅, 3/6까지 초기견적/제안예정",
      funnel: "(3/6) 제언자료 발송(1안 8천 / 2안 2억 선)",
    },
  },
  {
    visibility: "public",
    company: "인천공항시설관리",
    business: "",
    timing: "",
    scale: null,
    stages: {
      inbound: "(2/23) 초도미팅",
      pipeline: `(3/10) 성장전략실 제안서 작성 협조
- 가설적 AI Use Case 시나리오 작성(이수연 실장 협조: 김M)`,
    },
  },
  {
    visibility: "public",
    company: "히타치하이테크",
    business: "",
    timing: "",
    scale: null,
    stages: {
      inbound: `(2/13) DT본부 자료공유(장순철M)
(3/5) 고객 미팅 진행, AS-IS 청취 및 향후진행일정 논의 / 4월중 업체선정, 4월말 계약목표`,
    },
  },
  {
    visibility: "public",
    company: "이녹스리튬",
    business: "",
    timing: "",
    scale: null,
    stages: {
      inbound:
        "(3/12)양M / 초도미팅 / 기존 CCTV를 활용한 AI분석 솔루션 도입 검토중, 구축형X -> Verkada로 제안 검토",
    },
  },
];

type Stage = "inbound" | "funnel" | "pipeline" | "proposal" | "contract" | "build" | "maintenance";

const STAGE_ORDER: Stage[] = [
  "maintenance",
  "build",
  "contract",
  "proposal",
  "pipeline",
  "funnel",
  "inbound",
];

function determineCurrentStage(stages: Record<string, string>): Stage {
  for (const stage of STAGE_ORDER) {
    if (stages[stage]) return stage;
  }
  return "inbound";
}

async function main() {
  await prisma.$transaction(async (tx) => {
    // 1. Clean all existing data
    console.log("Cleaning existing data...");
    await tx.recentView.deleteMany({});
    await tx.internalNoteVersion.deleteMany({});
    await tx.weeklyActionVersion.deleteMany({});
    await tx.progressItemVersion.deleteMany({});
    await tx.businessVersion.deleteMany({});
    await tx.auditLog.deleteMany({});
    await tx.internalNote.deleteMany({});
    await tx.weeklyAction.deleteMany({});
    await tx.progressItem.deleteMany({});
    await tx.business.deleteMany({});
    await tx.companyAlias.deleteMany({});
    await tx.company.deleteMany({});
    await tx.weeklyCycle.deleteMany({});
    console.log("All data cleaned.");

    // 2. Re-create system user and weekly cycle
    const systemUser = await tx.user.upsert({
      where: { email: "system@meeting-minutes.local" },
      update: {},
      create: {
        email: "system@meeting-minutes.local",
        name: "System",
        role: "admin",
        status: "approved",
      },
    });
    console.log(`System user: ${systemUser.id}`);

    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const d = new Date(
      Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()),
    );
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNumber = Math.ceil(
      ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
    );

    await tx.weeklyCycle.upsert({
      where: { year_weekNumber: { year: now.getFullYear(), weekNumber } },
      update: {},
      create: {
        year: now.getFullYear(),
        weekNumber,
        startDate: monday,
        endDate: sunday,
      },
    });
    console.log(`Weekly cycle: ${now.getFullYear()}-W${weekNumber}`);

    // 3. Import Excel data
    const companyMap = new Map<string, string>();

    let sortOrder = 0;
    for (const row of rows) {
      sortOrder++;

      let companyId = companyMap.get(row.company);
      if (!companyId) {
        const company = await tx.company.create({
          data: {
            canonicalName: row.company,
            isKey: false,
            sortOrder,
            createdById: systemUser.id,
            updatedById: systemUser.id,
            aliases:
              row.company === "수비올"
                ? {
                    create: [
                      { alias: "테크로스 환경서비스" },
                      { alias: "수비올" },
                    ],
                  }
                : undefined,
          },
        });
        companyId = company.id;
        companyMap.set(row.company, companyId);
        console.log(`  Company: ${row.company}`);
      }

      const hasStages = Object.keys(row.stages).length > 0;
      if (row.business || hasStages) {
        const currentStage = determineCurrentStage(
          row.stages as Record<string, string>,
        );
        const business = await tx.business.create({
          data: {
            companyId,
            name: row.business || row.company,
            visibility: row.visibility === "public" ? "public" : "private",
            scale: row.scale != null ? String(row.scale) : null,
            currentStage,
            sortOrder,
            createdById: systemUser.id,
            updatedById: systemUser.id,
          },
        });
        console.log(
          `    Business: ${business.name} [${currentStage}] scale=${row.scale}`,
        );

        let piOrder = 0;
        for (const [stage, content] of Object.entries(row.stages)) {
          if (!content) continue;
          piOrder++;
          await tx.progressItem.create({
            data: {
              businessId: business.id,
              stage: stage as Stage,
              content,
              sortOrder: piOrder,
              createdById: systemUser.id,
              updatedById: systemUser.id,
            },
          });
          console.log(`      Progress [${stage}]: ${content.substring(0, 50)}...`);
        }
      } else {
        console.log(`    (no business data)`);
      }
    }

    console.log("\nImport complete!");
    console.log(`Companies: ${companyMap.size}`);
  }, { timeout: 60000 });
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
