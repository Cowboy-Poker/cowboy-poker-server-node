/**
 * Health Check Controller
 * GET /health - 서버 상태 확인용 엔드포인트
 */

export function healthCheck(req, res) {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
}
