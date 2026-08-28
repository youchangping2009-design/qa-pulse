import { buildDigest } from "@/lib/digest";

async function main() {
  const digest = await buildDigest();
  console.log(
    `已生成 ${digest.weekId}，共 ${digest.repos.length} 个仓库。token=${digest.hasToken}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
