// ============================================================
//  koronri-admin — 비밀번호 기반 관리자 저장 프록시 (Cloudflare Workers)
// ------------------------------------------------------------
//  admin.html 이 GitHub 토큰을 직접 들고 있지 않도록, 토큰을 이 Worker 의
//  "비밀(secret)" 로 숨기고, 관리자는 간단한 비밀번호만 입력하게 한다.
//
//  필요한 secret (배포 후 등록):
//    npx wrangler secret put GITHUB_TOKEN     ← Fine-grained PAT (Contents R/W)
//    npx wrangler secret put ADMIN_PASSWORD   ← 관리자가 admin.html 에 입력할 비밀번호
//
//  엔드포인트 (모두 POST, JSON 본문에 password 필수):
//    /verify  {password}                       → 비밀번호 확인
//    /save    {password, content}              → data/pricing.json 커밋
//    /upload  {password, contentBase64}        → data/images/upload-*.jpg 커밋
// ============================================================

const OWNER = 'jxding-dev';
const REPO = 'commission';
const BRANCH = 'main';
const PRICING_PATH = 'data/pricing.json';

function corsHeaders(origin, env) {
  // ALLOWED_ORIGIN secret 을 지정하면 그 출처만 허용(권장). 없으면 요청 출처를 반영.
  var allow = (env && env.ALLOWED_ORIGIN) || origin || '*';
  return {
    'Access-Control-Allow-Origin': allow,
    Vary: 'Origin',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

function reply(obj, status, cors) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json', ...cors },
  });
}

function gh(env, path, init) {
  return fetch('https://api.github.com/repos/' + OWNER + '/' + REPO + '/' + path, {
    ...(init || {}),
    headers: {
      Authorization: 'Bearer ' + env.GITHUB_TOKEN,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'koronri-admin-worker',
      ...((init && init.headers) || {}),
    },
  });
}

// UTF-8 안전 base64 (한국어/일본어 JSON 대응)
function toB64(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const cors = corsHeaders(origin, env);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return reply({ error: 'method_not_allowed' }, 405, cors);

    let body;
    try {
      body = await request.json();
    } catch {
      return reply({ error: 'bad_json' }, 400, cors);
    }

    // 비밀번호 검증 (모든 요청 공통)
    if (!env.ADMIN_PASSWORD || String(body.password || '') !== String(env.ADMIN_PASSWORD)) {
      return reply({ error: 'unauthorized' }, 401, cors);
    }

    const path = new URL(request.url).pathname;

    if (path.endsWith('/verify')) {
      return reply({ ok: true }, 200, cors);
    }

    if (path.endsWith('/save')) {
      if (typeof body.content !== 'string') return reply({ error: 'no_content' }, 400, cors);
      let sha;
      const cur = await gh(env, 'contents/' + PRICING_PATH + '?ref=' + BRANCH);
      if (cur.ok) sha = (await cur.json()).sha;
      const put = await gh(env, 'contents/' + PRICING_PATH, {
        method: 'PUT',
        body: JSON.stringify({
          message: 'chore(admin): 사이트 콘텐츠 업데이트',
          content: toB64(body.content),
          sha,
          branch: BRANCH,
        }),
      });
      if (!put.ok) return reply({ error: 'save_failed', detail: await put.text() }, 502, cors);
      const j = await put.json();
      return reply({ ok: true, sha: j.content && j.content.sha }, 200, cors);
    }

    if (path.endsWith('/upload')) {
      if (typeof body.contentBase64 !== 'string') return reply({ error: 'no_image' }, 400, cors);
      const imgPath = 'data/images/upload-' + Date.now() + '.jpg';
      const put = await gh(env, 'contents/' + imgPath, {
        method: 'PUT',
        body: JSON.stringify({
          message: 'chore(admin): 샘플 이미지 업로드',
          content: body.contentBase64,
          branch: BRANCH,
        }),
      });
      if (!put.ok) return reply({ error: 'upload_failed', detail: await put.text() }, 502, cors);
      return reply({ ok: true, path: './' + imgPath }, 200, cors);
    }

    return reply({ error: 'not_found' }, 404, cors);
  },
};
