// 실행: npm i express socket.io  →  node server.js  →  http://localhost:3000
const path = require('path');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
app.get('/', (_, res) => res.sendFile(path.join(__dirname, 'index.html')));

const QUESTION_SEC = 15, REVEAL_SEC = 6, WIN_POINTS = 5;

// 문제 은행 (단원 주제에 맞춰 직접 만든 문제입니다. 교과서 원문이 아닙니다.)
// c: 단원, q: 문제, o: 보기, a: 정답 번호(0~3), e: 해설
const QS = [
  { c: '요약하며 읽기', q: '글을 요약할 때 가장 먼저 해야 할 일은?', o: ['글의 중심 내용 파악하기', '모든 문장 옮겨 적기', '예시만 골라 적기', '감상 쓰기'], a: 0, e: '요약은 중심 내용을 파악하는 것에서 시작합니다.' },
  { c: '요약하며 읽기', q: '글을 요약할 때 지워도 되는 내용은?', o: ['중심 문장', '반복되는 내용', '핵심어', '글 전체의 주제'], a: 1, e: '반복되거나 중요하지 않은 내용은 삭제합니다.' },
  { c: '요약하며 읽기', q: "'사과, 배, 포도'를 '과일'로 묶어 쓰는 요약 방법은?", o: ['삭제', '선택', '일반화', '나열'], a: 2, e: '여러 대상을 포괄하는 말로 묶는 것이 일반화입니다.' },
  { c: '요약하며 읽기', q: '요약하며 읽기의 효과로 알맞은 것은?', o: ['글의 내용을 늘려 쓸 수 있다', '글의 핵심을 파악하고 기억하기 쉽다', '글쓴이의 생각을 바꿀 수 있다', '글을 빨리 덮을 수 있다'], a: 1, e: '요약하면 핵심을 파악하고 오래 기억할 수 있습니다.' },
  { c: '품사', q: '사물이나 사람의 이름을 나타내는 품사는?', o: ['동사', '형용사', '명사', '부사'], a: 2, e: '이름을 나타내는 말은 명사입니다.' },
  { c: '품사', q: '다음 중 동사인 것은?', o: ['예쁘다', '먹다', '아주', '새'], a: 1, e: '동작을 나타내는 말은 동사입니다.' },
  { c: '품사', q: "'새 신발'에서 '새'의 품사는?", o: ['형용사', '관형사', '부사', '명사'], a: 1, e: '체언 앞에서 꾸며 주며 모양이 변하지 않는 말은 관형사입니다.' },
  { c: '품사', q: "'꽃이 피었다'에서 '이'의 품사는?", o: ['명사', '동사', '조사', '부사'], a: 2, e: "체언 뒤에 붙어 문장 성분을 나타내는 '이'는 조사입니다." },
  { c: '토의', q: '토의의 목적으로 가장 알맞은 것은?', o: ['상대를 이기는 것', '문제의 해결 방안을 함께 찾는 것', '내 주장만 관철하는 것', '잘잘못을 따지는 것'], a: 1, e: '토의는 함께 의견을 모아 최선의 방안을 찾는 활동입니다.' },
  { c: '토의', q: '찬성과 반대로 나뉘어 논리를 겨루는 말하기는?', o: ['토의', '토론', '발표', '면담'], a: 1, e: '찬반 입장으로 나뉘어 논리를 겨루는 것은 토론입니다.' },
  { c: '토의', q: '토의에 참여하는 바람직한 태도는?', o: ['큰 소리로 말하기', '끝까지 듣고 의견 존중하기', '의견 무시하기', '주제와 다른 이야기하기'], a: 1, e: '경청하고 존중하는 태도가 필요합니다.' },
  { c: '토의', q: '토의 절차에서 가장 먼저 하는 일은?', o: ['해결 방안 결정하기', '문제 확인하기', '실천 점검하기', '의견 조정하기'], a: 1, e: '문제 확인 → 의견 마련 → 의견 조정 → 결정 순서입니다.' },
  { c: '갈등', q: '이야기 속 인물이 겪는 대립이나 충돌을 무엇이라 하나요?', o: ['갈등', '배경', '결말', '주제'], a: 0, e: '인물 사이 또는 마음속의 충돌이 갈등입니다.' },
  { c: '갈등', q: '인물이 자기 마음속에서 겪는 갈등은?', o: ['외적 갈등', '내적 갈등', '사회적 갈등', '자연과의 갈등'], a: 1, e: '마음속의 갈등은 내적 갈등입니다.' },
  { c: '갈등', q: '인물이 다른 인물이나 사회와 부딪히며 생기는 갈등은?', o: ['외적 갈등', '내적 갈등', '독자와의 갈등', '글자의 갈등'], a: 0, e: '인물 밖에서 생기는 갈등은 외적 갈등입니다.' },
  { c: '갈등', q: '이야기 구성 단계 중 갈등이 가장 크게 높아지는 단계는?', o: ['발단', '전개', '절정', '결말'], a: 2, e: '갈등이 최고조에 이르는 단계는 절정입니다.' },
  { c: '정보 전달 글쓰기', q: '정보를 전달하는 글에서 가장 중요한 것은?', o: ['감정 과장하기', '정확하고 객관적인 내용', '개인적 추측', '광고 문구'], a: 1, e: '정보 전달 글은 정확하고 객관적이어야 합니다.' },
  { c: '정보 전달 글쓰기', q: '정보 전달 글쓰기의 첫 단계는?', o: ['고쳐 쓰기', '글의 목적·독자·주제 정하기', '제목만 쓰기', '글 발표하기'], a: 1, e: '쓰기 전에 목적, 독자, 주제를 정합니다.' },
  { c: '정보 전달 글쓰기', q: '글에 활용하기 알맞은 자료는?', o: ['출처를 알 수 없는 소문', '출처가 분명한 자료', '친구의 추측', '근거 없는 댓글'], a: 1, e: '출처가 분명하고 믿을 수 있는 자료를 사용합니다.' },
  { c: '정보 전달 글쓰기', q: '두 대상의 공통점과 차이점을 견주어 설명하는 방법은?', o: ['정의', '예시', '비교와 대조', '분류'], a: 2, e: '견주어 설명하는 방법이 비교와 대조입니다.' },
  // ---- 고난도 객관식 (d: 난이도) ----
  { d: '고난도', c: '품사', q: "'그는 아주 새 자전거를 샀다.'에서 관형사는?", o: ['그는', '아주', '새', '샀다'], a: 2, e: "'새'는 체언 '자전거'를 꾸미는 관형사이고, '아주'는 부사입니다." },
  { d: '고난도', c: '품사', q: '다음 중 품사가 다른 하나는?', o: ['크다', '작다', '달리다', '예쁘다'], a: 2, e: '나머지는 형용사이고 달리다는 동사입니다.' },
  { d: '고난도', c: '품사', q: '다음 중 감탄사는?', o: ['아이고', '바로', '모든', '그리고'], a: 0, e: "'바로·그리고'는 부사, '모든'은 관형사입니다." },
  { d: '고난도', c: '품사', q: "'어제 읽은 책이 재미있다'에서 '재미있다'의 품사는?", o: ['동사', '형용사', '명사', '부사'], a: 1, e: '상태나 성질을 나타내므로 형용사입니다.' },
  { d: '고난도', c: '요약하며 읽기', q: '다음 중 요약하기 규칙에 어긋나는 것은?', o: ['중요하지 않은 내용 삭제하기', '비슷한 내용 묶기', '내 의견을 덧붙여 쓰기', '중심 내용 선택하기'], a: 2, e: '요약에는 글쓴이의 생각만 담고 내 의견은 덧붙이지 않습니다.' },
  { d: '고난도', c: '토의', q: '의견이 서로 다를 때 토의에서 가장 알맞은 태도는?', o: ['다수결로 바로 끝내기', '각 의견의 장단점을 비교해 절충안 찾기', '목소리 큰 사람 따르기', '의견을 내지 않기'], a: 1, e: '의견을 비교·조정해 더 나은 방안을 찾는 것이 토의입니다.' },
  { d: '고난도', c: '토의', q: '토의 주제로 가장 알맞은 것은?', o: ['우리 반 쓰레기를 줄이는 방법', '라면과 떡볶이 중 무엇이 더 맛있는가', '햇빛은 따뜻하다', '지구는 둥글다'], a: 0, e: '토의는 해결해야 할 문제를 주제로 삼습니다.' },
  { d: '고난도', c: '갈등', q: "'형은 동생과 장난감 때문에 다투었다.'에 나타난 갈등은?", o: ['인물 간의 갈등', '내적 갈등', '인물과 자연의 갈등', '인물과 사회의 갈등'], a: 0, e: '인물과 인물 사이의 갈등입니다.' },
  { d: '고난도', c: '정보 전달 글쓰기', q: '다음 중 정보 전달 글에 가장 알맞은 문장은?', o: ['이 음식은 정말 최고라서 꼭 먹어야 해!', '물은 1기압에서 100℃에 끓는다.', '내 생각에는 아마 그럴 것 같다.', '와, 정말 대단하지 않니?'], a: 1, e: '객관적으로 확인할 수 있는 사실을 쓴 문장입니다.' },
  { d: '고난도', c: '정보 전달 글쓰기', q: "'소설은 꾸며 낸 이야기를 산문으로 쓴 글이다.'에 쓰인 설명 방법은?", o: ['정의', '비교', '예시', '분류'], a: 0, e: "'A는 B이다' 형태로 뜻을 밝히는 방법이 정의입니다." },

  // ---- 주관식 (k: 정답 목록, 띄어쓰기·대소문자 무시) ----
  { c: '품사', q: '체언 뒤에 붙어 다른 말과의 관계를 나타내는 품사는? (두 글자)', k: ['조사'], e: "'이/가, 을/를, 에' 등이 조사입니다." },
  { c: '품사', q: "'먹다', '달리다'처럼 움직임을 나타내는 품사는? (두 글자)", k: ['동사'], e: '움직임을 나타내는 말은 동사입니다.' },
  { c: '품사', q: "'예쁘다', '크다'처럼 성질이나 상태를 나타내는 품사는? (세 글자)", k: ['형용사'], e: '성질·상태를 나타내는 말은 형용사입니다.' },
  { c: '품사', q: "'매우', '빨리'처럼 용언을 꾸며 주는 품사는? (두 글자)", k: ['부사'], e: '주로 용언을 꾸며 주는 말은 부사입니다.' },
  { c: '요약하며 읽기', q: '중요하지 않거나 반복되는 내용을 지우는 요약 방법은? (두 글자)', k: ['삭제'], e: '삭제, 선택, 일반화, 재구성 중 삭제입니다.' },
  { c: '토의', q: '공동의 문제를 해결하려고 여럿이 의견을 나누는 말하기는? (두 글자)', k: ['토의'], e: '문제 해결 방안을 함께 찾는 말하기가 토의입니다.' },
  { c: '갈등', q: "인물의 마음속에서 일어나는 갈등은 '○○ 갈등'입니다. ○○는? (두 글자)", k: ['내적'], e: '마음속 갈등은 내적 갈등입니다.' },
  { c: '갈등', q: "이야기 구성 단계 '발단 - 전개 - 위기 - ○○ - 결말'의 빈칸은? (두 글자)", k: ['절정'], e: '갈등이 가장 높아지는 단계는 절정입니다.' },
  { c: '정보 전달 글쓰기', q: '정보 전달 글에는 믿을 수 있는 ○○가 분명한 자료를 써야 합니다. 빈칸은? (두 글자)', k: ['출처'], e: '자료를 쓸 때는 출처를 확인합니다.' },
  { d: '고난도', c: '품사', q: "'꽃이 활짝 피었다.'에서 부사인 단어를 쓰세요.", k: ['활짝'], e: "'활짝'이 동사 '피었다'를 꾸미는 부사입니다." },
  { d: '고난도', c: '품사', q: "'새 책', '헌 옷'처럼 체언을 꾸며 주고 모양이 변하지 않는 품사는? (세 글자)", k: ['관형사'], e: '체언 앞에서 꾸미는 말은 관형사입니다.' },
  { d: '고난도', c: '품사', q: "'아, 비가 온다!'에서 감탄사인 단어를 쓰세요.", k: ['아'], e: "느낌을 나타내는 '아'가 감탄사입니다." },
  { d: '고난도', c: '정보 전달 글쓰기', q: '대상을 종류별로 나누어 설명하는 방법은? (두 글자)', k: ['분류'], e: '종류에 따라 나누어 설명하는 방법이 분류입니다.' },
];

