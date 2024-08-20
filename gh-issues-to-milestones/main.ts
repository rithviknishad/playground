import { Octokit } from "@octokit/rest";
import { exit } from "process";

const paginate = <T>(items: readonly T[], batchSize: number) => {
  const result: T[][] = [];
  const _items = [...items];
  while (_items.length) {
    result.push(_items.splice(0, batchSize));
  }
  return result;
};

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN!,
});

const [owner, repo] = process.env.REPO!.split("/");
const milestone = parseInt(process.env.MILESTONE!);
const labels = process.env.LABELS!;

async function getIssues() {
  const issues = await octokit.issues.listForRepo({
    owner,
    repo,
    labels,
    state: "all",
    per_page: 100,
  });

  if (!issues.data.length) {
    console.error("No issues found with the specified label.");
    exit(1);
  }

  return issues.data.map((issue) => issue.number);
}

async function main() {
  const issues = await getIssues();
  console.info(`Found ${issues.length} issues with labels "${labels}".`);

  for (const page of paginate(issues, 10)) {
    console.info(
      `Batch updating ${page.length} issues: (${page
        .map((i) => `#${i}`)
        .join(", ")})`
    );

    await Promise.all(
      page.map((issue_number) =>
        octokit.issues.update({
          owner,
          repo,
          issue_number,
          milestone,
        })
      )
    );
  }
  console.info("Updated.");
}

main();
