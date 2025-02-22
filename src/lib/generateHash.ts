import crypto from "crypto";

async function generateUniqueSubmissionFingerprint(userId: string, code: string, timestamp: number, language: string) {
  const data = `${userId}:${code}:${timestamp}:${language}`;
  return crypto.createHash("sha256").update(data).digest("hex");
}

export default generateUniqueSubmissionFingerprint;
