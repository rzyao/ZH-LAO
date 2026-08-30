import { loadConfig } from '../config/env.js';
import { createPgPool, asExecutor } from '../database/pool.js';
import { TransactionManager } from '../database/transaction-manager.js';
import { createLogger } from '../logging/logger.js';
import { createIdentityRepositories } from '../modules/identity/infrastructure/index.js';
import { createIdentityPublicQuery } from '../modules/identity/application/services/identity-public-query.js';
import { OperationsService } from '../modules/operations/application/services/index.js';
import { PostgresOperationsRepository } from '../modules/operations/infrastructure/index.js';

const subject=process.argv[2]; const displayName=process.argv.slice(3).join(' ').trim();
if(!subject||!displayName){process.stderr.write('Usage: pnpm operations:bootstrap <identity-public-uuid> <display-name>\n');process.exitCode=2;} else {
 const config=loadConfig(); const logger=createLogger(config.logLevel); const pool=createPgPool(config.database,logger); const db=asExecutor(pool);
 try{const identity=createIdentityPublicQuery(createIdentityRepositories,db);const service=new OperationsService(new TransactionManager(pool,logger),db,new PostgresOperationsRepository(),identity);const result=await service.bootstrap(subject,displayName);logger.info({operatorId:result.operator.id,roleId:result.role.id},'Operations bootstrap completed');}
 finally{await pool.end();}
}
