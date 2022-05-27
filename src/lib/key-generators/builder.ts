import type { KeyGenerator } from '../../types/key-generator'
import type { Config } from '../../types/config'

const build = async (config: Config): Promise<KeyGenerator> => {
  const pwOptions = config.keyGenerator
  pwOptions.type = pwOptions.type || 'random'
  const Generator = (await import(`../key-generators/${pwOptions.type}`)).default
  const keyGenerator = new Generator(pwOptions)

  return keyGenerator
}

export default build
