export interface Normal {
  totalRequests: number
  every: number
}

export interface Categories {
  normal: Normal
}

export interface RateLimits {
  end?: boolean
  categories: Categories
}
