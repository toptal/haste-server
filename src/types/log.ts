export interface Logging {
  level: string
  type:
    | 'File'
    | 'Console'
    | 'Loggly'
    | 'DailyRotateFile'
    | 'Http'
    | 'Memory'
    | 'Webhook'
}
