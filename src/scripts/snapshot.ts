import { buildDataset } from "@/lib/build";

async function main() {
  const dataset = await buildDataset();
  console.log(
    `已生成 ${dataset.projects.length} 个项目。token=${dataset.hasToken}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
