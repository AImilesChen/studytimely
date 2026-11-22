import {fail} from './auth-shared.mjs';
export async function requireSyncWrite(env,account,at){
 // Commercial enforcement is opt-in; existing production preview is unchanged.
 if(env.SYNC_REQUIRE_PLUS!=='true')return;
 const row=await env.DB.prepare('SELECT MAX(expires_at) AS expiry FROM account_entitlement_sources WHERE account_id=? AND expires_at>?').bind(account,at).first();
 if(!(row?.expiry>at))fail(403,'PLUS_REQUIRED','Plus is needed to upload or restore cloud changes. Your local work and available cloud downloads are kept. Open Account & data to review membership.');
}
