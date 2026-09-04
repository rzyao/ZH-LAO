import pino from 'pino';
import type { FastifyInstance } from 'fastify';
import { describe,expect,it } from 'vitest';
import { buildApp } from '../../src/bootstrap/build-app.js';
import { asExecutor } from '../../src/database/pool.js';
import { createIdentityRepositories,IdentityAuthenticationProvider } from '../../src/modules/identity/infrastructure/index.js';
import { createIdentityPublicQuery,AccessTokenService } from '../../src/modules/identity/application/services/index.js';
import { buildOperationsModule } from '../../src/modules/operations/http/composition.js';
import { AdminOperatorProvisioningService } from '../../src/modules/admin-operator-provisioning/application/admin-operator-provisioning-service.js';
import { AdminAccountWriter } from '../../src/modules/identity/application/services/admin-account-writer.js';
import { AdminOperatorWriter } from '../../src/modules/operations/application/services/admin-operator-writer.js';
import { PostgresOperationsRepository } from '../../src/modules/operations/infrastructure/repositories.js';
import { buildIdentityTestApp,JWT_TEST_SECRET,TEST_AUDIENCE,TEST_ISSUER,type IdentityTestApp } from '../support/identity-app.js';

const adminUrl=process.env.ADMIN_DATABASE_URL;const integration=adminUrl?describe:describe.skip;const logger=pino({level:'silent'});const direction={native_language:'lo',learning_language:'zh'} as const;
const bearer=(token:string)=>({authorization:`Bearer ${token}`});
// ADR-023 统一信封：HTTP 一律 200，顶层 code 权威，成功载荷在 data 内。
const envelope=(response:{json():unknown})=>response.json() as {code:string;data:Record<string,unknown>;request_id:string};
const success=(response:{json():unknown}):Record<string,unknown>=>{const body=envelope(response);expect(body.code).toBe('OK');return body.data;};
const businessCode=(response:{json():unknown}):string=>envelope(response).code;
async function register(ctx:IdentityTestApp,phone:string){await ctx.app.inject({method:'POST',url:'/api/v1/identity/phone-otp',payload:{phone,purpose:'login'}});const code=ctx.delivery.deliveries.at(-1)!.code;const response=await ctx.app.inject({method:'POST',url:'/api/v1/identity/auth/phone',payload:{phone,otp_code:code,learning_direction:direction}});expect(response.statusCode).toBe(200);const data=success(response);return{user_id:String(data.user_id),access_token:String(data.access_token)};}