const norm = (t) => String(t ?? '').replace(/\s+/g, '').toLowerCase();

const users = new Map();   // socket.id -> 닉네임
const rooms = new Map();   // roomId -> room
let seq = 1;

const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const clamp = (v, lo, hi, d) => { v = parseInt(v, 10); return Number.isNaN(v) ? d : Math.min(hi, Math.max(lo, v)); };

const lobbyList = () => [...rooms.values()].filter(r => r.state !== 'end').map(r => ({
  id: r.id, name: r.name, max: r.max, count: r.players.size, state: r.state, minutes: r.minutes,
  host: r.players.get(r.host)?.nick || '',
}));
const pushRooms = () => io.to('lobby').emit('rooms', lobbyList());
const pushRoom = (r) => io.to(r.id).emit('room', {
  id: r.id, name: r.name, max: r.max, minutes: r.minutes, state: r.state, host: r.host,
  players: [...r.players].map(([id, p]) => ({ id, nick: p.nick })),
});

function enter(socket, r) {
  socket.leave('lobby'); socket.join(r.id); socket.data.room = r.id;
  r.players.set(socket.id, { nick: users.get(socket.id), pts: 0, wins: 0, att: 0, cor: 0 });
  pushRoom(r); pushRooms();
}

function leave(socket) {
  const r = rooms.get(socket.data.room);
  if (!r) return;
  socket.leave(r.id); socket.data.room = null; r.players.delete(socket.id);
  if (!r.players.size) { clearTimeout(r.timer); rooms.delete(r.id); }
  else { if (r.host === socket.id) r.host = r.players.keys().next().value; pushRoom(r); }
  pushRooms();
  if (users.has(socket.id)) { socket.join('lobby'); socket.emit('rooms', lobbyList()); }
}

