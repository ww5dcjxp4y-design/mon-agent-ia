import { getAgent } from "./agent"

async function main() {
  const agent = getAgent()

  console.log(await agent.run("Bonjour"))
  console.log(await agent.run("Aide moi avec le projet"))
  console.log(await agent.run("Parle moi du projet"))
  console.log(await agent.run("Test libre"))
}

main()
