import { ENV } from "./env"

type AgentMode = "local" | "api"

export class Agent {
  private mode: AgentMode

  constructor() {
    this.mode = (process.env.AGENT_MODE as AgentMode) || "local"
  }

  async run(input: string): Promise<string> {
    if (this.mode === "api") {
      return this.apiResponse(input)
    }
    return this.localResponse(input)
  }

  private async apiResponse(input: string): Promise<string> {
    // PLACEHOLDER : brancher invokeLLM plus tard
    return "⚠️ Mode API non configuré"
  }

  private localResponse(input: string): string {
    const text = input.toLowerCase()

    if (text.includes("bonjour")) {
      return "Bonjour 👋 Je suis ton agent IA (mode local)."
    }

    if (text.includes("aide")) {
      return "Je fonctionne sans API pour l’instant. Tu peux développer ton agent librement."
    }

    if (text.includes("projet")) {
      return "Ton projet est bien structuré : client / server / shared."
    }

    return `Réponse locale (fallback) pour : ${input}`
  }
}

let agentInstance: Agent | null = null

export function getAgent(): Agent {
  if (!agentInstance) {
    agentInstance = new Agent()
  }
  return agentInstance
}
