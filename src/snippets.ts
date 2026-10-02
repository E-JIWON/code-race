// 프론트 라이브러리별 핵심 함수 + 한글 해설.
// sha로 커밋을 고정해서 줄 번호(from/to, notes, skip)가 바뀌지 않음.
// 해설 줄이 실제 코드 줄인지는 `node scripts/engine.check.ts --net`으로 확인.
import type { Block } from './engine'

export type Snippet = Block & {
  id: string
  title: string
  repo: string
  sha: string
  path: string
  summary: string
  notes: { line: number; text: string }[]
}
export type Library = { id: string; name: string; blurb: string; items: Snippet[] }

const ZUSTAND = { repo: 'pmndrs/zustand', sha: 'd7a5583cffd80af515f7dfb69583c95cbdc9e2ce' }
const QUERY = { repo: 'TanStack/query', sha: '94e20031dd0a392831330614b532b3a3b74b3a21' }
const JOTAI = { repo: 'pmndrs/jotai', sha: '6abd0ae3365e02ab432fba4b6e8e6f00aafbf508' }
const REDUX = { repo: 'reduxjs/redux', sha: '56abca4749921d68f40cda20afd2043af9751f72' }
const REACT = { repo: 'facebook/react', sha: '7c6ac13e19fef500b7f669a16bbd01ecc95965ca' }
const CLSX = { repo: 'lukeed/clsx', sha: '925494cf31bcd97d3337aacd34e659e80cae7fe2' }
const NANOID = { repo: 'ai/nanoid', sha: 'bb68abcd59ebb86a849d634320726add6be54d47' }
const MITT = { repo: 'developit/mitt', sha: '6b41670516ed8e8b738612f60491995470aa63b3' }
const SWR = { repo: 'vercel/swr', sha: '9ed1240a4cf799e316a793c22c6800cc6482d389' }

const QUERY_UTILS = 'packages/query-core/src/utils.ts'
const REDUX_STORE = 'src/createStore.ts'

