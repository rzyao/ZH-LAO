import pino from 'pino';
import { describe,expect,it } from 'vitest';
import { asExecutor } from '../../src/database/pool.js';
import { createIdentityRepositories,IdentityAuthenticationProvider } from '../../src/modules/identity/infrastructure/index.js';
import { createIdentityPublicQuery,AccessTokenService } from '../../src/modules/identity/application/services/index.js';
import { buildOperationsModule } from '../../src/modules/operations/http/composition.js';
import { buildIdentityTestApp,JWT_TEST_SECRET,TEST_AUDIENCE,TEST_ISSUER,type IdentityTestApp } from '../support/identity-app.js';

const adminUrl=process.env.ADMIN_DATABASE_URL;const integration=adminUrl?describe:describe.skip;const logger=pino({level:'silent'});const direction={native_language:'lo',learning_language:'zh'} as const;
const bearer=(token:string)=>({authorization:`Bearer ${token}`});
async function register(ctx:IdentityTestApp,phone:string){await ctx.app.inject({method:'POST',url:'/api/v1/identity/phone-otp',payload:{phone,purpose:'login'}});const code=ctx.delivery.deliveries.at(-1)!.code;const response=await ctx.app.inject({method:'POST',url:'/api/v1/identity/auth/phone',payload:{phone,otp_code:code,learning_direction:direction}});expect(response.statusCode).toBe(200);return response.json() as {user_id:string;access_token:string};}

integration('Operations E2E with real Identity AuthenticationProvider',()=>{
 it('runs Identity JWT -> Operator -> role permission -> Operations mutation -> Audit and immediate revocation',async()=>{
  const ctx=await buildIdentityTestApp({logger});
  try{
   const executor=asExecutor(ctx.pool);const repositories=createIdentityRepositories;const identityPublic=createIdentityPublicQuery(repositories,executor);const authProvider=new IdentityAuthenticationProvider(new AccessTokenService(JWT_TEST_SECRET,TEST_ISSUER,TEST_AUDIENCE),repositories,executor);const operations=buildOperationsModule({executor,transactionManager:ctx.transactions,identity:identityPublic,authentication:authProvider});
   const rootIdentity=await register(ctx,'+8562051999001');await operations.service.bootstrap(rootIdentity.user_id,'Root Operator');await operations.registerHttp(ctx.app);
   const me=await ctx.app.inject({method:'GET',url:'/api/v1/admin/operations/me',headers:bearer(rootIdentity.access_token)});expect(me.statusCode).toBe(200);expect(me.json().operator.permissions).toHaveLength(26);
   const workerIdentity=await register(ctx,'+8562051999002');const created=await ctx.app.inject({method:'POST',url:'/api/v1/admin/operations/operators',headers:bearer(rootIdentity.access_token),payload:{auth_subject_id:workerIdentity.user_id,display_name:'Worker'}});expect(created.statusCode).toBe(201);const operatorId=created.json().operator.operator_id as string;
   const roleRes=await ctx.app.inject({method:'POST',url:'/api/v1/admin/operations/roles',headers:bearer(rootIdentity.access_token),payload:{code:'e2e_reader',name:'E2E Reader'}});expect(roleRes.statusCode).toBe(201);const roleId=roleRes.json().role.role_id as string;
   expect((await ctx.app.inject({method:'PUT',url:`/api/v1/admin/operations/roles/${roleId}/permissions`,headers:bearer(rootIdentity.access_token),payload:{permission_keys:['operations.operators.read']}})).statusCode).toBe(200);
   expect((await ctx.app.inject({method:'PUT',url:`/api/v1/admin/operations/operators/${operatorId}/roles/${roleId}`,headers:bearer(rootIdentity.access_token)})).statusCode).toBe(200);
   expect((await ctx.app.inject({method:'GET',url:'/api/v1/admin/operations/operators',headers:bearer(workerIdentity.access_token)})).statusCode).toBe(200);
   expect((await ctx.app.inject({method:'POST',url:'/api/v1/admin/operations/roles',headers:bearer(workerIdentity.access_token),payload:{code:'should_fail',name:'Denied'}})).statusCode).toBe(403);
   expect((await ctx.app.inject({method:'POST',url:`/api/v1/admin/operations/roles/${roleId}/disable`,headers:bearer(rootIdentity.access_token)})).statusCode).toBe(200);
   expect((await ctx.app.inject({method:'GET',url:'/api/v1/admin/operations/operators',headers:bearer(workerIdentity.access_token)})).statusCode).toBe(403);
   expect((await ctx.app.inject({method:'POST',url:`/api/v1/admin/operations/roles/${roleId}/enable`,headers:bearer(rootIdentity.access_token)})).statusCode).toBe(200);
   expect((await ctx.app.inject({method:'GET',url:'/api/v1/admin/operations/operators',headers:bearer(workerIdentity.access_token)})).statusCode).toBe(200);
   expect((await ctx.app.inject({method:'POST',url:`/api/v1/admin/operations/operators/${operatorId}/disable`,headers:bearer(rootIdentity.access_token)})).statusCode).toBe(200);
   expect((await ctx.app.inject({method:'GET',url:'/api/v1/admin/operations/operators',headers:bearer(workerIdentity.access_token)})).statusCode).toBe(403);
   const audits=await operations.service.listAudits({operatorId:me.json().operator.operator_id,limit:100});expect(audits.items.some(a=>a.actionKey==='operations.operators.create'&&a.targetId===operatorId)).toBe(true);expect(audits.items.some(a=>a.actionKey==='operations.operator_roles.assign')).toBe(true);expect(audits.items.some(a=>a.actionKey==='operations.roles.disable')).toBe(true);
  }finally{await ctx.dispose();}
 },120_000);
});
