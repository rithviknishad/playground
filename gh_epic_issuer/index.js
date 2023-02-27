require("dotenv").config();

const { epic_issue_format, tasks_issue_format, tasks } = require("./template");
const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");

require("./validators").validate({
  tasks,
  tasks_issue_format,
  epic_issue_format,
  owner,
  repo,
});

const taskIssues = require("./utils").makeTaskIssues({
  tasks,
  tasks_issue_format,
});

const prompt = require("prompt-sync")({ sigint: true });
const acknowledge = prompt(
  `Write ${taskIssues.length} tasks + 1 epic issue to ${owner}/${repo}? [y/N]: `
);

if (acknowledge.toLocaleLowerCase() !== "y") {
  console.log("Aborting...");
  process.exit(0);
}

const { Octokit } = require("@octokit/rest");
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

async function raise_tasks() {
  let issue_numbers = [];

  const taskChunks = require("./utils").splitToChunks(taskIssues, 16);

  for (const taskChunk of taskChunks) {
    const chunk_issue_numbers = await Promise.all(
      taskChunk.map(async (taskIssue) => {
        const { data } = await octokit.issues.create({
          owner,
          repo,
          ...taskIssue,
        });
        return data.number;
      })
    );
    issue_numbers.push(...chunk_issue_numbers);
    console.log(
      `Raised ${chunk_issue_numbers.length}/${taskIssues.length} tasks. Waiting for 10 seconds before dispatching next batch...`
    );
    await new Promise((resolve) => setTimeout(resolve, 10000));
  }

  return issue_numbers;
}

async function raise_epic() {
  const task_issue_numbers = await raise_tasks();

  const epicIssue = require("./utils").makeEpicIssue({
    epic: epic_issue_format,
    task_issue_numbers,
  });

  const { status, data } = await octokit.issues.create({
    owner,
    repo,
    ...epicIssue,
  });

  console.log({ status, data });
}

raise_epic();
