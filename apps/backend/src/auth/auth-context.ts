import type { LogicalUuid } from '../ids/uuid.js';

export type AuthContext = Readonly<{ subjectId: LogicalUuid; sessionId?: LogicalUuid; passwordChangeRequired?: boolean }>;