function round(r) {
  if (!rooms.has(r.id)) return;
  const ids = [...r.players.keys()];
  if (Date.now() >= r.endAt || ids.length < 2) return finish(r);

  // 랜덤 1:1 매칭 (직전 라운드와 같은 상대는 최대한 피함)
  let best = null, bestRep = Infinity;
  for (let t = 0; t < 30; t++) {
    const s = shuffle(ids), pairs = []; let rep = 0;
    for (let i = 0; i + 1 < s.length; i += 2) {
      pairs.push([s[i], s[i + 1]]);
      if (r.last.has([s[i], s[i + 1]].sort().join('|'))) rep++;
    }
    if (rep < bestRep) { bestRep = rep; best = { pairs, bye: s.length % 2 ? s[s.length - 1] : null }; }
    if (!rep) break;
  }
  r.last = new Set(best.pairs.map(p => [...p].sort().join('|')));
  r.start = Date.now(); r.match = [];
  best.pairs.forEach(([a, b]) => {
    if (!r.pool.length) r.pool = shuffle(QS.map((_, i) => i));
    const qi = r.pool.pop(), q = QS[qi];
    r.match.push({ a, b, qi, ans: {} });
    [[a, b], [b, a]].forEach(([x, y]) => io.to(x).emit('round', {
      no: r.no, q: { c: q.c, d: q.d || '기본', q: q.q, o: q.o || null }, opp: r.players.get(y).nick, deadline: r.start + QUESTION_SEC * 1000, endAt: r.endAt,
    }));
  });
  if (best.bye) io.to(best.bye).emit('bye', { no: r.no, endAt: r.endAt });
  r.no++;
  r.timer = setTimeout(() => reveal(r), QUESTION_SEC * 1000);
}

