# Cowboy Poker Server (Node.js)

Unity 클라이언트와 TCP 소켓으로 통신하는 메인 게임 서버.
로비, 매칭, 포커 게임 로직을 담당한다.

## 전체 아키텍처

```
Unity 클라이언트
    ├── TCP (port 4000)  →  Node.js 서버  (로비, 매칭, 포커 게임)
    └── UDP              →  C++ 서버      (3D 슈팅 게임 실시간)

Node.js ↔ C++ 서버: HTTP (슈팅 게임 시작/종료 신호)
```

## 포트 구성

| 포트 | 프로토콜 | 용도 |
|------|----------|------|
| 3000 | HTTP | 헬스체크, 로드밸런서 |
| 4000 | TCP | Unity 클라이언트 게임 통신 |

## 프로젝트 구조

```
cowboy-poker-server-node/
├── server.js                       # 진입점. HTTP/TCP 서버 시작
├── .env                            # 환경변수
├── shared/
│   └── protocols/                  # protobuf 정의 파일 (추후 추가)
└── src/
    ├── App.js                      # HTTP 서버 싱글톤. Express + 라우트 관리
    ├── config/
    │   └── config.js               # constants 값들을 구조화해서 export
    ├── constants/
    │   ├── env.js                  # process.env 값 읽어서 export
    │   └── packetType.js           # 패킷 타입 상수 정의
    ├── controllers/
    │   └── healthController.js     # GET /health 핸들러
    ├── handlers/
    │   └── HandlerManager.js       # 패킷 타입 → 핸들러 매핑 및 분기
    └── managers/
        └── SocketManager.js        # TCP 서버 싱글톤. 연결/해제/에러 이벤트 관리
```

## 패킷 처리 흐름

```
Unity 클라이언트
    ↓ TCP
SocketManager.#onConnection(socket)
    ↓ socket.on('data')
패킷 파싱 (헤더에서 packetType 추출)  ← 추후 구현
    ↓
HandlerManager.handle(packetType, socket, payload)
    ↓ handlers[packetType] 조회
{ handler, protoType }
    ↓ protoType으로 protobuf 역직렬화 후
handler(socket, payload)              ← 실제 게임 로직
```

## 패킷 타입 범위

| 범위 | 용도 |
|------|------|
| `0x0100 ~` | 로비 |
| `0x0200 ~` | 매칭 |

## 환경변수 (.env)

| 키 | 기본값 | 설명 |
|----|--------|------|
| `PORT` | 3000 | HTTP 서버 포트 |
| `TCP_PORT` | 4000 | TCP 서버 포트 |
| `NODE_ENV` | development | 실행 환경 |
| `CPP_SERVER_HOST` | localhost | C++ 서버 호스트 |
| `CPP_SERVER_PORT` | 9000 | C++ 서버 포트 |

## 실행

```bash
# 개발
yarn dev

# 프로덕션
yarn start
```

## 요구사항

- Node.js >= 20.0.0
