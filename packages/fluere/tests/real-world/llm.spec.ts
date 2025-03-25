import { expect, test } from "vitest";
import {
  createWorkflow,
  getContext,
  workflowEvent,
  type WorkflowEventData,
  eventSource,
} from "fluere";

test("tool call agent", async () => {
  const startEvent = workflowEvent<string>({
    debugLabel: "startEvent",
  });
  const chatEvent = workflowEvent<string>({
    debugLabel: "chatEvent",
  });
  const toolCallEvent = workflowEvent<string>({
    debugLabel: "toolCallEvent",
  });
  const toolCallResultEvent = workflowEvent<string>({
    debugLabel: "toolCallResultEvent",
  });
  const stopEvent = workflowEvent<string>({
    debugLabel: "stopEvent",
  });
  const workflow = createWorkflow({
    startEvent,
    stopEvent,
  });

  workflow.handle([startEvent], async ({ data }) => {
    const context = getContext();
    await new Promise((r) => setTimeout(r, 100));
    context.sendEvent(chatEvent(data));
  });
  workflow.handle([toolCallEvent], async () => {
    await new Promise((r) => setTimeout(r, 100));
    return toolCallResultEvent("CHAT");
  });
  let once = true;
  workflow.handle([chatEvent], async ({ data }) => {
    await new Promise((r) => setTimeout(r, 100));
    expect(data).toBe("CHAT");
    const context = getContext();
    if (once) {
      once = false;
      const result = (
        await Promise.all(
          ["tool_call"].map(async (tool_call) => {
            context.sendEvent(toolCallEvent(tool_call));
            return context.requireEvent(toolCallResultEvent);
          }),
        )
      )
        .map(({ data }) => data)
        .join("\n");
      context.sendEvent(chatEvent(result));
      // equivalent to
      // return chatEvent(result);
    } else {
      return stopEvent("STOP");
    }
  });

  const stream = workflow.run("CHAT");
  const events: WorkflowEventData<any>[] = [];
  for await (const ev of stream) {
    events.push(ev);
  }
  expect(events.length).toBe(6);
  expect(events.at(-1)!.data).toBe("STOP");
  expect(events.map((e) => eventSource(e))).toEqual([
    startEvent,
    chatEvent,
    toolCallEvent,
    toolCallResultEvent,
    chatEvent,
    stopEvent,
  ]);
});
