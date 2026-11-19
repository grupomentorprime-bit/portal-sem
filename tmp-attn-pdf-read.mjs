import zlib from "zlib";

const key = process.env.RESEND_API_KEY;
const emails = [
  ["01a1f203-0b46-7133-893c-8b5bdc0116f5", "seminario"],
  ["01a1f202-f601-7840-874b-17746725becf", "mentor"],
];

for (const [id, label] of emails) {
  const list = await fetch(`https://api.resend.com/emails/${id}/attachments`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  const file = (await list.json()).data[0];
  const buf = Buffer.from(await (await fetch(file.download_url)).arrayBuffer());
  const raw = buf.toString("latin1");
  const parts = [];
  const re = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match;
  while ((match = re.exec(raw))) {
    const start = match.index + match[0].indexOf("\n") + 1;
    const end = match.index + match[0].lastIndexOf("endstream") - 1;
    const slice = buf.subarray(start, end);
    try {
      parts.push(zlib.inflateSync(slice).toString("latin1"));
    } catch {
      parts.push(slice.toString("latin1"));
    }
  }
  const text = parts.join("\n");
  const snippets = [...text.matchAll(/\((?:\\.|[^\\)]){1,220}\)/g)].map((item) =>
    item[0].slice(1, -1).replace(/\\([()\\])/g, "$1")
  );
  console.log("---", label, file.filename, buf.length);
  console.log(snippets.filter((line) => /[A-Za-z0-9]/.test(line)).join("\n"));
}
