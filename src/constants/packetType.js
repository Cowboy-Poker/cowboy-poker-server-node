export const PACKET_TYPE = Object.freeze({
  // Lobby (0x0100 ~)
  C_LobbyEnter: 0x0100,
  S_LobbyEnter: 0x0101,
  C_LobbyLeave: 0x0102,
  S_LobbyLeave: 0x0103,

  // Match (0x0200 ~)
  C_MatchRequest: 0x0200,
  S_MatchRequest: 0x0201,
  C_MatchCancel: 0x0202,
  S_MatchCancel: 0x0203,
  S_MatchFound: 0x0204,
});
