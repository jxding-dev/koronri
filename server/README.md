# 관리자 저장 프록시 (Cloudflare Worker) — 선택 사항

`admin.html`이 GitHub 토큰을 직접 들고 있는 대신, **토큰을 이 Worker에 숨기고
관리자는 비밀번호만 입력**하게 만드는 서버리스 프록시입니다.

- 안 써도 됩니다. 이걸 배포하지 않으면 `admin.html`은 기존처럼 **토큰 방식**으로
  동작합니다. (토큰은 브라우저 localStorage에 한 번 저장되면 계속 유지됩니다.)
- 배포하면 관리자는 **비밀번호 1개**만 기억하면 되고, 토큰은 어느 브라우저에도
  남지 않습니다.

## 무엇이 필요한가

- Cloudflare 계정 (무료)
- GitHub Fine-grained PAT (Repository: `koronri/koronri`, Contents: Read/write)
- 관리자에게 알려줄 비밀번호(자유롭게 정함)

## 배포 방법

```bash
cd server
npx wrangler login                       # 브라우저로 Cloudflare 로그인
npx wrangler secret put GITHUB_TOKEN     # 프롬프트에 PAT 붙여넣기
npx wrangler secret put ADMIN_PASSWORD   # 프롬프트에 원하는 비밀번호 입력
npx wrangler deploy
```

배포가 끝나면 `https://koronri-admin.<계정>.workers.dev` 형태의 URL이 출력됩니다.

## admin.html 연결

`admin.html` 상단 스크립트의 상수 한 줄만 바꾸면 됩니다.

```js
var WORKER_URL = 'https://koronri-admin.<계정>.workers.dev'; // 배포한 Worker URL
```

- 비워 두면 → **토큰 방식** (기본)
- URL을 넣으면 → **비밀번호 방식** (관리자는 비밀번호만 입력)

커밋/푸시하면 1~2분 뒤 반영됩니다.

## 동작 원리 · 보안

- 관리자 페이지는 저장/업로드 시 `WORKER_URL`로 `{ password, ... }`를 POST합니다.
- Worker가 비밀번호를 확인하고, 자신이 가진 GitHub 토큰으로 커밋합니다.
- **토큰은 Cloudflare secret에만 존재**하고 브라우저·저장소·이 코드 어디에도
  노출되지 않습니다. (이 폴더의 코드는 토큰을 담지 않습니다.)
- 가격 데이터 읽기는 인증이 필요 없어 공개 `data/pricing.json`을 그대로 불러옵니다.

> ⚠️ 이 Worker는 **공개 엔드포인트**입니다. 보호 수단은 비밀번호 하나이고 별도
> 요청 제한(rate limit)은 없습니다. 반드시 다음을 지키세요.
>
> - **길고 추측 어려운 비밀번호**를 쓰세요(무작위 16자 이상 권장). 짧으면 무차별
>   대입에 취약합니다.
> - 원하면 출처를 좁힐 수 있습니다: `npx wrangler secret put ALLOWED_ORIGIN` 에
>   `https://koronri.github.io` 를 넣으면 그 출처의 브라우저 요청만 CORS 허용됩니다.
>   (단, 서버-대-서버 호출은 CORS로 막히지 않으므로 근본 보호는 비밀번호 강도입니다.)

## 비밀번호·토큰 교체

- 비밀번호 변경: `npx wrangler secret put ADMIN_PASSWORD` 다시 실행
- 토큰 교체: `npx wrangler secret put GITHUB_TOKEN` 다시 실행
- 재배포 불필요 (secret은 즉시 반영)
