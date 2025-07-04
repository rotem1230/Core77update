import { IpcClient } from "@/ipc/ipc_client";
import { X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function ChatErrorBox({
  onDismiss,
  error,
  isCore77ProEnabled,
}: {
  onDismiss: () => void;
  error: string;
  isCore77ProEnabled: boolean;
}) {
  if (error.includes("doesn't have a free quota tier")) {
    return (
      <ChatErrorContainer onDismiss={onDismiss}>
        {error}
        <span className="ml-1">
          <ExternalLink href="https://core77.com/pro">
            Access with Core77 Pro.
          </ExternalLink>
        </span>
      </ChatErrorContainer>
    );
  }

  // Handle overload errors with a user-friendly message
  if (error.includes("experiencing high demand") || error.includes("Overloaded")) {
    return (
      <ChatInfoContainer onDismiss={onDismiss}>
        <span>
          Core77 is currently experiencing high demand. Please wait a moment and try again. If the issue persists, try:
          <br />• Waiting 30-60 seconds before sending another message
          <br />• Using a shorter prompt
          <br />• Trying again during off-peak hours
        </span>
      </ChatInfoContainer>
    );
  }

  // Important, this needs to come after the "free quota tier" check
  // because it also includes this URL in the error message
  if (error.includes("https://ai.google.dev/gemini-api/docs/rate-limits")) {
    return (
      <ChatErrorContainer onDismiss={onDismiss}>
        {error}
        <span className="ml-1">
          <ExternalLink href="https://core77.com/pro">
            Upgrade to Core77 Pro.
          </ExternalLink>
        </span>
      </ChatErrorContainer>
    );
  }

  if (error.includes("LiteLLM Virtual Key expected")) {
    return (
      <ChatInfoContainer onDismiss={onDismiss}>
        <span>
          Looks like you don't have a valid Core77 Pro key.{" "}
          <ExternalLink href="https://core77.com/pro">
            Upgrade to Core77 Pro
          </ExternalLink>{" "}
          today.
        </span>
      </ChatInfoContainer>
    );
  }
  if (isCore77ProEnabled && error.includes("ExceededBudget:")) {
    return (
      <ChatInfoContainer onDismiss={onDismiss}>
        <span>
          You have used all of your Core77 AI credits this month.{" "}
          <ExternalLink href="https://academy.core77.com/subscription">
            Upgrade to Core77 Max
          </ExternalLink>{" "}
          and get more AI credits
        </span>
      </ChatInfoContainer>
    );
  }
  // This is a very long list of model fallbacks that clutters the error message.
  if (error.includes("Fallbacks=")) {
    error = error.split("Fallbacks=")[0];
  }
  return <ChatErrorContainer onDismiss={onDismiss}>{error}</ChatErrorContainer>;
}

function ExternalLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      className="underline cursor-pointer text-blue-500 hover:text-blue-700"
      onClick={() => IpcClient.getInstance().openExternalUrl(href)}
    >
      {children}
    </a>
  );
}

function ChatErrorContainer({
  onDismiss,
  children,
}: {
  onDismiss: () => void;
  children: React.ReactNode | string;
}) {
  return (
    <div className="relative mt-2 bg-red-50 border border-red-200 rounded-md shadow-sm p-2 mx-4">
      <button
        onClick={onDismiss}
        className="absolute top-1 left-1 p-1 hover:bg-red-100 rounded"
      >
        <X size={14} className="text-red-500" />
      </button>
      <div className="px-6 py-1 text-sm">
        <div className="text-red-700 text-wrap">
          {typeof children === "string" ? (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                a: ({ children: linkChildren, ...props }) => (
                  <a
                    {...props}
                    onClick={(e) => {
                      e.preventDefault();
                      if (props.href) {
                        IpcClient.getInstance().openExternalUrl(props.href);
                      }
                    }}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    {linkChildren}
                  </a>
                ),
              }}
            >
              {children}
            </ReactMarkdown>
          ) : (
            children
          )}
        </div>
      </div>
    </div>
  );
}

function ChatInfoContainer({
  onDismiss,
  children,
}: {
  onDismiss: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative mt-2 bg-sky-50 border border-sky-200 rounded-md shadow-sm p-2 mx-4">
      <button
        onClick={onDismiss}
        className="absolute top-1 left-1 p-1 hover:bg-sky-100 rounded"
      >
        <X size={14} className="text-sky-600" />
      </button>
      <div className="px-6 py-1 text-sm">
        <div className="text-sky-800 text-wrap">{children}</div>
      </div>
    </div>
  );
}
