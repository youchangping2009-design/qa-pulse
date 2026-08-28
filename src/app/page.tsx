import { DigestDashboard } from "@/components/digest-dashboard";
import { publicConfigStatus } from "@/lib/config";
import { getCachedDigest } from "@/lib/digest";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [digest, config] = await Promise.all([
    getCachedDigest(),
    Promise.resolve(publicConfigStatus()),
  ]);

  return (
    <DigestDashboard
      initialDigest={digest}
      initialConfig={{
        hasToken: config.hasToken,
        authKind: config.authKind,
        tokenMasked: config.tokenMasked,
        localConfigExists: config.localConfigExists,
        configRelPath: config.configRelPath,
      }}
    />
  );
}
