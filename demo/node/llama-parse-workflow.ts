import { llamaParseWorkflow } from "../workflows/llama-parse-workflow.js";
import { promiseHandler } from "fluere/interrupter/promise";

promiseHandler(
  () =>
    llamaParseWorkflow.run({
      inputFile: process.argv[2],
      apiKey: process.env.LLAMA_CLOUD_API!,
    }),
  null,
).then(({ data }) => {
  console.log(data.markdown);
});