function reveal(r) {
  const ms = r.match; r.match = null;
  ms.forEach(m => {
    const q = QS[m.qi], A = r.players.get(m.a), B = r.players.get(m.b);
    const info = (id) => { const x = m.ans[id]; return x ? { c: x.c, t: +x.t.toFixed(2), ok: q.k ? q.k.includes(norm(x.c)) : x.c === q.a } : { c: -1, t: null, ok: false }; };
    const ia = info(m.a), ib = info(m.b);
    let w = null;
    if (ia.ok && ib.ok) w = ia.t <= ib.t ? m.a : m.b;   // 둘 다 정답이면 더 빠른 사람
    else if (ia.ok) w = m.a; else if (ib.ok) w = m.b;
    const st = (r.stats.q[m.qi] ||= { att: 0, cor: 0 });
    [[A, ia], [B, ib]].forEach(([p, i]) => { if (!p) return; p.att++; st.att++; if (i.ok) { p.cor++; st.cor++; } });
    const wp = w && r.players.get(w);
    if (wp) { wp.pts += WIN_POINTS; wp.wins++; }
    [[m.a, ia, m.b, ib], [m.b, ib, m.a, ia]].forEach(([id, me, oid, op]) => io.to(id).emit('reveal', {
      ans: q.k ? q.k[0] : q.a, short: !!q.k, exp: q.e, me, opp: { ...op, nick: r.players.get(oid)?.nick || '(퇴장)' },
      result: w ? (w === id ? 'win' : 'lose') : 'draw', pts: r.players.get(id)?.pts ?? 0,
    }));
  });
  r.timer = setTimeout(() => round(r), REVEAL_SEC * 1000);
}

