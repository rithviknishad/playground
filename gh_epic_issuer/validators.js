const { parseRewriteKeysFrom } = require("./utils");

function validateTasks({ tasks, tasks_issue_format }) {
  console.assert(
    tasks.length > 0,
    "No tasks found. Please add tasks to `tasks`"
  );

  console.assert(
    tasks_issue_format.title,
    "No `title` found in `task_issues_format`"
  );

  console.assert(
    tasks_issue_format.body,
    "No `body` found in `task_issues_format`"
  );

  console.assert(
    tasks_issue_format.labels,
    "No `labels` found in `task_issues_format`"
  );

  const tasksIssueRewriteKeys = [
    ...parseRewriteKeysFrom(tasks_issue_format.title),
    ...parseRewriteKeysFrom(tasks_issue_format.body),
  ];

  console.assert(
    tasksIssueRewriteKeys.length > 0,
    "No rewrite keys found in `task_issues_format`"
  );

  tasks.forEach((task, index) => {
    const taskRewriteKeys = Object.keys(task);
    console.assert(
      taskRewriteKeys.length > 0,
      `No rewrite keys found in \`tasks\` at index ${index}`
    );

    console.assert(
      taskRewriteKeys.every((key) => tasksIssueRewriteKeys.includes(key)),
      `Invalid rewrite keys found in \`tasks\` at index ${index}`
    );
  });
}

function validateEpic(epic) {
  console.assert(epic.title, "No `title` found in `epic_issue_format`");
  console.assert(epic.body, "No `body` found in `epic_issue_format`");
  console.assert(epic.labels, "No `labels` found in `epic_issue_format`");

  console.assert(
    parseRewriteKeysFrom(epic.body).includes("tasks"),
    "No `tasks` rewrite key found in body of `epic_issue_format`"
  );
}

function validate({
  tasks,
  tasks_issue_format,
  epic_issue_format,
  owner,
  repo,
}) {
  console.info("Validating...");

  console.assert(owner && repo, "`GITHUB_REPOSITORY` is not set");
  console.assert(
    process.env.GITHUB_TOKEN,
    "`GITHUB_TOKEN` is not set. Please set it in your environment variables."
  );

  validateTasks({ tasks, tasks_issue_format });
  validateEpic(epic_issue_format);
}

exports.validate = validate;
