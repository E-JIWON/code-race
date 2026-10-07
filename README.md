<div align="center">

# ⌨️ 코드 타자 레이스

**유명 프론트엔드 라이브러리의 실제 코드를 치면서 읽는 타자 게임**

zustand · TanStack Query · Jotai · Redux · React 코드를 한 함수씩 치면, 한글 해설과 「그래서 개발할 땐」 실무 팁이 따라와요.<br />
친구에게 링크를 보내면 서버 없이 브라우저끼리 바로 대결해요.

![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6%20strict-3178c6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646cff?logo=vite&logoColor=white)
![Playwright](https://img.shields.io/badge/E2E-Playwright%2022%EA%B0%9C-2ead33?logo=playwright&logoColor=white)
![Backend](<https://img.shields.io/badge/%EB%B0%B1%EC%97%94%EB%93%9C-%EC%97%86%EC%9D%8C%20(P2P)-black>)

<img src="docs/demo-typing.gif" alt="zustand useShallow를 치는 모습 — 오타, 자동완성 제안, 한글 해설 주석" width="720" />

</div>

## 이런 게임이에요

|                             |                                                                                               |
| --------------------------- | --------------------------------------------------------------------------------------------- |
| 📚 **진짜 오픈소스를 친다** | 라이브러리 6개, 함수 29개. 커밋 SHA로 고정해서 원본 저장소에서 바로 가져와요                  |
| 🇰🇷 **한글 해설 주석**       | 영어 원본 주석은 빼고, 줄마다 무슨 일을 하는지 한글로 달았어요. 주석·들여쓰기는 안 쳐도 돼요  |
| 💡 **그래서 개발할 땐**     | 다 치면 실무 팁이 나와요. _"staleTime 기본값은 0이라 창 포커스 때마다 다시 받아요"_ 같은 것들 |
| ✨ **VS Code처럼 친다**     | 괄호·따옴표 자동 닫기(습관적으로 또 쳐도 OK), 단어 제안 <kbd>Tab</kbd> 완성                   |
| 📈 **Monkeytype식 결과**    | 초 단위 속도 그래프, 오타 위치, 원시 타수, 일관성, 약한 기호                                  |
| 🪪 **캐릭터 카드**          | 등급·손가락 지도·능력치 육각형·「당신은 ~ 타입이군요!」를 이미지로 저장                       |
| 👻 **고스트**               | 같은 함수를 다시 치면 내 최고 기록이 반투명 커서로 같이 달려요                                |
| 🏁 **친구랑 대결**          | 초대 링크 하나로 실시간 레이스. 3초 카운트다운, 진행 막대, 친구 커서, 순위                    |

## 결과 카드

한 판이 끝나면 터미널 창 두 개짜리 카드가 나와요. **합쳐서 / 왼쪽만 / 오른쪽만** 이미지로 저장할 수 있어요.

<p align="center"><img src="docs/demo-result.gif" alt="결과 그래프와 캐릭터 카드" width="720" /></p>

- **왼쪽 · 내 타자 실력**: 이번 판 타수(블록 숫자), 등급 사다리 `초급 ▸ 중급 ▸ 고수 ▸ 킹갓제너럴`, 지금까지 자주 틀린 키가 빨갛게 달아오르는 손가락 지도
- **오른쪽 · 내 능력치**: 속도·정확·리듬·기호·끈기·야행성 육각형, 가장 높은 능력치로 고른 한마디, 패시브(자동완성) · 디버프(가장 많이 틀린 글자)

## 친구랑 대결

<p align="center"><img src="docs/demo-race.gif" alt="두 브라우저에서 동시에 같은 함수를 치는 대결" width="860" /></p>

「친구랑 대결」 → 초대 링크 복사 → 친구가 들어오면 <kbd>Enter</kbd>. 모두 같은 함수로 3초 뒤에 출발해요.<br />
게임 서버 없이 **WebRTC로 브라우저끼리 직접** 주고받고, 처음 서로를 찾을 때만 공개 nostr 릴레이를 빌려 써요([trystero](https://github.com/dmotz/trystero)).

## 코스

쓰는 순서대로 이어 쳐요. 실무보다 구경거리에 가까운 함수는 「심화」로 뒤에 뒀어요.

| 라이브러리         | 함수                                                                                                                       |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| **zustand**        | create → createStore → useStore → useShallow → shallow → subscribeWithSelector                                             |
| **TanStack Query** | hashKey → timeUntilStale → replaceEqualDeep → partialMatchKey → Subscribable<sup>심화</sup> → notifyManager<sup>심화</sup> |
| **Jotai**          | atom → useAtom → useSetAtom → 기본 읽기·쓰기<sup>심화</sup>                                                                |
| **Redux**          | combineReducers → dispatch → applyMiddleware → subscribe<sup>심화</sup> → compose<sup>심화</sup>                           |
| **React**          | objectIs → shallowEqual → useSyncExternalStore → checkIfSnapshotChanged<sup>심화</sup>                                     |
| **작은 명품 유틸** | clsx → nanoid → SWR stableHash → mitt                                                                                      |

## 시작하기

```bash
pnpm install
pnpm dev            # http://localhost:5173
```

| 명령                           | 하는 일                                                                                                   |
| ------------------------------ | --------------------------------------------------------------------------------------------------------- |
| `pnpm build`                   | 타입 검사(`tsc -b`) + 프로덕션 빌드                                                                       |
| `pnpm test:e2e`                | Playwright E2E 22개 (시스템 Chrome 사용)                                                                  |
| `node scripts/engine.check.ts` | 코드 파싱·자동완성·통계·등급 계산 단위 검사 (`--net`을 붙이면 29개 함수를 원본에서 받아 해설 줄까지 검증) |
| `pnpm lint` / `pnpm format`    | oxlint / prettier                                                                                         |
| `pnpm demo:gif`                | README의 GIF를 실제 플레이로 다시 찍기                                                                    |

## 구조

```
src/
├─ app/App.tsx              화면 조립만
├─ features/
│  ├─ typing/               입력 리듀서 · 키 처리 · 코드 파싱 · 자동완성 · 코드 화면
│  ├─ course/               라이브러리·함수 데이터(커밋 고정) · 불러오기 · 코스 선택
│  ├─ race/                 P2P 방 · 카운트다운 · 진행 공유 · 대결 패널
│  └─ result/               결과 그래프 · 통계 · 누적 기록 · 캐릭터 카드
└─ shared/                  localStorage · fetch 캐시 · PNG 저장
e2e/                        Playwright (게임 19개 + 대결 3개)
scripts/                    단위 검사 · 데모 GIF 생성
```

<details>
<summary><b>몇 가지 구현 메모</b></summary>

- **커밋 고정**: 함수마다 저장소 SHA와 줄 범위를 박아둬서, 원본이 바뀌어도 해설 줄 번호가 어긋나지 않아요. `engine.check.ts --net`이 해설이 실제 코드 줄에 붙는지 확인해요.
- **주석 처리**: 줄 단위 스캐너가 문자열·템플릿 리터럴을 피해서 `//`, `/* */`, docstring을 찾아 원본 주석을 빼고, 한글 해설을 같은 들여쓰기로 끼워 넣어요. 긴 에러 메시지 덩어리는 `… (생략)`으로 접어요.
- **등급·상위 %**: 공개된 코드 타자 분포가 없어서, 문장 타자 연구(평균 52WPM, [Dhakal et al. CHI 2018](https://userinterfaces.aalto.fi/136Mkeystrokes/))에 코드 보정 0.7을 곱한 정규분포(평균 182타, 표준편차 70)로 추정해요.
- **개발 모드 대결**: StrictMode가 effect를 join→leave→join 해도 같은 방을 이어 쓰도록 나가기를 잠깐 미뤄요.
- **이미지 저장**: html-to-image가 SVG의 CSS 클래스 색을 못 가져가서, 육각형은 `fill`/`stroke` 속성으로 칠해요.

</details>

## 한계

- 기록은 각자 브라우저(localStorage)에만 저장돼요. 랭킹은 없어요.
- 대결은 공개 릴레이와 WebRTC에 기대요. 회사망처럼 막힌 네트워크끼리는 연결이 안 될 수 있어요.
- 등급 경계와 상위 %는 추정값이라, 실제 플레이 데이터가 쌓이면 보정이 필요해요.

## 크레딧

게임에 나오는 코드는 각 저장소의 원본(모두 MIT 라이선스)을 실행할 때 그대로 불러와 보여주고, 화면마다 원본 링크를 달아요.
[zustand](https://github.com/pmndrs/zustand) · [TanStack Query](https://github.com/TanStack/query) · [Jotai](https://github.com/pmndrs/jotai) · [Redux](https://github.com/reduxjs/redux) · [React](https://github.com/facebook/react) · [clsx](https://github.com/lukeed/clsx) · [nanoid](https://github.com/ai/nanoid) · [mitt](https://github.com/developit/mitt) · [SWR](https://github.com/vercel/swr)<br />
한글 해설과 실무 팁은 직접 썼어요.
