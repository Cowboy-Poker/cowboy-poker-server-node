/**
 * Redis 세션(문자열 Map) → proto 응답용 객체로 변환
 * S_Login, 씬 이동, 아이템 구매 등 세션 정보가 필요한 모든 응답에서 사용
 */
export const sessionToProto = (session) => ({
  nickname: session.nickname,
  balance: parseInt(session.balance),
  scene: session.scene,
  hp: parseInt(session.hp),
  charType: parseInt(session.char_type),
  posX: parseFloat(session.pos_x),
  posY: parseFloat(session.pos_y),
  posZ: parseFloat(session.pos_z),
  rot: parseFloat(session.rot),
  weapon: parseInt(session.weapon),
  ammoType: parseInt(session.ammo_type),
});
