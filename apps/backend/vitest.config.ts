import { defineConfig } from 'vitest/config';

// 全局测试超时预算：集成测试需创建数据库并执行 17 个 migration，
// 并行负载下单用例可能超过 vitest 默认 5s。20s 足够覆盖 DB 冷启动，
// 同时仍能在秒级暴露死锁/挂起类问题。
export default defineConfig({
  test: {
    testTimeout: 20_000,
    hookTimeout: 120_000
  }
});