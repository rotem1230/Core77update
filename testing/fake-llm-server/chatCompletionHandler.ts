import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { CANNED_MESSAGE, createStreamChunk } from ".";

let globalCounter = 0;

export const createChatCompletionHandler =
  (prefix: string) => (req: Request, res: Response) => {
    const { stream = false, messages = [] } = req.body;
    console.log("* Received messages", messages);

    // Check if the last message contains "[429]" to simulate rate limiting
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.content === "[429]") {
      return res.status(429).json({
        error: {
          message: "Too many requests. Please try again later.",
          type: "rate_limit_error",
          param: null,
          code: "rate_limit_exceeded",
        },
      });
    }

    let messageContent = CANNED_MESSAGE;

    if (
      lastMessage &&
      typeof lastMessage.content === "string" &&
      lastMessage.content.startsWith("Fix error: Error Line 6 error")
    ) {
      messageContent = `
      Fixing the error...
      <dyad-write path="src/pages/Index.tsx">
      

import { MadeWithCore77 } from "@/components/made-with-core77";

const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">No more errors!</h1>
      </div>
      <MadeWithCore77 />
    </div>
  );
};

export default Index;

      </dyad-write>
      `;
    }
    console.error("LASTMESSAGE", lastMessage);
    // Check if the last message is "[dump]" to write messages to file and return path
    if (
      lastMessage &&
      (Array.isArray(lastMessage.content)
        ? lastMessage.content.some(
            (part: { type: string; text: string }) =>
              part.type === "text" && part.text.includes("[dump]"),
          )
        : lastMessage.content.includes("[dump]"))
    ) {
      messageContent = generateDump(req);
    }

    if (lastMessage && lastMessage.content === "[increment]") {
      globalCounter++;
      messageContent = `counter=${globalCounter}`;
    }

    // Check if the last message starts with "tc=" to load test case file
    if (
      lastMessage &&
      lastMessage.content &&
      typeof lastMessage.content === "string" &&
      lastMessage.content.startsWith("tc=")
    ) {
      const testCaseName = lastMessage.content.slice(3); // Remove "tc=" prefix
      const testFilePath = path.join(
        __dirname,
        "..",
        "..",
        "..",
        "e2e-tests",
        "fixtures",
        prefix,
        `${testCaseName}.md`,
      );

      try {
        if (fs.existsSync(testFilePath)) {
          messageContent = fs.readFileSync(testFilePath, "utf-8");
          console.log(`* Loaded test case: ${testCaseName}`);
        } else {
          console.log(`* Test case file not found: ${testFilePath}`);
          messageContent = `Error: Test case file not found: ${testCaseName}.md`;
        }
      } catch (error) {
        console.error(`* Error reading test case file: ${error}`);
        messageContent = `Error: Could not read test case file: ${testCaseName}.md`;
      }
    }

    if (
      lastMessage &&
      lastMessage.content &&
      typeof lastMessage.content === "string" &&
      lastMessage.content.trim().endsWith("[[STRING_TO_BE_FINISHED]]")
    ) {
      messageContent = `[[STRING_IS_FINISHED]]";</dyad-write>\nFinished writing file.`;
      messageContent += "\n\n" + generateDump(req);
    }

    // Non-streaming response
    if (!stream) {
      return res.json({
        id: `chatcmpl-${Date.now()}`,
        object: "chat.completion",
        created: Math.floor(Date.now() / 1000),
        model: "fake-model",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: messageContent,
            },
            finish_reason: "stop",
          },
        ],
      });
    }

    // Streaming response
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Split the message into characters to simulate streaming
    const message = messageContent;
    const messageChars = message.split("");

    // Stream each character with a delay
    let index = 0;
    const batchSize = 8;

    // Send role first
    res.write(createStreamChunk("", "assistant"));

    // Send all content immediately without delay
    while (index < messageChars.length) {
      const batch = messageChars.slice(index, index + batchSize).join("");
      res.write(createStreamChunk(batch));
      index += batchSize;
    }
    // Send the final chunk
    res.write(createStreamChunk("", "assistant", true));
    res.end();
  };

function generateDump(req: Request) {
  const timestamp = Date.now();
  const generatedDir = path.join(__dirname, "generated");

  // Create generated directory if it doesn't exist
  if (!fs.existsSync(generatedDir)) {
    fs.mkdirSync(generatedDir, { recursive: true });
  }

  const dumpFilePath = path.join(generatedDir, `${timestamp}.json`);

  try {
    fs.writeFileSync(
      dumpFilePath,
      JSON.stringify(
        {
          body: req.body,
          headers: { authorization: req.headers["authorization"] },
        },
        null,
        2,
      ).replace(/\r\n/g, "\n"),
      "utf-8",
    );
    console.log(`* Dumped messages to: ${dumpFilePath}`);
    return `[[dyad-dump-path=${dumpFilePath}]]`;
  } catch (error) {
    console.error(`* Error writing dump file: ${error}`);
    return `Error: Could not write dump file: ${error}`;
  }
}
