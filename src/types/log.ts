export type LoggingType =
  | 'File'
  | 'Console'
  | 'Loggly'
  | 'DailyRotateFile'
  | 'Http'
  | 'Memory'
  | 'Webhook'

export interface Logging {
  level: string
  type: LoggingType
}
