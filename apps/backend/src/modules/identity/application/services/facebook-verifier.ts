import { AppError } from '../../../../errors/app-error.js';

export type VerifiedFacebookCredential = Readonly<{ providerSubject: string }>;
export interface FacebookCredentialVerifier { verify(credential: string): Promise<VerifiedFacebookCredential> }
export class FakeFacebookCredentialVerifier implements FacebookCredentialVerifier {
  constructor(private readonly subjects: ReadonlyMap<string, string>) {}
  async verify(credential: string): Promise<VerifiedFacebookCredential> { const subject=this.subjects.get(credential); if(!subject) throw new AppError({ code:'INVALID_CREDENTIAL',message:'Invalid credential',httpStatus:401 }); return { providerSubject:subject }; }
}
export class UnavailableFacebookCredentialVerifier implements FacebookCredentialVerifier { async verify(_credential: string): Promise<VerifiedFacebookCredential> { throw new AppError({code:'PROVIDER_UNAVAILABLE',message:'Facebook authentication is unavailable',httpStatus:503}); } }
