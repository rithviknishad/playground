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

  for (let i = 0; i < taskIssues.length; i++) {
    try {
      const { data } = await octokit.issues.create({
        owner,
        repo,
        ...taskIssues[i],
      });
      issue_numbers.push(data.number);
      console.log(`Raised ${issue_numbers.length}/${taskIssues.length} tasks.`);

      if (issue_numbers.length % 16 === 0) {
        console.log(
          "Waiting for 1 minute before dispatching next batch to avoid rate limit..."
        );
        await new Promise((resolve) => setTimeout(resolve, 60000));
      }
    } catch (error) {
      console.error(error);
      console.error(
        "RATE_LIMIT_HIT. Waiting for 1 minute before dispatching next batch to avoid rate limit..."
      );
      await new Promise((resolve) => setTimeout(resolve, 60000));
    }
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
