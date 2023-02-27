const fs = require("fs");

const items = fs.readFileSync("raw.txt", "utf8").split("\n\n");

const tasks = items.map((item) => {
  const [title, ...rest] = item.split("\n");
  return { title: title.replace("- [ ] ", ""), imports: rest.join("\\n") };
});

console.log(JSON.stringify(tasks, null, 2));
