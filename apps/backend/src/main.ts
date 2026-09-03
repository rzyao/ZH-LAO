import { buildApp } from './bootstrap/build-app.js';
import { installShutdown } from './bootstrap/shutdown.js';
import { configSummary,loadConfig } from './config/env.js';
import { asExecutor,createPgPool } from './database/pool.js';
import { TransactionManager } from './database/transaction-manager.js';
import { createLogger } from './logging/logger.js';
import { identityModule } from './modules/identity/index.js';
import { createIdentityHttpDependencies } from './modules/identity/http/composition.js';
import { createIdentityRepositories,IdentityAuthenticationProvider,OperatorAuditAdapter } from './modules/identity/infrastructure/index.js';
import { createIdentityPublicQuery } from './modules/identity/application/services/identity-public-query.js';
import { AccessTokenService,ConsoleOtpDeliveryProvider,createSecurityLog,UnavailableFacebookCredentialVerifier,UnavailableOtpDeliveryProvider } from './modules/identity/application/services/index.js';
import { buildPlatformModule } from './modules/platform/http/composition.js';
import { platformModule } from './modules/platform/index.js';
import { registerPlatformManagementRoutes } from './modules/platform/http/management-routes.js';
import { buildOperationsModule } from './modules/operations/http/composition.js';
import { OperationsService } from './modules/operations/application/services/index.js';
import { PostgresOperationsRepository } from './modules/operations/infrastructure/index.js';
import { ensureDefaultAdmin } from './modules/identity/application/index.js';

const config=loadConfig();
const logger=createLogger(config.logLevel);
const pool=createPgPool(config.database,logger);
const executor=asExecutor(pool);
const transactionManager=new TransactionManager(pool,logger);

if(process.argv[2]==='--operations-bootstrap'){
  const authSubjectId=process.argv[3];
  const displayName=process.argv.slice(4).join(' ').trim();
  if(!authSubjectId||!displayName){
    process.stderr.write('Usage: pnpm operations:bootstrap <identity-public-uuid> <display-name>\n');
    await pool.end();
    process.exitCode=2;
  }else{
    try{
      const identityPublic=createIdentityPublicQuery(createIdentityRepositories,executor);
      const service=new OperationsService(transactionManager,executor,new PostgresOperationsRepository(),identityPublic);
      const result=await service.bootstrap(authSubjectId,displayName);
      logger.info({operatorId:result.operator.id,roleId:result.role.id},'Operations bootstrap completed');
    }finally{
      await pool.end();
    }
  }
}else{
  const readinessState={isShuttingDown:false};
  const app=buildApp({logger,database:executor,readinessState});
  const identityPublic=createIdentityPublicQuery(createIdentityRepositories,executor);
  const operations=buildOperationsModule({executor,transactionManager,identity:identityPublic,authentication:new IdentityAuthenticationProvider(new AccessTokenService(config.identity.jwtHmacSecret??'',config.identity.jwtIssuer,config.identity.jwtAudience),createIdentityRepositories,executor)});
  const adminAudit=new OperatorAuditAdapter(operations.service,operations.service);
  const identityDependencies=createIdentityHttpDependencies({transactionManager,repositories:createIdentityRepositories,executor,otpHmacSecret:config.identity.otpHmacSecret??'',jwtHmacSecret:config.identity.jwtHmacSecret??'',jwtIssuer:config.identity.jwtIssuer,jwtAudience:config.identity.jwtAudience,facebookVerifier:new UnavailableFacebookCredentialVerifier(),otpDelivery:config.identity.otpProvider==='console'?new ConsoleOtpDeliveryProvider({info:(message,fields)=>logger.info(fields,message)}):new UnavailableOtpDeliveryProvider(),adminAudit,securityLog:createSecurityLog(logger)});
  await identityModule.registerHttp(app,identityDependencies);
  await ensureDefaultAdmin({transactions:transactionManager,repositories:createIdentityRepositories,bootstrap:(subjectId,displayName)=>operations.service.bootstrap(subjectId,displayName),username:config.identity.adminUsername,password:config.identity.adminPassword});
  await operations.registerHttp(app);
  const platform=buildPlatformModule({executor,transactionManager});
  await platformModule.registerHttp(app,{executor,featureFlagUseCases:platform.featureFlagUseCases,appVersionUseCases:platform.appVersionUseCases,announcementUseCases:platform.announcementUseCases,regionUseCases:platform.regionUseCases});
  if(platform.managementService)await registerPlatformManagementRoutes(app,{executor,authentication:identityDependencies.authentication,authorizer:operations.service,audit:operations.service,management:platform.managementService,featureFlags:platform.featureFlagUseCases,runtimeConfigs:platform.runtimeConfigUseCases,appVersions:platform.appVersionUseCases,announcements:platform.announcementUseCases,regions:platform.regionUseCases,menuUseCases:platform.menuUseCases});
  logger.info({config:configSummary(config)},'Starting ZH-LAO backend');
  await app.listen({host:config.host,port:config.port});
  installShutdown({logger,timeoutMs:config.shutdownTimeoutMs,markShuttingDown:()=>{readinessState.isShuttingDown=true;},close:async()=>{await app.close();await pool.end();}});
}
