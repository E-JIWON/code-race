// 유명 오픈소스의 의미 있는 블록 + 해설.
// sha로 커밋을 고정해서 줄 번호(from/to, notes.line)가 바뀌지 않음.
// 노트 줄이 코드 줄인지는 `node scripts/engine.check.ts --net`으로 확인.
import type { Lang } from './engine'

export type Note = { line: number; text: string }
export type Snippet = {
  id: string
  title: string
  repo: string
  sha: string
  path: string
  lang: Lang
  from: number
  to: number
  summary: string
  notes: Note[]
}

const REACT = '7c6ac13e19fef500b7f669a16bbd01ecc95965ca'
const REDUX = '56abca4749921d68f40cda20afd2043af9751f72'
const ZUSTAND = 'd7a5583cffd80af515f7dfb69583c95cbdc9e2ce'
const SVELTE = '020242d6bef059df9ae8c13dc8dbff4c9b31e0ff'
const CLASSNAMES = 'abd6314010de053a09df5acc53e474ff65cea470'
const CLSX = '925494cf31bcd97d3337aacd34e659e80cae7fe2'
const PREACT = '3fcc391adc243d479ab10b4cf70fa609708c9348'
const TANSTACK = '94e20031dd0a392831330614b532b3a3b74b3a21'
const VUE = '4ab865a848a1da3d10fb674f857e5fff13094644'
const EXPRESS = '7ef98448f8b38099ab1ded55e458538ad47a51e7'
const CPYTHON = 'ee782e6143b3fda2e7feb1216ff23860ad39b234'
const GO = '67c1d421161d3d1ae9f5fd005e84c29fd0d9f896'
const LINUX = 'ce1e0223d8ad4211275c82a17ed6d43ab81e13d9'

export const LANG_LABEL: Record<Lang, string> = {
  js: 'JavaScript', ts: 'TypeScript', py: 'Python', go: 'Go', c: 'C',
}

