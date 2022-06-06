import type { Config } from 'src/types/config'
import KeyGenerator from '.'

const build = async (config: Config): Promise<KeyGenerator> => {
  const pwOptions = config.keyGenerator
  pwOptions.type = pwOptions.type || 'random'
  const Generator = (await import(`../key-generators/${pwOptions.type}`))
    .default
  const keyGenerator = new Generator(pwOptions)

  return keyGenerator
}

export default build
