# ころんり — 커미션 · 캐릭터 분양 공지 사이트

활동명 **ころんり**의 공지 사이트입니다. 커미션 안내 · 캐릭터 분양 안내 · 가격
안내를 정적 페이지로 제공하고, 의뢰인이 직접 접수 상태 · 공지 · 가격 · 샘플
이미지를 갱신할 수 있는 **관리자 페이지(GitHub 기반 CMS)** 를 포함합니다.
Vite + 순수 HTML/CSS/최소 Vanilla JS로 구성되며 프레임워크는 사용하지 않습니다.

## 페이지 구성

| 파일 | 설명 | 언어 |
|---|---|---|
| `index.html` | 커미션 안내 · 메인 랜딩 | 한국어 |
| `adoption.html` | 캐릭터 분양 안내 | 한국어 |
| `pricing.html` | 타입별 가격 · 옵션 (관리자 갱신) | 한국어 |
| `index-ja.html` | 커미션 안내 (일본어) | 日本語 |
| `adoption-ja.html` | 분양 안내 (일본어) | 日本語 |
| `pricing-ja.html` | 가격 안내 (일본어) — 같은 데이터, 일본어 표기 | 日本語 |
| `admin.html` | 관리자 CMS (접수상태 · 공지 · 가격 · 이미지) | 한국어 · `noindex` |

한국어 ↔ 일본어는 상단 내비의 `日本語` / `한국어` 스위치로 이동합니다.

## 배포된 사이트

`main`에 push하면 GitHub Actions가 빌드 후 GitHub Pages에 자동 배포합니다.

- 커미션: https://koronri.github.io/koronri/
- 분양: https://koronri.github.io/koronri/adoption.html
- 가격: https://koronri.github.io/koronri/pricing.html
- 관리자: https://koronri.github.io/koronri/admin.html

## 실행 방법

> ⚠️ 이제 `index.html`을 `file://`로 직접 열면 **동작하지 않습니다.** 전역 공지
> 배너(`src/site-banner.js`)와 가격 페이지가 ES 모듈 + `fetch()`로 `data/`를
> 읽기 때문에 로컬 서버 또는 빌드 결과가 필요합니다.

```bash
npm install          # 의존성 설치 (Vite만)
npm run dev          # 개발 서버 (권장) — http://localhost:5173
npm run build        # 프로덕션 빌드 → dist/
npm run preview      # 빌드 결과 미리보기
```

빌드 결과 `dist/`에는 모든 페이지 · 이미지 · `data/` · `404.html`이 포함됩니다.

## 관리자 페이지 (`admin.html`)

의뢰인이 코드 없이 **접수 상태 · 공지(한·일) · 가격·옵션(한·일) · 샘플 이미지**를
수정하는 페이지입니다. 저장하면 GitHub에 커밋되고 Actions가 1~2분 내 재배포합니다.
(검색 노출 방지를 위해 `noindex` 처리)

인증은 두 방식 중 하나로 동작합니다.

- **토큰 방식 (기본)** — 관리자가 GitHub 토큰을 한 번 입력하면 그 브라우저에만
  저장됩니다. 발급 절차는 `admin.html` 화면 안에 단계별로 안내돼 있습니다.
- **비밀번호 방식 (선택)** — Cloudflare Worker를 두어 토큰을 서버 secret으로 숨기고,
  관리자는 **비밀번호만** 입력합니다. 설정은 [`server/README.md`](server/README.md)
  참고. (`admin.html`의 `WORKER_URL` 한 줄로 전환)

> 🔐 토큰·비밀번호는 코드·저장소·문서·채팅에 절대 넣지 마세요. 오직 관리자 페이지
> 입력창에만 입력합니다. 토큰은 최소 권한(Contents: Read/write)으로 발급하고,
> 불필요해지면 GitHub에서 폐기(rotate)하세요.

## 파일 구조

```text
/
├─ index.html / adoption.html / pricing.html   # 한국어 페이지
├─ index-ja.html / adoption-ja.html            # 일본어 페이지
├─ admin.html                                  # 관리자 CMS (noindex)
├─ 404.html                                     # 브랜드 404 (절대경로 자체완결)
├─ package.json
├─ vite.config.js          # 다중 페이지 입력 6개 + base './'
├─ src/
│  ├─ styles.css           # 디자인 시스템 · 반응형 · 접근성 · 인쇄용 스타일
│  └─ site-banner.js       # 전역 접수상태/공지 배너 (data/pricing.json 구독)
├─ data/
│  ├─ pricing.json         # 상태·공지·가격·옵션·샘플이미지 경로 (관리자가 수정)
│  └─ images/              # 샘플/업로드 이미지
├─ images/                 # 페이지 일러스트 (상대경로 참조)
├─ scripts/
│  └─ postbuild.mjs        # MPA 링크 정리 + data/·404.html 복사
├─ server/                 # (선택) 비밀번호 방식용 Cloudflare Worker — 배포 안 하면 미사용
│  ├─ worker.js
│  ├─ wrangler.toml
│  └─ README.md            # 배포 가이드
└─ .github/workflows/
   └─ deploy.yml           # GitHub Pages 자동 배포
```