export const SNIPPETS: Snippet[] = [
  {
    id: 'react-shallow-equal', title: 'React · shallowEqual',
    repo: 'facebook/react', sha: REACT, path: 'packages/shared/shallowEqual.js', lang: 'js', from: 13, to: 52,
    summary: '두 객체의 첫 단계 속성만 비교해요. React.memo와 PureComponent가 "props가 바뀌었나?"를 판단할 때 쓰는 함수예요.',
    notes: [
      { line: 19, text: 'is는 Object.is예요. ===와 거의 같지만 NaN끼리는 같다고, +0과 -0은 다르다고 봐요.' },
      { line: 32, text: '키 목록을 뽑아서 개수부터 비교해요. 개수가 다르면 볼 것도 없이 다른 객체예요.' },
      { line: 43, text: 'objB에 그 키가 정말 있는지 확인해요. 값이 undefined인 키와 아예 없는 키를 구분하려는 거예요.' },
      { line: 45, text: '값은 한 단계만 비교해요. 안쪽 객체는 참조만 보니까, 렌더마다 새 객체를 만들어 넘기면 매번 "바뀌었다"가 돼요.' },
    ],
  },
  {
    id: 'redux-compose', title: 'Redux · compose',
    repo: 'reduxjs/redux', sha: REDUX, path: 'src/compose.ts', lang: 'ts', from: 46, to: 61,
    summary: '함수 여러 개를 오른쪽부터 차례로 실행하는 함수 하나로 합쳐요. compose(f, g, h)는 (...args) => f(g(h(...args)))와 같아요. 미들웨어를 겹겹이 감쌀 때 써요.',
    notes: [
      { line: 49, text: '함수가 하나도 없으면 받은 값을 그대로 돌려주는 함수를 줘요. 부르는 쪽에서 빈 경우를 따로 처리할 필요가 없어요.' },
      { line: 53, text: '하나면 감쌀 필요 없이 그 함수 그대로예요.' },
      { line: 56, text: '핵심은 reduce 한 줄이에요. 지금까지 합친 함수 a가 다음 함수 b의 결과를 받도록 계속 감싸요.' },
    ],
  },
  {
    id: 'zustand-create-store', title: 'zustand · createStore',
    repo: 'pmndrs/zustand', sha: ZUSTAND, path: 'src/vanilla.ts', lang: 'ts', from: 60, to: 97,
    summary: 'zustand 스토어의 본체예요. 상태 하나와 구독자 Set 하나가 전부예요. 리액트 없이도 돌아가고, 리액트 훅은 이 위에 얹혀요.',
    notes: [
      { line: 64, text: '구독자는 Set에 모아요. 같은 함수를 두 번 등록해도 한 번만 들어가요.' },
      { line: 71, text: 'set(state => ...)처럼 함수를 넘기면 현재 상태로 불러서 다음 상태를 만들어요.' },
      { line: 73, text: 'Object.is로 같은 값이면 아무것도 안 해요. 같은 값을 다시 넣어도 리렌더가 안 일어나는 이유예요.' },
      { line: 78, text: '기본은 얕은 병합이에요. 바꾼 키만 넘겨도 나머지는 유지돼요. replace를 주면 통째로 바꿔요.' },
      { line: 91, text: '구독하면 해지 함수를 돌려줘요. useEffect 정리 함수에 그대로 넣기 좋은 모양이에요.' },
      { line: 95, text: 'createState에 setState를 넘겨서 초기 상태를 만들어요. 그래서 스토어 안에 액션을 같이 정의할 수 있어요.' },
    ],
  },
  {
    id: 'svelte-writable', title: 'Svelte · writable',
    repo: 'sveltejs/svelte', sha: SVELTE, path: 'packages/svelte/src/store/shared/index.js', lang: 'js', from: 26, to: 95,
    summary: 'Svelte의 쓰기 가능한 스토어예요. 첫 구독자가 생길 때 start를, 마지막 구독자가 떠날 때 stop을 불러서 필요할 때만 일해요.',
    notes: [
      { line: 46, text: 'safe_not_equal로 값이 바뀌었을 때만 알려요. 객체는 내용이 같아도 늘 바뀐 걸로 봐요.' },
      { line: 50, text: 'subscriber_queue는 모든 스토어가 같이 쓰는 큐예요. 알리는 도중에 또 set이 불려도 순서가 꼬이지 않아요.' },
      { line: 52, text: '먼저 invalidate를 전부 부르고 그다음 값을 전달해요. 파생 스토어가 어중간한 중간 상태를 보지 않게요.' },
      { line: 83, text: '첫 구독자가 생기는 순간 start가 실행돼요. 타이머나 소켓을 여기서 열면 돼요.' },
      { line: 89, text: '마지막 구독자가 떠나면 stop으로 정리해요.' },
    ],
  },
  {
    id: 'classnames', title: 'classnames',
    repo: 'JedWatson/classnames', sha: CLASSNAMES, path: 'index.js', lang: 'js', from: 1, to: 50,
    summary: "classNames('btn', { active: isOn })처럼 조건부 클래스 이름을 합쳐줘요. 리액트 초창기부터 쓰인 국민 유틸이에요.",
    notes: [
      { line: 1, text: '{}.hasOwnProperty로 메서드를 미리 꺼내 둬요. 객체에 같은 이름의 키가 있어도 안전하게 부르려고요.' },
      { line: 26, text: '배열이 오면 자기 자신을 다시 불러서 펼쳐요. 중첩 배열도 이렇게 풀려요.' },
      { line: 29, text: '직접 만든 toString이 있는 객체면 그 결과를 써요. CSS 모듈 같은 특수 객체를 위한 장치예요.' },
      { line: 36, text: '객체는 값이 참인 키만 클래스로 넣어요. { active: true }가 active가 되는 원리예요.' },
    ],
  },
  {
    id: 'clsx', title: 'clsx',
    repo: 'lukeed/clsx', sha: CLSX, path: 'src/index.js', lang: 'js', from: 1, to: 41,
    summary: 'classnames와 같은 일을 더 작고 빠르게 해요. shadcn/ui의 cn() 함수 안에도 들어 있어요.',
    notes: [
      { line: 2, text: '변수를 맨 위에서 var로 한꺼번에 선언해요. 번들을 바이트 단위로 줄이려는 습관이에요.' },
      { line: 11, text: 'if 조건 안에서 대입과 검사를 같이 해요. 결과가 빈 문자열이면 건너뛰어요.' },
      { line: 12, text: "str && (str += ' ')는 '앞에 뭔가 있을 때만 공백 추가'를 한 줄로 쓴 거예요." },
      { line: 18, text: 'for...in으로 키를 돌면서 값이 참인 것만 붙여요. classnames와 달리 hasOwnProperty 검사를 빼서 더 빨라요.' },
    ],
  },
  {
    id: 'preact-create-element', title: 'Preact · createElement',
    repo: 'preactjs/preact', sha: PREACT, path: 'src/create-element.js', lang: 'js', from: 7, to: 33,
    summary: 'JSX <div id="a">hi</div>는 빌드하면 createElement("div", { id: "a" }, "hi")가 돼요. 그 함수의 실제 구현이에요.',
    notes: [
      { line: 22, text: 'props를 돌면서 key와 ref만 따로 빼요. 이 둘은 컴포넌트에 전달되지 않는 특별한 값이에요.' },
      { line: 24, text: '함수 컴포넌트가 아닐 때만 ref를 빼요. 함수 컴포넌트에는 ref가 일반 props로 넘어가요.' },
      { line: 29, text: '세 번째 인자부터가 children이에요. 하나면 그대로, 여러 개면 배열로 모아요.' },
      { line: 32, text: '가상 노드 객체를 만들어 돌려줘요. 실제로 화면에 그리는 건 나중 일이에요.' },
    ],
  },
  {
    id: 'tanstack-hash-key', title: 'TanStack Query · hashKey',
    repo: 'TanStack/query', sha: TANSTACK, path: 'packages/query-core/src/utils.ts', lang: 'ts', from: 284, to: 295,
    summary: "쿼리 키를 문자열로 바꿔서 캐시 이름표로 써요. ['todos', { page: 1 }]이 같은 캐시인지 이걸로 판단해요.",
    notes: [
      { line: 285, text: 'JSON.stringify의 두 번째 인자(replacer)로 값을 바꿔치기해요.' },
      { line: 286, text: '평범한 객체면 키를 정렬한 새 객체로 바꿔요. 그래서 { a, b }와 { b, a }가 같은 키가 돼요.' },
    ],
  },
  {
    id: 'tanstack-replace-equal-deep', title: 'TanStack Query · replaceEqualDeep',
    repo: 'TanStack/query', sha: TANSTACK, path: 'packages/query-core/src/utils.ts', lang: 'ts', from: 335, to: 387,
    summary: '새 데이터에서 이전과 똑같은 부분은 이전 객체를 그대로 재사용해요. 구조적 공유라고 하고, 덕분에 안 바뀐 컴포넌트는 리렌더되지 않아요.',
    notes: [
      { line: 342, text: '참조가 같으면 바로 이전 것을 돌려줘요.' },
      { line: 346, text: '500단계보다 깊으면 비교를 포기해요. 너무 깊은 구조에서 끝없이 파고드는 걸 막는 안전장치예요.' },
      { line: 365, text: '항목이 같으면 이전 항목을 복사본에 넣고, 같은 항목 수를 세요.' },
      { line: 381, text: '객체끼리면 재귀로 들어가요. 안쪽만 바뀌어도 바깥은 새 객체, 안 바뀐 형제는 이전 참조 그대로예요.' },
      { line: 386, text: '전부 같았으면 복사본을 버리고 이전 객체를 통째로 돌려줘요.' },
    ],
  },
  {
    id: 'vue-cache-string', title: 'Vue · camelize / hyphenate',
    repo: 'vuejs/core', sha: VUE, path: 'packages/shared/src/general.ts', lang: 'ts', from: 96, to: 120,
    summary: "Vue 내부에서 'on-click' → 'onClick' 같은 문자열 변환을 자주 해요. 같은 입력은 한 번만 계산하도록 결과를 기억해 둬요(메모이제이션).",
    notes: [
      { line: 97, text: 'Object.create(null)은 프로토타입이 없는 빈 객체예요. "toString" 같은 키가 와도 기본 메서드랑 안 부딪혀요.' },
      { line: 100, text: 'hit || (cache[str] = fn(str)) — 있으면 쓰고, 없으면 계산해서 저장하면서 돌려줘요.' },
      { line: 110, text: "camelize: '-글자'를 찾아 대문자로 바꿔요. 'font-size' → 'fontSize'" },
      { line: 119, text: "hyphenate: 단어 경계가 아닌 곳(\\B)의 대문자 앞에 '-'를 넣고 소문자로. 'fontSize' → 'font-size'" },
    ],
  },
  {
    id: 'express-listen', title: 'Express · app.listen',
    repo: 'expressjs/express', sha: EXPRESS, path: 'lib/application.js', lang: 'js', from: 598, to: 606,
    summary: 'app.listen(3000)이 실제로 하는 일이에요. Express 앱은 사실 (req, res)를 받는 함수라서 Node의 http 서버에 그대로 넘길 수 있어요.',
    notes: [
      { line: 599, text: 'this(앱 자체)를 요청 처리 함수로 넘겨요. Express 앱이 함수라서 가능해요.' },
      { line: 602, text: '마지막 인자가 콜백이면 once로 감싸서 딱 한 번만 불리게 해요.' },
      { line: 603, text: '포트가 이미 쓰이는 중이라 실패해도 같은 콜백으로 에러가 전달돼요.' },
      { line: 605, text: '나머지 인자는 Node http 서버의 listen에 그대로 넘겨요.' },
    ],
  },
  {
    id: 'python-bisect-right', title: 'Python · bisect_right',
    repo: 'python/cpython', sha: CPYTHON, path: 'Lib/bisect.py', lang: 'py', from: 21, to: 54,
    summary: '정렬된 리스트에 x를 넣을 자리를 이진 탐색으로 찾아요. 파이썬 표준 라이브러리 bisect 모듈의 핵심이에요.',
    notes: [
      { line: 34, text: 'lo가 음수면 바로 에러를 내요. 파이썬에서 음수 인덱스는 뒤에서부터 세는 거라 결과가 엉망이 돼요.' },
      { line: 42, text: '//는 정수 나눗셈이에요. 범위의 가운데를 잡아요.' },
      { line: 43, text: 'x가 가운데보다 작으면 왼쪽 절반, 아니면 오른쪽 절반으로 줄여요. 같을 때 오른쪽으로 가서 "같은 값들의 오른쪽 끝" 자리가 나와요.' },
      { line: 47, text: 'key가 있을 때를 반복문째로 따로 썼어요. 반복문 안에서 매번 if를 검사하지 않으려는 최적화예요.' },
    ],
  },
  {
    id: 'python-heapq-siftdown', title: 'Python · heapq._siftdown',
    repo: 'python/cpython', sha: CPYTHON, path: 'Lib/heapq.py', lang: 'py', from: 218, to: 233,
    summary: '힙 끝에 넣은 새 값을 부모와 비교하며 위로 올려서 "부모 ≤ 자식" 규칙을 지켜요. heappush가 이 함수를 불러요. (이름은 down인데 값은 위로 올라가요)',
    notes: [
      { line: 226, text: '(pos - 1) >> 1은 (pos - 1) // 2와 같아요. 배열로 만든 힙에서 부모 위치를 구하는 공식이에요.' },
      { line: 228, text: '새 값이 부모보다 작으면 위로 올라가야 해요.' },
      { line: 229, text: '매번 맞바꾸지 않고 부모만 한 칸 내려요. 새 값은 마지막에 딱 한 번 넣어서 대입을 줄여요.' },
      { line: 233, text: '자리를 찾았으면 그때 새 값을 넣어요.' },
    ],
  },
  {
    id: 'go-insertion-sort', title: 'Go · sort.insertionSort',
    repo: 'golang/go', sha: GO, path: 'src/sort/zsortinterface.go', lang: 'go', from: 9, to: 16,
    summary: 'Go의 sort.Sort는 pdqsort를 쓰다가, 구간이 12개 이하로 작아지면 이 삽입 정렬로 바꿔요. 작은 배열에선 단순한 게 제일 빨라요.',
    notes: [
      { line: 11, text: 'i번째 값을 앞쪽의 이미 정렬된 구간에 끼워 넣어요.' },
      { line: 12, text: '앞 값보다 작은 동안 한 칸씩 앞으로 바꿔요. Less와 Swap만 있으면 어떤 자료형이든 정렬돼요.' },
    ],
  },
  {
    id: 'go-builder-grow', title: 'Go · strings.Builder.Grow',
    repo: 'golang/go', sha: GO, path: 'src/strings/builder.go', lang: 'go', from: 64, to: 83,
    summary: 'strings.Builder는 문자열을 이어 붙일 때 매번 새 문자열을 만들지 않고 바이트 버퍼에 쌓아요. 공간이 모자라면 넉넉하게 늘려요.',
    notes: [
      { line: 67, text: '새 용량은 지금의 2배 + n이에요. 두 배씩 늘려서 복사 횟수를 줄이는 고전 전략이에요. MakeNoZero는 0으로 채우는 비용까지 아껴요.' },
      { line: 76, text: 'copyCheck는 Builder가 값으로 복사됐는지 검사해요. 복사본이 같은 버퍼를 건드리면 위험해서 panic을 내요.' },
      { line: 80, text: '남은 공간(cap - len)이 모자랄 때만 늘려요.' },
    ],
  },
  {
    id: 'linux-strcmp', title: 'Linux · strcmp',
    repo: 'torvalds/linux', sha: LINUX, path: 'lib/string.c', lang: 'c', from: 255, to: 273,
    summary: 'C 표준 함수 strcmp의 리눅스 커널 버전이에요. 한 글자씩 비교해서 앞이 작으면 -1, 크면 1, 같으면 0이에요.',
    notes: [
      { line: 262, text: 'unsigned char로 받아요. char가 음수일 수 있는 환경에서도 비교 결과가 똑같게요.' },
      { line: 265, text: '*cs++는 "지금 글자를 읽고 포인터를 한 칸 옮기기"예요.' },
      { line: 269, text: "문자열 끝('\\0')에 닿았는데 여기까지 다 같았으면 두 문자열은 같아요." },
    ],
  },
  {
    id: 'linux-strlen', title: 'Linux · strlen',
    repo: 'torvalds/linux', sha: LINUX, path: 'lib/string.c', lang: 'c', from: 398, to: 405,
    summary: "문자열 길이를 구해요. 끝 표시('\\0')가 나올 때까지 포인터를 옮긴 다음 시작 주소를 빼요.",
    notes: [
      { line: 402, text: '반복문 몸통이 비어 있어요. 조건 검사와 ++sc만으로 일이 끝나요.' },
      { line: 403, text: "/* nothing */과 세미콜론 하나로 '일부러 비웠다'는 걸 보여줘요." },
      { line: 404, text: '포인터끼리 빼면 사이의 칸 수가 나와요. 그게 곧 길이예요.' },
    ],
  },
  {
    id: 'linux-list-add', title: 'Linux · list_add',
    repo: 'torvalds/linux', sha: LINUX, path: 'include/linux/list.h', lang: 'c', from: 156, to: 193,
    summary: '커널 곳곳에서 쓰는 이중 연결 리스트에 항목을 넣어요. 데이터 구조체 안에 list_head를 박아 넣는 방식이라 어떤 구조체든 리스트로 엮을 수 있어요.',
    notes: [
      { line: 169, text: '디버그 설정이 켜져 있으면 리스트가 깨졌는지 먼저 검사해요.' },
      { line: 172, text: 'prev와 next 사이에 new를 끼우려면 포인터 4개를 고쳐야 해요.' },
      { line: 175, text: 'WRITE_ONCE는 컴파일러가 이 쓰기를 쪼개거나 생략하지 못하게 막아요. 다른 CPU가 락 없이 읽을 수 있는 마지막 연결이라서요.' },
      { line: 192, text: 'head 바로 뒤에 넣어요. 그래서 스택처럼 쓸 수 있어요. 끝에 넣는 건 list_add_tail이에요.' },
    ],
  },
]

export const rawUrl = (s: Snippet) => `https://raw.githubusercontent.com/${s.repo}/${s.sha}/${s.path}`
export const blobUrl = (s: Snippet) => `https://github.com/${s.repo}/blob/${s.sha}/${s.path}#L${s.from}-L${s.to}`
export const findSnippet = (id: string) => SNIPPETS.find((s) => s.id === id)
export const randomSnippet = (except?: string) => {
  const pool = SNIPPETS.filter((s) => s.id !== except)
  return pool[Math.floor(Math.random() * pool.length)]
}
