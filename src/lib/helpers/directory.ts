import * as path from 'path'

export const getStaticDirectory = (baseDirectory: string) =>
  path.join(baseDirectory, '..', 'static')

export const getStaticItemDirectory = (baseDirectory: string, item: string) =>
  path.join(baseDirectory, '..', 'static', item)