integration('Operations E2E with real Identity AuthenticationProvider',()=>{
 it('runs Identity JWT -> Operator -> role permission -> Operations mutation -> Audit and immediate revocation',async()=>{
  const ctx=await buildIdentityTestApp({logger});let operationsApp:FastifyInstance|undefined;
  try{
   const executor=asExecutor(ctx.pool);const repositories=createIdentityRepositories;const identityPublic=createIdentityPublicQuery(repositories,executor);const accessTokens=new AccessTokenService(JWT_TEST_SECRET,TEST_ISSUER,TEST_AUDIENCE);const authProvider=new IdentityAuthenticationProvider(accessTokens,repositories,executor);const provisioning=new AdminOperatorProvisioningService(ctx.transactions,new AdminAccountWriter(),new AdminOperatorWriter(new PostgresOperationsRepository()));const operations=buildOperationsModule({executor,transactionManager:ctx.transactions,identity:identityPublic,authentication:authProvider,provisioning});
   const rootIdentity=await register(ctx,'+8562051999001');await operations.service.bootstrap(rootIdentity.user_id,'Root Operator');
   operationsApp=buildApp({logger,database:executor});await operations.registerHttp(operationsApp);
   const me=await operationsApp.inject({method:'GET',url:'/api/v1/admin/operations/me',headers:bearer(rootIdentity.access_token)});expect(me.statusCode).toBe(200);const meData=success(me);expect(((meData.operator as Record<string,unknown>).permissions as Array<unknown>)).toHaveLength(31);
   const created=await operationsApp.inject({method:'POST',url:'/api/v1/admin/operations/operators',headers:bearer(rootIdentity.access_token),payload:{username:'e2e_worker',display_name:'Worker'}});expect(created.statusCode).toBe(200);expect(businessCode(created)).toBe('OK');const createdData=success(created);expect(String(createdData.initial_password)).toMatch(/^(?=.*[A-Za-z])(?=.*\d).{8,128}$/);const operatorId=String((createdData.operator as Record<string,unknown>).operator_id);const workerToken=accessTokens.issue(String((createdData.operator as Record<string,unknown>).auth_subject_id) as never);
   const roleRes=await operationsApp.inject({method:'POST',url:'/api/v1/admin/operations/roles',headers:bearer(rootIdentity.access_token),payload:{code:'e2e_reader',name:'E2E Reader'}});expect(roleRes.statusCode).toBe(200);expect(businessCode(roleRes)).toBe('OK');const roleId=String((success(roleRes).role as Record<string,unknown>).role_id);
   const setPermissions=await operationsApp.inject({method:'PUT',url:`/api/v1/admin/operations/roles/${roleId}/permissions`,headers:bearer(rootIdentity.access_token),payload:{permission_keys:['operations.operators.read']}});expect(setPermissions.statusCode).toBe(200);expect(businessCode(setPermissions)).toBe('OK');
   const assignRole=await operationsApp.inject({method:'PUT',url:`/api/v1/admin/operations/operators/${operatorId}/roles/${roleId}`,headers:bearer(rootIdentity.access_token)});expect(assignRole.statusCode).toBe(200);expect(businessCode(assignRole)).toBe('OK');
   const workerRead=await operationsApp.inject({method:'GET',url:'/api/v1/admin/operations/operators',headers:bearer(workerToken)});expect(workerRead.statusCode).toBe(200);expect(businessCode(workerRead)).toBe('OK');
   const workerDeniedCreate=await operationsApp.inject({method:'POST',url:'/api/v1/admin/operations/roles',headers:bearer(workerToken),payload:{code:'should_fail',name:'Denied'}});expect(workerDeniedCreate.statusCode).toBe(200);expect(businessCode(workerDeniedCreate)).toBe('FORBIDDEN');
   const disableRole=await operationsApp.inject({method:'POST',url:`/api/v1/admin/operations/roles/${roleId}/disable`,headers:bearer(rootIdentity.access_token)});expect(disableRole.statusCode).toBe(200);expect(businessCode(disableRole)).toBe('OK');
   const workerDeniedDisabledRole=await operationsApp.inject({method:'GET',url:'/api/v1/admin/operations/operators',headers:bearer(workerToken)});expect(workerDeniedDisabledRole.statusCode).toBe(200);expect(businessCode(workerDeniedDisabledRole)).toBe('FORBIDDEN');
   const enableRole=await operationsApp.inject({method:'POST',url:`/api/v1/admin/operations/roles/${roleId}/enable`,headers:bearer(rootIdentity.access_token)});expect(enableRole.statusCode).toBe(200);expect(businessCode(enableRole)).toBe('OK');
   const workerReadAgain=await operationsApp.inject({method:'GET',url:'/api/v1/admin/operations/operators',headers:bearer(workerToken)});expect(workerReadAgain.statusCode).toBe(200);expect(businessCode(workerReadAgain)).toBe('OK');
   const disableOperator=await operationsApp.inject({method:'POST',url:`/api/v1/admin/operations/operators/${operatorId}/disable`,headers:bearer(rootIdentity.access_token)});expect(disableOperator.statusCode).toBe(200);expect(businessCode(disableOperator)).toBe('OK');
   const workerDeniedDisabledOperator=await operationsApp.inject({method:'GET',url:'/api/v1/admin/operations/operators',headers:bearer(workerToken)});expect(workerDeniedDisabledOperator.statusCode).toBe(200);expect(businessCode(workerDeniedDisabledOperator)).toBe('OPERATOR_DISABLED');
   const audits=await operations.service.listAudits({operatorId:String((meData.operator as Record<string,unknown>).operator_id),limit:100});expect(audits.items.some(a=>a.actionKey==='operations.operators.create'&&a.targetId===operatorId)).toBe(true);expect(audits.items.some(a=>a.actionKey==='operations.operator_roles.assign')).toBe(true);expect(audits.items.some(a=>a.actionKey==='operations.roles.disable')).toBe(true);
  }finally{if(operationsApp)await operationsApp.close();await ctx.dispose();}
 },120_000);
});