> `server/`는 사이트 빌드/배포(`dist/`)에 포함되지 않습니다. GitHub Pages에는
> 영향이 없고, 비밀번호 방식을 쓸 때만 별도로 Cloudflare에 배포합니다.

## `data/pricing.json` 스키마

이름·가격·안내문구는 **한국어(`name`/`price`/`note`) + 일본어(`nameJa`/
`priceJa`/`noteJa`)** 를 함께 담습니다. 일본어 페이지는 일본어 값을 우선 쓰고,
비어 있으면 한국어 값으로 자동 대체(fallback)합니다.

```jsonc
{
  "updatedAt": "2026-08-08",
  "status": "PREPARING",         // OPEN | CLOSED | PREPARING
  "announcement": "",            // 한국어 배너 문구 (비우면 기본/숨김)
  "announcementJa": "",          // 일본어 배너 문구
  "note": "가격은 …",            // 가격 페이지 상단 안내 (한국어)
  "noteJa": "料金は …",          // 가격 페이지 상단 안내 (일본어)
  "categories": [
    {
      "name": "코론타입 · LD 풀채색",
      "nameJa": "コロンタイプ・LDフルカラー",
      "image": "./data/images/sample-koron.jpg",
      "items": [
        { "name": "전신", "nameJa": "全身", "price": "₩000,000", "priceJa": "0,000円〜" }
      ]
    }
  ],
  "options": [
    { "name": "추가 캐릭터", "nameJa": "人物追加", "price": "+₩00,000", "priceJa": "+0,000円〜" }
  ]
}
```

- `pricing.html`(한국어)는 `name`/`price`/`note`를, `pricing-ja.html`(일본어)는
  `nameJa`/`priceJa`/`noteJa`(없으면 한국어)로 렌더링합니다.
- 관리자 페이지에서 각 항목의 한국어/일본어 이름·가격을 한 화면에서 입력합니다.
- `src/site-banner.js`가 `status`/`announcement`를 읽어 전 페이지 상단 배너와
  `[data-site-status]` 배지에 한/일 로컬라이즈하여 반영합니다.

## 이미지 매핑 (페이지 일러스트)

`images/`의 웹용 최적화 이미지를 `./images/…` 상대 경로로 참조합니다. 빌드 시
`dist/assets/`로 복사되며 링크가 자동 재작성됩니다.

| 파일 | 사용 위치 |
|---|---|
| `illustration-01.jpg` | 분양 대표 (`adoption.html`) |
| `illustration-07.jpg` | 분양 보조 (`adoption.html`) |
| `illustration-12.jpg` | 커미션 가로 (`index.html`) |
| `illustration-13.jpg` | 커미션 메인 대표 (`index.html`) |
| `illustration-14.jpg` | 커미션 세로 (`index.html`) |

## 확정 정보

- 활동명: ころんり
- X: https://x.com/88xoxox88 (주 문의 수단)
- YouTube: https://www.youtube.com/@qXoX-999p
- 이메일 문의: `mailto:` 버튼으로 연결

## 접근성 · 반응형 · 품질

- `lang` 지정, 페이지별 단일 `h1`, 시맨틱 `header/nav/main/section/footer`
- skip link, `:focus-visible`, 외부 링크 새 탭 안내(스크린리더용)
- `prefers-reduced-motion` 대응, 색상만으로 상태 전달하지 않음
- 모바일 햄버거 드로어 내비, 320~1920px 가로 overflow 없음
- 일본어 페이지는 `word-break: normal`로 오버플로 방지
- 파비콘(인라인 SVG), 브랜드 `404.html`, `@media print` 인쇄용 스타일 포함
- JS 없이도 내비게이션·본문 이용 가능 (JS는 선택적 향상)

## 기술 참고

- 빌드는 **Vite 4**를 사용합니다. (개발 환경에서 Rollup 4 네이티브 바이너리가 OS
  Application Control 정책에 차단되어 순수 JS Rollup 3 기반 Vite 4로 고정. 정책이
  없는 환경이라면 상위 버전으로 올려도 됩니다.)
- 웹폰트 Pretendard는 `styles.css`에서 자체 호스팅(`@font-face`)으로 로드합니다.
