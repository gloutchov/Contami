export type RendererEnvironment = "development" | "production";

const DEVELOPMENT_ORIGIN = "http://127.0.0.1:5173";
const DEVELOPMENT_SOCKET = "ws://127.0.0.1:5173";

function directive(name: string, values: string[]): string {
  return `${name} ${values.join(" ")}`;
}

export function buildRendererContentSecurityPolicy(environment: RendererEnvironment): string {
  const development = environment === "development";
  return [
    directive("default-src", ["'self'"]),
    directive("script-src", ["'self'"]),
    directive("style-src", ["'self'"]),
    directive("style-src-elem", development ? ["'self'", "'unsafe-inline'"] : ["'self'"]),
    directive("style-src-attr", ["'none'"]),
    directive("img-src", ["'self'", "data:"]),
    directive("font-src", ["'self'"]),
    directive("connect-src", development ? ["'self'", DEVELOPMENT_ORIGIN, DEVELOPMENT_SOCKET] : ["'none'"]),
    directive("object-src", ["'none'"]),
    directive("base-uri", ["'none'"]),
    directive("form-action", ["'none'"]),
    directive("frame-src", ["'none'"]),
  ].join("; ");
}