function finish(r) {
  r.state = 'end';
  const rank = [...r.players].map(([id, p]) => ({ id, nick: p.nick, pts: p.pts, wins: p.wins }))
    .sort((a, b) => b.pts - a.pts || b.wins - a.wins);
  rank.forEach((x, i) => { x.rank = i > 0 && x.pts === rank[i - 1].pts && x.wins === rank[i - 1].wins ? rank[i - 1].rank : i + 1; });
  const stats = {
    q: Object.entries(r.stats.q).map(([i, s]) => ({ d: QS[i].d || '기본', c: QS[i].c, q: QS[i].q, att: s.att, rate: Math.round(s.cor / s.att * 100) })),
    p: [...r.players.values()].map(p => ({ nick: p.nick, att: p.att, rate: p.att ? Math.round(p.cor / p.att * 100) : 0 })),
  };
  r.players.forEach((_, id) => io.to(id).emit('end', { rank, stats: id === r.host ? stats : null })); // 통계는 방장에게만
  pushRoom(r); pushRooms();
}

io.on('connection', (socket) => {
  socket.on('nick', (n, cb) => {
    n = String(n || '').trim().slice(0, 12);
    if (!n) return cb({ ok: false, msg: '닉네임을 입력해 주세요.' });
    if ([...users.values()].includes(n)) return cb({ ok: false, msg: '이미 사용 중인 닉네임입니다. 다른 닉네임으로 바꿔 주세요.' });
    users.set(socket.id, n); socket.join('lobby');
    cb({ ok: true, nick: n }); socket.emit('rooms', lobbyList());
  });

  socket.on('create', (d, cb) => {
    if (!users.has(socket.id) || socket.data.room) return;
    const r = {
      id: 'r' + seq++, name: String(d?.name || '').trim().slice(0, 20) || users.get(socket.id) + '의 방',
      max: clamp(d?.max, 2, 50, 10), minutes: clamp(d?.minutes, 1, 30, 5),
      state: 'wait', host: socket.id, players: new Map(), pool: [], stats: { q: {} }, no: 1, last: new Set(),
    };
    rooms.set(r.id, r); enter(socket, r); cb && cb({ ok: true });
  });

  socket.on('join', (id, cb) => {
    const r = rooms.get(id);
    if (!r || !users.has(socket.id) || socket.data.room) return cb({ ok: false, msg: '입장할 수 없는 방입니다.' });
    if (r.state !== 'wait') return cb({ ok: false, msg: '이미 시작된 방입니다.' });
    if (r.players.size >= r.max) return cb({ ok: false, msg: '방이 가득 찼습니다.' });
    enter(socket, r); cb({ ok: true });
  });

  socket.on('leave', () => leave(socket));

  socket.on('start', () => {
    const r = rooms.get(socket.data.room);
    if (!r || r.host !== socket.id || r.state !== 'wait') return;
    if (r.players.size < 2) return socket.emit('toast', '시작하려면 2명 이상 필요합니다.');
    r.state = 'play'; r.endAt = Date.now() + r.minutes * 60000;
    io.to(r.id).emit('started', { endAt: r.endAt });
    pushRoom(r); pushRooms();
    r.timer = setTimeout(() => round(r), 2000);
  });

  socket.on('answer', (c) => {
    const r = rooms.get(socket.data.room);
    if (!r || r.state !== 'play' || !r.match) return;
    const m = r.match.find(m => m.a === socket.id || m.b === socket.id);
    if (!m || m.ans[socket.id]) return;
    if (QS[m.qi].k) { c = String(c ?? '').trim().slice(0, 30); if (!c) return; }   // 주관식
    else if (!(c >= 0 && c < 4)) return;                                           // 객관식
    m.ans[socket.id] = { c, t: (Date.now() - r.start) / 1000 };
    socket.emit('picked', c);
  });

  socket.on('disconnect', () => { users.delete(socket.id); leave(socket); });
});

server.listen(process.env.PORT || 3000, () => console.log('http://localhost:3000'));
