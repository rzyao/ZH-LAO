import crypto from 'node:crypto';
import pg from 'pg';
import pino from 'pino';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { asExecutor, createPgPool } from '../../src/database/pool.js';
import { EventHandlerRegistry } from '../../src/events/handler-registry.js';
import { OutboxPublisher } from '../../src/outbox/outbox-publisher.js';
import { OutboxRepository } from '../../src/outbox/outbox-repository.js';
import { OutboxWriter } from '../../src/outbox/outbox-writer.js';
import { newLogicalUuid } from '../../src/ids/uuid.js';
import { PostgresContentAudioSourceReader } from '../../src/modules/content/infrastructure/postgres-content-audio-source-reader.js';
import { ContentPublicQueryService } from '../../src/modules/content/public/content-public-queries.js';
import { AudioRequirementSyncService } from '../../src/modules/audio/application/audio-requirement-sync-service.js';
import { ContentAudioRequirementHandler } from '../../src/modules/audio/worker/content-audio-requirement-handler.js';
import { createTestDatabase, type TestDatabase } from '../support/test-database.js';

const adminUrl=process.env.ADMIN_DATABASE_URL; const integration=adminUrl?describe:describe.skip;
integration('Audio requirement Outbox consumer',()=>{
 let database:TestDatabase; let pool:pg.Pool; const logger=pino({level:'silent'});
 beforeAll(async()=>{database=await createTestDatabase(adminUrl!);pool=createPgPool({url:database.url,poolMin:0,poolMax:4,connectionTimeoutMs:2000,idleTimeoutMs:2000},logger);},120000);
 afterAll(async()=>{await pool?.end();await database?.dispose();});
 it('creates one Slot from a Content event and is idempotent on replay',async()=>{
  const entityId=crypto.randomUUID(),revisionId=crypto.randomUUID(); const id=(await pool.query<{id:string}>('INSERT INTO content.contents(public_id,language,content_type) VALUES($1,$2,$3) RETURNING id',[entityId,'lo','lo_letter'])).rows[0]!.id;
  await pool.query('INSERT INTO content.lo_letters(content_id,character,letter_type,name) VALUES($1,$2,$3,$2)',[id,'ກ','consonant']);
  await pool.query(`INSERT INTO content.content_revisions(revision_public_id,entity_type,entity_id,revision_number,status,snapshot,published_at) VALUES($1,'content',$2,1,'published',$3::jsonb,now())`,[revisionId,entityId,JSON.stringify({audio:{pronunciation:{value:'/k/'}}})]);
  const db=asExecutor(pool), handlers=new EventHandlerRegistry(); handlers.register('content.audio_requirement_changed',new ContentAudioRequirementHandler(new AudioRequirementSyncService(db,new ContentPublicQueryService(new PostgresContentAudioSourceReader(db)))));
  const writer=new OutboxWriter(); const payload={sourceDomain:'content',entityType:'lo_letter',entityId,revisionId,languageCode:'lo',audioRole:'pronunciation'};
  await writer.write(db,{id:newLogicalUuid(),sourceDomain:'content',type:'content.audio_requirement_changed',aggregateType:'content',aggregateId:entityId as never,payload,headers:{},occurredAt:new Date()});
  const publisher=new OutboxPublisher(new OutboxRepository(db),handlers,logger,{batchSize:10,leaseMs:1000}); expect(await publisher.runOnce()).toBe(1);
  expect((await pool.query('SELECT * FROM audio.audio_slots WHERE content_entity_id=$1',[entityId])).rows).toHaveLength(1);
  await writer.write(db,{id:newLogicalUuid(),sourceDomain:'content',type:'content.audio_requirement_changed',aggregateType:'content',aggregateId:entityId as never,payload,headers:{},occurredAt:new Date()}); await publisher.runOnce(); expect((await pool.query('SELECT * FROM audio.audio_slots WHERE content_entity_id=$1',[entityId])).rows).toHaveLength(1);
 });
});
