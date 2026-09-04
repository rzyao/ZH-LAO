import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { OK } from '../errors/business-codes.js';

/**
 * 豁免路由列表（ADR-023 契约）：基础设施探针路由不包裹统一业务信封，保留原 HTTP 状态与结构。
 */
const EXEMPT_PATHS = new Set(['/health/live', '/health/ready']);

/**
 * 判断是否已经是统一信封结构（避免重复包裹）
 * 包含 code、request_id，且含 data 或 error 字段。
 * `request_path` 由本 hook 统一补充，避免信任业务处理器提供的路径。
 */
function isAlreadyEnvelope(parsed: unknown): boolean {
  if (typeof parsed !== 'object' || parsed === null) return false;
  const obj = parsed as Record<string, unknown>;
  const hasCode = typeof obj.code === 'string';
  const hasRequestId = typeof obj.request_id === 'string';
  const hasDataOrError = 'data' in obj || 'error' in obj;
  return hasCode && hasRequestId && hasDataOrError;
}

function requestPath(request: FastifyRequest): string {
  return new URL(request.raw.url ?? request.url, 'http://localhost').pathname;
}

/**
 * 统一成功响应信封（ADR-023）：
 * 对所有业务 JSON 成功响应包裹 `{ code: "OK", data, request_id, request_path }` 并强制 HTTP 200。
 * 豁免探针路由及已由 error-handler 输出的错误信封。
 */
export function installResponseEnvelope(app: FastifyInstance): void {
  app.addHook('onSend', (request: FastifyRequest, reply: FastifyReply, payload: unknown, done) => {
    const pathname = requestPath(request);

    // 1. 豁免基础设施健康检查探针
    if (pathname && EXEMPT_PATHS.has(pathname)) {
      done(null, payload);
      return;
    }

    // 2. 如果没有 payload 或者 payload 为空字符串（如 204 或空返回）
    if (payload === undefined || payload === null || payload === '') {
      reply.header('content-type', 'application/json; charset=utf-8');
      reply.code(200);
      const wrapped = JSON.stringify({
        code: OK,
        data: null,
        request_id: request.id,
        request_path: pathname,
      });
      done(null, wrapped);
      return;
    }

    // 3. 检查 payload 是否为字符串形式的 JSON
    if (typeof payload === 'string') {
      try {
        const parsed = JSON.parse(payload);

        // 如果已经是错误信封或已经包裹过的信封，确保 HTTP 200 后直接放行
        if (isAlreadyEnvelope(parsed)) {
          reply.code(200);
          done(null, JSON.stringify({ ...parsed, request_path: pathname }));
          return;
        }

        // 普通 JSON 成功数据包裹进信封
        reply.header('content-type', 'application/json; charset=utf-8');
        reply.code(200);
        const wrapped = JSON.stringify({
          code: OK,
          data: parsed,
          request_id: request.id,
          request_path: pathname,
        });
        done(null, wrapped);
        return;
      } catch {
        // 非 JSON 字符串（例如纯文本等），如果不是业务 JSON，按原样透传
        done(null, payload);
        return;
      }
    }

    // 4. 其他类型（Buffer、Stream 或对象），若为纯对象尝试包裹，否则透传
    if (typeof payload === 'object' && !Buffer.isBuffer(payload)) {
      if (isAlreadyEnvelope(payload)) {
        reply.code(200);
        done(null, { ...payload, request_path: pathname });
        return;
      }
      reply.header('content-type', 'application/json; charset=utf-8');
      reply.code(200);
      const wrapped = JSON.stringify({
        code: OK,
        data: payload,
        request_id: request.id,
        request_path: pathname,
      });
      done(null, wrapped);
      return;
    }

    done(null, payload);
  });
}
