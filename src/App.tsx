import { SandboxChat } from "@/sandbox/SandboxChat";

// The mock "Consola de Traspaso" view (Sidebar/Thread/ContextPanel wired to
// conversationsApi.ts's mock queue) has been retired from this render path —
// this app is now dedicated to the sandbox bot tester. Those components and
// their API stay on disk untouched in case they're wanted again; only this
// file stopped importing/rendering them.
export default function App() {
  return <SandboxChat />;
}