export const LIBRARIES: Library[] = [
  {
    id: 'zustand', name: 'zustand',
    blurb: '가장 가벼운 리액트 상태 관리. 스토어 → 훅 → 최적화 → 미들웨어 순서로 읽어요.',
    items: [
      {
        ...ZUSTAND, id: 'zustand-create-store', title: 'createStore', path: 'src/vanilla.ts', lang: 'ts', from: 60, to: 97,
        summary: 'zustand 스토어의 본체예요. 상태 하나와 구독자 Set 하나가 전부예요. 리액트 없이도 돌아가요.',
        notes: [
          { line: 64, text: '구독자 목록. Set이라 같은 함수는 한 번만 들어가요' },
          { line: 69, text: 'set(state => ...)처럼 함수가 오면 현재 상태로 불러서 다음 상태를 만들어요' },
          { line: 73, text: '같은 값이면 아무것도 안 해요 → 같은 값을 넣으면 리렌더도 없어요' },
          { line: 75, text: '기본은 얕은 병합. replace거나 객체가 아니면 통째로 바꿔요' },
          { line: 79, text: '모든 구독자에게 (새 상태, 이전 상태)를 알려요' },
          { line: 88, text: '구독하면 해지 함수를 돌려줘요' },
          { line: 95, text: '초기 상태는 createState(set, get, api)로 만들어요\n그래서 스토어 안에 액션을 같이 정의할 수 있어요' },
        ],
      },
      {
        ...ZUSTAND, id: 'zustand-use-store', title: 'useStore', path: 'src/react.ts', lang: 'ts', from: 26, to: 37,
        summary: '스토어를 리액트 컴포넌트에 연결하는 훅이에요. 리액트 내장 훅 하나로 끝나요.',
        notes: [
          { line: 30, text: 'React 18의 useSyncExternalStore로 외부 스토어를 구독해요' },
          { line: 31, text: '1) 바뀌면 알려줄 구독 함수' },
          { line: 32, text: '2) 지금 값 — selector로 필요한 조각만 꺼내요' },
          { line: 33, text: '3) 서버 렌더링 때 쓸 값 — 초기 상태 기준' },
          { line: 35, text: 'React DevTools에 지금 값을 보여줘요' },
        ],
      },
      {
        ...ZUSTAND, id: 'zustand-create', title: 'create', path: 'src/react.ts', lang: 'ts', from: 53, to: 61,
        summary: "우리가 쓰는 create((set) => ({ ... }))예요. 스토어를 만들고 그 스토어에 묶인 훅을 돌려줘요.",
        notes: [
          { line: 54, text: '먼저 리액트 없는 순수 스토어를 만들고' },
          { line: 56, text: '그 스토어에 묶인 훅을 만들어요 → useBearStore(s => s.bears)' },
          { line: 58, text: '훅 함수에 스토어 메서드를 붙여요\n그래서 useBearStore.getState()도 돼요' },
        ],
      },
      {
        ...ZUSTAND, id: 'zustand-shallow', title: 'shallow', path: 'src/vanilla/shallow.ts', lang: 'ts', from: 48, to: 74,
        summary: '두 값을 한 단계만 비교해요. 객체뿐 아니라 배열·Map·Set도 다뤄요.',
        notes: [
          { line: 49, text: '참조가 같으면 끝' },
          { line: 52, text: '둘 중 하나라도 객체가 아니면 다른 값' },
          { line: 60, text: '프로토타입이 다르면(배열 vs 객체 등) 다른 값' },
          { line: 63, text: 'Map·Set·배열처럼 순회 가능한 값이면' },
          { line: 64, text: 'entries()가 있으면(Map 등) 키-값 쌍으로, 없으면 순서대로 비교' },
          { line: 70, text: '평범한 객체는 Object.entries로 바꿔서 같은 방식으로 비교' },
        ],
      },
      {
        ...ZUSTAND, id: 'zustand-use-shallow', title: 'useShallow', path: 'src/react/shallow.ts', lang: 'ts', from: 4, to: 12,
        summary: 'useStore(useShallow(s => [s.a, s.b]))처럼 쓰는 그거예요. 매번 새 배열을 만들어도 리렌더를 막아줘요.',
        notes: [
          { line: 5, text: '이전 선택 결과를 ref에 기억해 둬요' },
          { line: 7, text: '새로 고른 값이' },
          { line: 8, text: '얕게 같으면 이전 참조를 그대로 돌려줘요\n→ 참조가 안 바뀌니 리렌더도 없어요' },
        ],
      },
      {
        ...ZUSTAND, id: 'zustand-subscribe-with-selector', title: 'subscribeWithSelector', path: 'src/middleware/subscribeWithSelector.ts', lang: 'ts', from: 46, to: 71,
        summary: '상태의 일부만 골라서 구독하게 해주는 미들웨어예요. 미들웨어가 api를 덮어쓰는 방식을 볼 수 있어요.',
        notes: [
          { line: 50, text: '원래 subscribe를 챙겨 두고 덮어써요' },
          { line: 52, text: '인자가 하나면 예전처럼 상태 전체를 구독' },
          { line: 54, text: '비교 함수 기본값은 Object.is' },
          { line: 56, text: '상태가 바뀔 때마다 고른 조각만 비교해서' },
          { line: 58, text: '조각이 달라졌을 때만 리스너를 불러요' },
          { line: 63, text: 'fireImmediately면 구독하자마자 한 번 불러요' },
          { line: 69, text: '초기 상태는 원래 함수로 그대로 만들어요' },
        ],
      },
    ],
  },
  {
    id: 'tanstack-query', name: 'TanStack Query',
    blurb: '서버 상태 캐싱. 캐시 키를 만드는 법부터 알림을 모아 보내는 법까지.',
    items: [
      {
        ...QUERY, id: 'query-hash-key', title: 'hashKey', path: QUERY_UTILS, lang: 'ts', from: 284, to: 295,
        summary: "쿼리 키를 문자열로 바꿔서 캐시 이름표로 써요. ['todos', { page: 1 }]이 같은 캐시인지 이걸로 판단해요.",
        notes: [
          { line: 285, text: 'JSON.stringify의 두 번째 인자(replacer)로 값을 바꿔치기해요' },
          { line: 286, text: '평범한 객체면 키를 정렬한 새 객체로 바꿔요\n→ { a, b }와 { b, a }가 같은 캐시 키가 돼요' },
        ],
      },
      {
        ...QUERY, id: 'query-partial-match-key', title: 'partialMatchKey', path: QUERY_UTILS, lang: 'ts', from: 301, to: 331,
        summary: "invalidateQueries({ queryKey: ['todos'] })가 ['todos', 1]까지 무효화하는 원리예요. b가 a의 앞부분과 맞으면 일치예요.",
        notes: [
          { line: 302, text: '완전히 같으면 일치' },
          { line: 312, text: '배열은 b가 더 길면 실패, 아니면 b 길이만큼만 비교' },
          { line: 314, text: '칸마다 재귀로 비교해요 (안쪽 객체도 부분 일치)' },
          { line: 321, text: '객체는 b에 있는 키만 확인해요. a에 키가 더 있어도 괜찮아요' },
        ],
      },
      {
        ...QUERY, id: 'query-replace-equal-deep', title: 'replaceEqualDeep', path: QUERY_UTILS, lang: 'ts', from: 341, to: 387,
        summary: '새 데이터에서 이전과 같은 부분은 이전 객체를 그대로 재사용해요(구조적 공유). 그래서 안 바뀐 컴포넌트는 리렌더되지 않아요.',
        notes: [
          { line: 342, text: '참조가 같으면 바로 이전 것을 돌려줘요' },
          { line: 346, text: '500단계보다 깊으면 비교를 포기해요 (안전장치)' },
          { line: 350, text: '배열끼리나 평범한 객체끼리가 아니면 새 값을 그대로 써요' },
          { line: 365, text: '항목이 같으면 이전 항목을 넣고, 같은 항목 수를 세요' },
          { line: 381, text: '객체끼리면 재귀로 들어가요\n안쪽만 바뀌어도 바깥은 새 객체, 안 바뀐 형제는 이전 참조 그대로' },
          { line: 386, text: '전부 같았으면 복사본을 버리고 이전 객체를 통째로 돌려줘요' },
        ],
      },
      {
        ...QUERY, id: 'query-subscribable', title: 'Subscribable', path: 'packages/query-core/src/subscribable.ts', lang: 'ts', from: 6, to: 52,
        summary: 'QueryCache, 옵저버, focusManager 같은 "구독할 수 있는 것"들의 공통 부모 클래스예요.',
        notes: [
          { line: 7, text: '리스너는 Set에 모아요' },
          { line: 10, text: '메서드를 this에 묶어 둬요\n→ subscribe만 떼어서 넘겨도 this가 안 깨져요' },
          { line: 30, text: '자식 클래스가 "첫 구독" 같은 순간을 알 수 있게 불러줘요' },
          { line: 32, text: '해지 함수를 돌려줘요' },
          { line: 45, text: '자식 클래스가 덮어쓰는 자리 (기본은 아무것도 안 함)' },
        ],
      },
      {
        ...QUERY, id: 'query-notify-manager', title: 'notifyManager', path: 'packages/query-core/src/notifyManager.ts', lang: 'ts', from: 21, to: 137,
        skip: [{ from: 75, to: 135, text: 'batchCalls · schedule · 설정 함수들 (생략)' }],
        summary: '쿼리 상태가 여러 번 바뀌어도 리렌더는 한 번만 일어나게, 알림을 모아서(batch) 보내요.',
        notes: [
          { line: 22, text: '모아 둘 알림 큐와, 지금 batch 안에 몇 겹 들어와 있는지' },
          { line: 33, text: 'batch 안이면 큐에 쌓고' },
          { line: 36, text: '아니면 다음 틱(setTimeout 0)에 바로 알려요' },
          { line: 41, text: '큐를 비우면서 쌓인 알림을 한꺼번에 보내요' },
          { line: 64, text: 'batch는 중첩될 수 있어서 카운트로 세요' },
          { line: 69, text: '가장 바깥 batch가 끝날 때만 flush해요' },
        ],
      },
      {
        ...QUERY, id: 'query-helpers', title: '작은 도우미들', path: QUERY_UTILS, lang: 'ts', from: 123, to: 138,
        summary: '쿼리 코어 곳곳에서 쓰는 한 줄짜리 도우미들이에요.',
        notes: [
          { line: 127, text: 'setQueryData(old => ...)처럼 함수면 불러서, 값이면 그대로' },
          { line: 133, text: '타임아웃으로 쓸 수 있는 숫자인지 (0 이상, 무한대 아님)' },
          { line: 137, text: 'staleTime이 지나기까지 남은 ms. 이미 지났으면 0' },
        ],
      },
    ],
  },
  {
    id: 'jotai', name: 'Jotai',
    blurb: '아톰 단위 상태 관리. atom이 사실 "열쇠"일 뿐이라는 걸 보게 돼요.',
    items: [
      {
        ...JOTAI, id: 'jotai-atom', title: 'atom', path: 'src/vanilla/atom.ts', lang: 'ts', from: 98, to: 121,
        summary: 'atom(0)은 사실 설정 객체 하나예요. 값은 여기 없고 store에 저장돼요. atom은 열쇠 역할만 해요.',
        notes: [
          { line: 102, text: '아톰마다 고유한 키를 붙여요 (atom1, atom2, …)' },
          { line: 105, text: '디버그 라벨이 있으면 개발 모드에서 키 옆에 붙여요' },
          { line: 110, text: '함수가 오면 파생 아톰: 읽는 법(read)을 그대로 써요' },
          { line: 113, text: '값이 오면 기본 아톰: 초기값 + 기본 읽기/쓰기' },
          { line: 117, text: '쓰기 함수를 따로 주면 그걸로 덮어써요' },
        ],
      },
      {
        ...JOTAI, id: 'jotai-default-read-write', title: '기본 읽기 · 쓰기', path: 'src/vanilla/atom.ts', lang: 'ts', from: 123, to: 139,
        summary: 'atom(0)처럼 값만 준 기본 아톰이 읽고 쓰는 방법이에요.',
        notes: [
          { line: 124, text: '자기 자신(this)의 값을 store에서 읽어요' },
          { line: 133, text: 'setCount(c => c + 1)처럼 함수면 지금 값으로 계산해서 저장해요' },
        ],
      },
      {
        ...JOTAI, id: 'jotai-use-atom', title: 'useAtom', path: 'src/react/useAtom.ts', lang: 'ts', from: 49, to: 58,
        summary: 'useAtom은 읽기 훅과 쓰기 훅을 합쳐서 [값, setter]로 돌려줄 뿐이에요. useState와 같은 모양이요.',
        notes: [
          { line: 54, text: '값 읽기' },
          { line: 56, text: '값 쓰기 함수' },
        ],
      },
      {
        ...JOTAI, id: 'jotai-use-set-atom', title: 'useSetAtom', path: 'src/react/useSetAtom.ts', lang: 'ts', from: 26, to: 43,
        summary: '아톰에 값을 쓰는 함수만 돌려줘요. 값을 안 읽으니 그 아톰이 바뀌어도 리렌더되지 않아요.',
        notes: [
          { line: 30, text: 'Provider가 있으면 그 store, 없으면 기본 store' },
          { line: 31, text: 'useCallback으로 감싸서 setter 참조가 렌더마다 안 바뀌어요' },
          { line: 33, text: '읽기 전용 아톰에 쓰려고 하면 개발 모드에서 에러' },
          { line: 38, text: '실제 쓰기는 store.set에 맡겨요' },
        ],
      },
    ],
  },
  {
    id: 'redux', name: 'Redux',
    blurb: '리덕스 핵심 전부. compose → 미들웨어 → subscribe → dispatch → combineReducers.',
    items: [
      {
        ...REDUX, id: 'redux-compose', title: 'compose', path: 'src/compose.ts', lang: 'ts', from: 46, to: 61,
        summary: '함수 여러 개를 오른쪽부터 차례로 실행하는 함수 하나로 합쳐요. compose(f, g, h)는 (...args) => f(g(h(...args)))예요.',
        notes: [
          { line: 49, text: '함수가 없으면 받은 값을 그대로 돌려주는 함수' },
          { line: 53, text: '하나면 감쌀 필요 없이 그 함수 그대로' },
          { line: 56, text: '핵심은 reduce 한 줄. 지금까지 합친 a가 b의 결과를 받도록 계속 감싸요' },
        ],
      },
      {
        ...REDUX, id: 'redux-apply-middleware', title: 'applyMiddleware', path: 'src/applyMiddleware.ts', lang: 'ts', from: 53, to: 77,
        summary: '미들웨어(로거, thunk 등)를 dispatch 앞에 줄줄이 끼워 넣어요. 리덕스에서 가장 "아하" 하게 되는 부분이에요.',
        notes: [
          { line: 56, text: '스토어 만드는 함수를 감싸는 함수를 돌려줘요 (enhancer)' },
          { line: 58, text: '미들웨어를 조립하는 동안 dispatch를 부르면 에러' },
          { line: 65, text: '미들웨어들이 받을 API. dispatch는 나중에 완성될 dispatch를 가리켜요' },
          { line: 69, text: '미들웨어마다 API를 넣어서 next => action => … 모양으로 만들고' },
          { line: 70, text: 'compose로 엮어서 원래 dispatch를 겹겹이 감싸요' },
        ],
      },
      {
        ...REDUX, id: 'redux-subscribe', title: 'subscribe', path: REDUX_STORE, lang: 'ts', from: 201, to: 243,
        skip: [
          { from: 202, to: 217, text: '함수인지 검사, dispatch 중 구독 금지 (생략)' },
          { from: 230, to: 235, text: 'dispatch 중 해지 금지 (생략)' },
        ],
        summary: '상태가 바뀔 때 불릴 함수를 등록해요. dispatch 도중에 구독·해지해도 안 꼬이게 목록을 복사해서 써요.',
        notes: [
          { line: 219, text: '해지했는지 기억해요 (두 번 해지 방지)' },
          { line: 221, text: '목록을 고치기 전에 복사본을 만들어요' },
          { line: 222, text: '리스너마다 번호를 붙여 Map에 넣어요' },
          { line: 240, text: '번호로 지우고' },
          { line: 241, text: '다음 dispatch 때 새 목록을 쓰게 해요' },
        ],
      },
      {
        ...REDUX, id: 'redux-dispatch', title: 'dispatch', path: REDUX_STORE, lang: 'ts', from: 270, to: 309,
        skip: [{ from: 271, to: 295, text: '액션이 평범한 객체인지, type이 문자열인지 검사 (생략)' }],
        summary: '상태를 바꾸는 유일한 길이에요. 리듀서를 부르고, 모든 구독자에게 알려요.',
        notes: [
          { line: 297, text: '리듀서 실행 중이라고 표시하고' },
          { line: 299, text: '리듀서로 다음 상태를 계산해요' },
          { line: 304, text: '최신 리스너 목록을 확정하고' },
          { line: 305, text: '모두 불러요. 무엇이 바뀌었는지는 안 알려줘요' },
          { line: 308, text: '받은 액션을 그대로 돌려줘요' },
        ],
      },
      {
        ...REDUX, id: 'redux-combine-reducers', title: 'combineReducers', path: 'src/combineReducers.ts', lang: 'ts', from: 157, to: 200,
        skip: [
          { from: 161, to: 175, text: '모양 검사 · 개발 모드 경고 (생략)' },
          { from: 184, to: 193, text: 'undefined를 돌려주면 에러 (생략)' },
        ],
        summary: '리듀서 여러 개에 키별로 일을 나눠 맡겨서 리듀서 하나로 합쳐요. { user, todos }처럼 상태를 나눠 관리하게 해줘요.',
        notes: [
          { line: 177, text: '하나라도 바뀌었는지 기록해요' },
          { line: 183, text: '키마다 맡은 리듀서에 그 키의 상태만 넘겨요' },
          { line: 195, text: '참조가 달라졌으면 바뀐 것' },
          { line: 197, text: '키 개수가 달라져도 바뀐 것' },
          { line: 199, text: '아무것도 안 바뀌었으면 이전 상태 객체 그대로\n→ 불필요한 리렌더를 막아요' },
        ],
      },
    ],
  },
  {
    id: 'react', name: 'React',
    blurb: '리액트가 값을 비교하는 법과 외부 스토어를 구독하는 법.',
    items: [
      {
        ...REACT, id: 'react-object-is', title: 'objectIs', path: 'packages/shared/objectIs.js', lang: 'js', from: 14, to: 22,
        summary: 'React가 state·props를 비교할 때 쓰는 Object.is예요. 없는 브라우저를 위한 대체 구현이 같이 들어 있어요.',
        notes: [
          { line: 16, text: '+0과 -0은 1/x의 부호(+∞, -∞)로 구분하고\nNaN은 자기 자신과 다른 유일한 값이라 x !== x로 찾아요' },
          { line: 22, text: 'Object.is가 있으면 그걸, 없으면 위 함수를 써요' },
        ],
      },
      {
        ...REACT, id: 'react-shallow-equal', title: 'shallowEqual', path: 'packages/shared/shallowEqual.js', lang: 'js', from: 18, to: 52,
        summary: '두 객체의 첫 단계 속성만 비교해요. React.memo가 "props가 바뀌었나?"를 판단할 때 쓰는 함수예요.',
        notes: [
          { line: 19, text: 'is는 Object.is. NaN끼리는 같고, +0과 -0은 달라요' },
          { line: 32, text: '키 목록을 뽑아서 개수부터 비교해요' },
          { line: 43, text: 'objB에 그 키가 정말 있는지 (값이 undefined인 키와 구분)' },
          { line: 45, text: '값은 한 단계만 비교해요\n→ 렌더마다 새 객체를 넘기면 매번 "바뀌었다"가 돼요' },
        ],
      },
      {
        ...REACT, id: 'react-use-sync-external-store', title: 'useSyncExternalStore', path: 'packages/use-sync-external-store/src/useSyncExternalStoreShimClient.js', lang: 'js', from: 30, to: 135,
        skip: [
          { from: 39, to: 54, text: '오래된 React 18 알파 경고 (생략)' },
          { from: 61, to: 74, text: 'getSnapshot 캐시 안 됨 경고 (생략)' },
        ],
        summary: 'React 18 이전 버전용 대체 구현이에요. zustand 같은 외부 스토어를 리액트에 붙이는 원리가 다 들어 있어요.',
        notes: [
          { line: 60, text: '렌더할 때마다 스토어의 지금 값을 읽어요' },
          { line: 90, text: 'useState를 "강제 리렌더 버튼"으로 써요\n새 객체 {inst}를 넣으면 항상 다른 값이라 다시 그려져요' },
          { line: 96, text: '화면에 반영된 직후 값과 getSnapshot을 기억해 두고' },
          { line: 103, text: '그 사이 스토어가 바뀌었으면 다시 그려요' },
          { line: 116, text: '스토어가 바뀌면 불릴 함수' },
          { line: 124, text: '값이 진짜 바뀌었을 때만 리렌더' },
          { line: 130, text: '구독하고, 해지 함수를 정리 함수로 돌려줘요' },
        ],
      },
      {
        ...REACT, id: 'react-check-snapshot', title: 'checkIfSnapshotChanged', path: 'packages/use-sync-external-store/src/useSyncExternalStoreShimClient.js', lang: 'js', from: 137, to: 149,
        summary: '스토어 값이 바뀌었는지 확인하는 작은 함수예요. 위 훅이 여러 번 불러요.',
        notes: [
          { line: 141, text: '기억해 둔 getSnapshot으로 지금 값을 다시 읽어서' },
          { line: 145, text: 'Object.is로 이전 값과 비교해요' },
          { line: 147, text: '읽다가 에러가 나면 일단 바뀐 걸로 쳐서 다시 그려요' },
        ],
      },
    ],
  },
  {
    id: 'utils', name: '작은 명품 유틸',
    blurb: 'clsx, nanoid, mitt, SWR — 작지만 어디에나 들어 있는 코드.',
    items: [
      {
        ...CLSX, id: 'clsx', title: 'clsx', path: 'src/index.js', lang: 'js', from: 1, to: 41,
        summary: "clsx('btn', { active: isOn })처럼 조건부 클래스 이름을 합쳐줘요. shadcn/ui의 cn() 안에도 들어 있어요.",
        notes: [
          { line: 2, text: '변수를 맨 위에서 var로 한꺼번에 선언 (번들을 바이트 단위로 줄이는 습관)' },
          { line: 11, text: 'if 안에서 대입과 검사를 같이 해요. 빈 문자열이면 건너뜀' },
          { line: 12, text: "'앞에 뭔가 있을 때만 공백 추가'를 한 줄로" },
          { line: 18, text: '객체는 값이 참인 키만 붙여요 → { active: true }가 active로' },
          { line: 33, text: '인자마다 toVal로 문자열을 만들어 이어 붙여요' },
        ],
      },
      {
        ...NANOID, id: 'nanoid', title: 'nanoid', path: 'index.browser.js', lang: 'js', from: 75, to: 84,
        summary: '짧고 겹치지 않는 ID를 만드는 nanoid의 본체예요. 10줄로 UUID보다 짧고 URL에 안전한 ID를 만들어요.',
        notes: [
          { line: 77, text: '브라우저 암호화 API로 진짜 난수 바이트를 받아요\nsize |= 0은 소수점을 버려 정수로 만드는 트릭' },
          { line: 78, text: 'size를 줄여 가며 뒤에서부터 채워요' },
          { line: 81, text: '& 63은 0~255를 0~63으로 줄여요\n문자표가 딱 64글자라 어느 글자도 더 자주 나오지 않아요' },
        ],
      },
      {
        ...MITT, id: 'mitt', title: 'mitt', path: 'src/index.ts', lang: 'ts', from: 46, to: 123,
        summary: '200바이트짜리 이벤트 버스예요. on / off / emit 세 개가 전부예요.',
        notes: [
          { line: 52, text: '이벤트 이름 → 핸들러 배열을 Map으로 관리해요' },
          { line: 68, text: '이미 배열이 있으면 push, 없으면 새 배열' },
          { line: 86, text: 'indexOf가 -1이면 >>> 0이 아주 큰 수가 돼서 아무것도 안 지워요\n→ if 없이 "없으면 무시"를 처리하는 트릭' },
          { line: 88, text: '핸들러를 안 주면 그 이벤트 핸들러를 전부 지워요' },
          { line: 107, text: 'slice()로 복사한 뒤 돌려요. 핸들러 안에서 off해도 안 꼬여요' },
          { line: 113, text: "'*' 와일드카드 핸들러는 이벤트 이름도 같이 받아요" },
        ],
      },
      {
        ...SWR, id: 'swr-stable-hash', title: 'SWR · stableHash', path: 'src/_internal/utils/hash.ts', lang: 'ts', from: 25, to: 76,
        summary: "useSWR(['/api', { id }]) 같은 키를 캐시 키 문자열로 바꿔요. 객체 키 순서가 달라도 같은 해시가 나와요.",
        notes: [
          { line: 34, text: '객체·배열·함수면 (날짜·정규식 제외)' },
          { line: 37, text: 'WeakMap(table)에 이미 해시가 있으면 바로 돌려줘요' },
          { line: 43, text: '먼저 임시 번호를 저장해요\n→ 자기 자신을 참조하는 객체도 무한 재귀에 안 빠져요' },
          { line: 48, text: "배열은 '@' + 각 항목 해시" },
          { line: 56, text: "객체는 '#' + 정렬한 키:값 해시" },
          { line: 66, text: '원시값은 문자열로 (문자열은 따옴표 포함)' },
        ],
      },
    ],
  },
]

export const ALL = LIBRARIES.flatMap((l) => l.items)
export const libraryOf = (id: string) => LIBRARIES.find((l) => l.items.some((s) => s.id === id))!
export const findSnippet = (id: string) => ALL.find((s) => s.id === id)
// 코스 순서대로 다음 (라이브러리 끝이면 다음 라이브러리 첫 함수)
export const nextSnippet = (id: string) => ALL[(ALL.findIndex((s) => s.id === id) + 1) % ALL.length]

export const rawUrl = (s: Snippet) => `https://raw.githubusercontent.com/${s.repo}/${s.sha}/${s.path}`
export const blobUrl = (s: Snippet) => `https://github.com/${s.repo}/blob/${s.sha}/${s.path}#L${s.from}-L${s.to}`
