/**
 * @returns list of keys enclosed between {{ and }}
 */
function parseRewriteKeysFrom(string) {
  const regex = /{{(.*?)}}/g;
  const matches = [];
  let match;
  while ((match = regex.exec(string))) {
    matches.push(match[1]);
  }
  return matches;
}

function rewrite(key, value) {
  return (string) => string.replace(`{{${key}}}`, value);
}

function makeTaskIssues({ tasks, tasks_issue_format }) {
  return tasks.map((task) => {
    const title = tasks_issue_format.title.replace(
      /{{(.*?)}}/g,
      (match, key) => task[key]
    );
    const body = tasks_issue_format.body.replace(
      /{{(.*?)}}/g,
      (match, key) => task[key]
    );
    const labels = tasks_issue_format.labels;
    return { title, body, labels };
  });
}

function makeEpicIssue({ epic, task_issue_numbers }) {
  const tasks = task_issue_numbers
    .map((issue_number) => `- [ ] #${issue_number}`)
    .join("\n");

  return {
    title: epic.title,
    body: rewrite("tasks", tasks)(epic.body),
    labels: epic.labels,
  };
}

function splitToChunks(array, chunkSize) {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

exports.parseRewriteKeysFrom = parseRewriteKeysFrom;
exports.makeTaskIssues = makeTaskIssues;
exports.makeEpicIssue = makeEpicIssue;
exports.splitToChunks = splitToChunks;
